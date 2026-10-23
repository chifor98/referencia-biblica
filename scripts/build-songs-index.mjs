// Genera lib/generated/songs.json a partir de data/Pe-Drumul-Credintei.json.
// Puerto a build-time de tools/generate-lista-denumirii-PDC.js + la lógica de
// dedupe/orden que antes corría en el navegador (components/screen-songs.js),
// y además estructura la letra en versos/refrén (antes era un solo bloque pre-wrap).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_PATH = path.join(__dirname, '..', 'data', 'Pe-Drumul-Credintei.json');
const OUT_DIR = path.join(__dirname, '..', 'lib', 'generated');
const OUT_PATH = path.join(OUT_DIR, 'songs.json');

// El origen mezcla ş/ţ (cedilla) y ș/ț (virgulă, forma correcta en română) —
// se normaliza todo a la forma correcta para que el texto sea consistente.
function normalizeDiacritics(text) {
  return text
    .replace(/ş/g, 'ș').replace(/Ş/g, 'Ș')
    .replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț');
}

function stripDiacriticsForKey(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// "008 - Lauda pe Domnul" / "259 Auzi tu glasul" -> { code: "8"/"259", title: "Lauda pe Domnul" }
function splitCodeAndTitle(denumire) {
  const m = denumire.trim().match(/^(\d+)\s*[-–.]?\s*(.+)$/);
  if (m) {
    return { code: String(parseInt(m[1], 10)), title: m[2].trim() };
  }
  return { code: null, title: denumire.trim() };
}

// Divide la letra en estrofas por líneas en blanco; una estrofa que es solo
// "Refren:" marca que la estrofa siguiente es el refrén, no un verso más.
function parseLyrics(descriere) {
  const stanzas = descriere
    .split(/\r?\n\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const verses = [];
  let refren = null;
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

async function main() {
  console.log('🎵 Leyendo dataset de cânturi...');
  const raw = JSON.parse(await readFile(SRC_PATH, 'utf-8'));
  const records = Object.values(raw.rezultate ?? {});
  console.log(`   ${records.length} registros en origen`);

  // El origen suele listar cada himno dos veces (con y sin el número delante,
  // p.ej. "174 Sus in cer..." y "Sus in cer..."). Nos quedamos con una sola
  // entrada por título normalizado, prefiriendo siempre la que trae código.
  const byKey = new Map();
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

  const songs = [];
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

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(songs), 'utf-8');

  console.log(`✅ ${songs.length} cântări indexate (${records.length - songs.length} duplicadas omitidas).`);
  console.log(`   → ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((err) => {
  console.error('❌ Error generando el índice de cânturi:', err);
  process.exit(1);
});
