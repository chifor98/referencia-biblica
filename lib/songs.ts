'use client';

import useSWR from 'swr';

// Shape of a single cântare, produced at build time by scripts/build-songs-index.mjs
// (lib/generated/songs.json) and by the server-side transform in app/api/cantari/route.ts.
export interface Song {
  id: string;
  code: string | null;
  title: string;
  lyrics: string;
  verses: string[];
  refren: string | null;
  sourceUrl: string | null;
  fileUrl: string | null;
}

// Envelope returned by GET /api/cantari and GET /api/cantari/refresh.
// `source` tells the client where the data actually came from — useful for a
// small "cache/offline" indicator, and handy for debugging.
// - 'cache'  : served from the route's in-memory cache (fresh, no refetch needed)
// - 'remote' : just fetched live from cantaricrestine.ro
// - 'disk'   : remote fetch failed, served from the on-disk fallback (data/cantari-pdc.json)
// - 'static' : remote AND disk both unavailable, served from the bundled
//              lib/generated/songs.json so the UI is never empty
export interface CantariApiResponse {
  success: boolean;
  source: 'cache' | 'remote' | 'disk' | 'static';
  data: Song[];
  error?: string;
}

async function fetchSongs(url: string): Promise<Song[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as CantariApiResponse;
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error(json.error || 'Răspuns invalid de la /api/cantari');
  }
  return json.data;
}

// Puerto de fetchLocalList/initSongsBehaviour (screen-songs.js): antes el navegador
// hacía fetch + dedupe + enrich manual sobre 2 JSON crudos; ese trabajo ya está resuelto
// (build time + route handler), así que aquí solo queda cachear la lista con SWR,
// igual que useVerse en verse-fetcher.ts.
export function useSongs() {
  const { data, error, isLoading, mutate } = useSWR<Song[]>('/api/cantari', fetchSongs, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return {
    songs: data ?? [],
    isLoading,
    error: error as Error | undefined,
    refresh: () => mutate(),
  };
}

// Substring filter over title/id/code — same fields and semantics as the old app's
// debounced search (see components/screen-songs.js: inTitle || inId || inCode).
export function filterSongs(songs: Song[], query: string): Song[] {
  const q = query.trim().toLowerCase();
  if (!q) return songs;
  return songs.filter((song) => {
    const inTitle = song.title.toLowerCase().includes(q);
    const inId = song.id.toLowerCase().includes(q);
    const inCode = song.code ? song.code.toLowerCase().includes(q) : false;
    return inTitle || inId || inCode;
  });
}

export function findSongById(songs: Song[], id: string | null): Song | null {
  if (!id) return null;
  return songs.find((song) => song.id === id) ?? null;
}
