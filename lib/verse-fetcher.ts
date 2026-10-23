'use client';

import useSWR from 'swr';
import { bookCodeMap } from './book-codes';

const API_BASE = 'https://bible-api.com/data';
const TRANSLATION = 'rccv';

interface ChapterResponse {
  verses?: { text?: string }[];
}

async function fetchChapter(book: string, chapter: number): Promise<ChapterResponse> {
  const code = bookCodeMap[book];
  if (!code) throw new Error(`Carte necunoscută: ${book}`);
  const url = `${API_BASE}/${TRANSLATION}/${code}/${chapter}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Puerto de fetchAndShowVerse/displayVerse (script.js): SWR cachea por capítulo
// (misma granularidad que el apiCache manual original) y expone el texto del versículo pedido.
export function useVerse(book: string, chapter: number, verse: number) {
  const key = book && chapter ? `${TRANSLATION}:${book}:${chapter}` : null;
  const { data, error, isLoading } = useSWR(key, () => fetchChapter(book, chapter), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const verseIndex = verse - 1;
  const text = data?.verses?.[verseIndex]?.text?.trim() ?? null;

  return {
    text,
    isLoading,
    notFound: !isLoading && !error && data != null && !text,
    error: error as Error | undefined,
  };
}
