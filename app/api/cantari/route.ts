import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CantariApiResponse, Song } from '@/lib/songs';
import staticSongs from '@/lib/generated/songs.json';

// Puerto de handleCantariProxy/forceRefreshCantari (server.js): mismo esquema de
// caché en memoria (TTL) + copia en disco como warm-start/fallback offline, pero
// aquí además normalizamos la respuesta cruda de cantaricrestine.ro a `Song[]`
// (misma transformación que scripts/build-songs-index.mjs aplica a data/Pe-Drumul-Credintei.json,
// porque el JSON crudo de esa API tiene exactamente la misma forma `{ rezultate: {...} }`).
//
// Response envelope (see lib/songs.ts `CantariApiResponse`):
//   { success: boolean, source: 'cache'|'remote'|'disk'|'static', data: Song[], error?: string }
// `source` lets the client know whether it got live data, a disk warm-start, or the
// bundled static fallback — the UI never ends up with zero songs.

export const runtime = 'nodejs';

interface RawCantariRecord {
  id?: number | string;
  denumire?: string;
  descriere?: string;
  url?: string;
  url_fisier?: string;
}

interface RawCantariPayload {
  rezultate?: Record<string, RawCantariRecord>;
}

interface CacheState {
  data: Song[] | null;
  timestamp: number; // unix seconds
}

const CACHE: CacheState = { data: null, timestamp: 0 };
const TTL_SECONDS = Number(process.env.CANTARI_CACHE_TTL || 12 * 60 * 60); // default 12h
const DATA_DIR = path.join(process.cwd(), 'data');
const DISK_CACHE_PATH = path.join(DATA_DIR, 'cantari-pdc.json');
const EXTERNAL_TIMEOUT_MS = 8000;

// --- transform: raw cantaricrestine.ro payload -> Song[] -----------------------
// Ported from scripts/build-songs-index.mjs (normalizeDiacritics / splitCodeAndTitle /
// parseLyrics / dedupe-by-title / sort-by-code), since remote and disk-cached data
// arrive in the same raw shape as data/Pe-Drumul-Credintei.json.

function normalizeDiacritics(text: string): string {
  return text
    .replace(/ş/g, 'ș')
    .replace(/Ş/g, 'Ș')
    .replace(/ţ/g, 'ț')
    .replace(/Ţ/g, 'Ț');
}

function stripDiacriticsForKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function splitCodeAndTitle(denumire: string): { code: string | null; title: string } {
  const m = denumire.trim().match(/^(\d+)\s*[-–.]?\s*(.+)$/);
  if (m) {
    return { code: String(parseInt(m[1], 10)), title: m[2].trim() };
  }
  return { code: null, title: denumire.trim() };
}

function parseLyrics(descriere: string): { verses: string[]; refren: string | null } {
  const stanzas = descriere
    .split(/\r?\n\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const verses: string[] = [];
  let refren: string | null = null;
  for (let i = 0; i < stanzas.length; i += 1) {
    const stanza = stanzas[i];
    if (/^refren\s*:?$/i.test(stanza)) {
      refren = stanzas[i + 1] ?? null;
      i += 1;
      continue;
    }
    verses.push(stanza);
  }
  return { verses, refren };
}

function parseCantariRaw(raw: unknown): Song[] {
  const payload = raw as RawCantariPayload;
  const records = Object.values(payload?.rezultate ?? {});

  const byKey = new Map<
    string,
    { record: RawCantariRecord; code: string | null; title: string; descriere: string }
  >();

  for (const record of records) {
    const denumire = normalizeDiacritics(String(record.denumire ?? '').trim());
    const descriere = normalizeDiacritics(String(record.descriere ?? '').trim());
    if (!denumire || !descriere) continue;

    const { code, title } = splitCodeAndTitle(denumire);
    const dedupeKey = stripDiacriticsForKey(title);

    const existing = byKey.get(dedupeKey);
    if (existing && (existing.code != null || code == null)) continue;
    byKey.set(dedupeKey, { record, code, title, descriere });
  }

  const songs: Song[] = [];
  for (const { record, code, title, descriere } of byKey.values()) {
    const { verses, refren } = parseLyrics(descriere);
    songs.push({
      id: String(record.id),
      code,
      title,
      lyrics: descriere,
      verses,
      refren,
      sourceUrl: record.url || null,
      fileUrl: record.url_fisier || null,
    });
  }

  songs.sort((a, b) => {
    const aCode = a.code != null ? parseInt(a.code, 10) : null;
    const bCode = b.code != null ? parseInt(b.code, 10) : null;
    if (aCode != null && bCode != null) return aCode - bCode;
    if (aCode != null) return -1;
    if (bCode != null) return 1;
    return a.title.localeCompare(b.title, 'ro');
  });

  return songs;
}

// --- fetch / cache chain ---------------------------------------------------------

async function fetchRemote(): Promise<RawCantariPayload> {
  const token = process.env.CANTARI_TOKEN || '123';
  const categorie = 'pdc';
  const limita = '500';
  const external = `https://www.cantaricrestine.ro/api.php?token=${encodeURIComponent(token)}&categorie=${encodeURIComponent(categorie)}&limita=${encodeURIComponent(limita)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  try {
    const res = await fetch(external, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as RawCantariPayload;
  } finally {
    clearTimeout(timer);
  }
}

async function readDiskCache(): Promise<RawCantariPayload | null> {
  try {
    const raw = await readFile(DISK_CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as RawCantariPayload;
  } catch {
    return null;
  }
}

async function writeDiskCache(raw: RawCantariPayload): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DISK_CACHE_PATH, JSON.stringify(raw), 'utf-8');
  } catch {
    // non-fatal: warm-start cache is best-effort
  }
}

// Exported so app/api/cantari/refresh/route.ts can force a re-fetch through the
// same cache/disk/static chain instead of duplicating it.
export async function getSongsData(forceRefresh: boolean): Promise<CantariApiResponse> {
  const now = Math.floor(Date.now() / 1000);

  if (!forceRefresh && CACHE.data && now - CACHE.timestamp < TTL_SECONDS) {
    return { success: true, source: 'cache', data: CACHE.data };
  }

  try {
    const raw = await fetchRemote();
    const data = parseCantariRaw(raw);
    CACHE.data = data;
    CACHE.timestamp = now;
    void writeDiskCache(raw); // warm-start copy for next cold start / outage
    return { success: true, source: 'remote', data };
  } catch (err) {
    console.error('[cantari] remote fetch failed, falling back to disk cache', err);
  }

  const disk = await readDiskCache();
  if (disk) {
    const data = parseCantariRaw(disk);
    CACHE.data = data;
    CACHE.timestamp = now;
    return { success: true, source: 'disk', data };
  }

  // Remote unreachable and no disk cache yet (e.g. fresh deploy): serve the
  // bundled static index so the UI is never left with zero songs.
  const data = staticSongs as unknown as Song[];
  CACHE.data = data;
  CACHE.timestamp = now;
  return { success: true, source: 'static', data };
}

export async function GET() {
  const result = await getSongsData(false);
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
