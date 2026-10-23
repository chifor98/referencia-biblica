'use client';

import { useCallback, useRef, useState } from 'react';
import type { BibleSearchIndex } from '@/lib/voice-search';

export type BibleIndexStatus = 'idle' | 'loading' | 'ready' | 'error';

// Carga perezosa del índice de búsqueda (generado en build time por
// scripts/build-bible-index.mjs). Antes (loadBibleFromXML) se parseaban 4.6MB
// de XML + se generaban los n-gramas en CADA carga de página; ahora solo se
// hace un fetch, y solo cuando el usuario activa un modo de voz que lo necesita.
export function useBibleSearchIndex() {
  const [status, setStatus] = useState<BibleIndexStatus>('idle');
  const dataRef = useRef<BibleSearchIndex | null>(null);
  const loadingPromiseRef = useRef<Promise<BibleSearchIndex> | null>(null);

  const load = useCallback((): Promise<BibleSearchIndex> => {
    if (dataRef.current) return Promise.resolve(dataRef.current);
    if (loadingPromiseRef.current) return loadingPromiseRef.current;

    setStatus('loading');
    const promise = fetch('/bible-index/bible-index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<BibleSearchIndex>;
      })
      .then((data) => {
        dataRef.current = data;
        setStatus('ready');
        return data;
      })
      .catch((err) => {
        setStatus('error');
        loadingPromiseRef.current = null;
        throw err;
      });

    loadingPromiseRef.current = promise;
    return promise;
  }, []);

  return { status, load, index: dataRef };
}
