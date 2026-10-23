'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { VerseRef } from '@/lib/navigation';

const STORAGE_KEY = 'referencia-biblica:verse-history';
const MAX_ENTRIES = 50;

type Listener = () => void;

// Historial de versículos visitados navegando con las flechas del teclado
// (nunca al elegir con el picker). Vive fuera de React (módulo + sessionStorage)
// y se sincroniza vía useSyncExternalStore: a diferencia de un useState +
// useEffect que lea sessionStorage, esto evita tanto el lint
// react-hooks/set-state-in-effect como el hydration mismatch (el snapshot del
// servidor es siempre `[]`, y React reconcilia con el valor real del cliente
// sin el parpadeo/warning de un setState posterior al montaje).
const listeners = new Set<Listener>();
let cached: VerseRef[] | null = null;

function readFromStorage(): VerseRef[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): VerseRef[] {
  if (cached === null) cached = readFromStorage();
  return cached;
}

// Debe ser una referencia estable: un `[]` nuevo en cada llamada hace que
// useSyncExternalStore crea que el snapshot cambió en cada render y entre en
// bucle infinito.
const EMPTY_HISTORY: VerseRef[] = [];

function getServerSnapshot(): VerseRef[] {
  return EMPTY_HISTORY;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function sameRef(a: VerseRef, b: VerseRef): boolean {
  return a.book === b.book && a.chapter === b.chapter && a.verse === b.verse;
}

function pushEntry(ref: VerseRef) {
  const prev = getSnapshot();
  if (prev[0] && sameRef(prev[0], ref)) return;
  const next = [ref, ...prev].slice(0, MAX_ENTRIES);
  cached = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage no disponible (modo privado, cuota, etc.): el historial
    // sigue funcionando en memoria durante la sesión actual.
  }
  listeners.forEach((listener) => listener());
}

export function useVerseHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const addEntry = useCallback((ref: VerseRef) => pushEntry(ref), []);
  return { history, addEntry };
}
