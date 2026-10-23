'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bibleStructure, bookNames } from '@/lib/bible-structure';
import { compareReferences, getNextReference, getPrevReference, verseRefPath, type VerseRef } from '@/lib/navigation';
import { useVerse } from '@/lib/verse-fetcher';
import { useFitVerseFontSize } from '@/hooks/useFitVerseFontSize';
import { useVerseHistory } from '@/hooks/useVerseHistory';
import { GridPicker, type GridPickerItem } from '@/components/shared/GridPicker';
import { VerseHistoryPanel } from './VerseHistoryPanel';
import styles from './ReadingScreen.module.css';

type PickerTarget = 'book' | 'chapter' | 'verse' | null;

interface ReadingScreenProps {
  book: string;
  chapter: number;
  verse: number;
}

// Puerto de goToReadingScreen/displayVerse/flipTransition (script.js): la URL
// (params de la ruta) reemplaza a _currentReference + el scraping de texto del
// DOM como fuente de verdad única de "dónde estoy ahora mismo".
export function ReadingScreen({ book, chapter, verse }: ReadingScreenProps) {
  const router = useRouter();
  const { text, isLoading, notFound } = useVerse(book, chapter, verse);

  const ref = useMemo<VerseRef>(() => ({ book, chapter, verse }), [book, chapter, verse]);
  const prevRefRef = useRef<VerseRef>(ref);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);

  useEffect(() => {
    const prev = prevRefRef.current;
    if (prev.book !== ref.book || prev.chapter !== ref.chapter || prev.verse !== ref.verse) {
      setDirection(compareReferences(ref, prev) >= 0 ? 'next' : 'prev');
      prevRefRef.current = ref;
    }
  }, [ref]);

  function navigateTo(target: VerseRef) {
    router.push(verseRefPath(target));
  }

  // Historial de versículos elegidos explícitamente con el picker de
  // libro/capítulo/versículo — los cambios con las flechas del teclado NO se
  // anotan (son solo navegación de paso en paso, no una "selección").
  const { history, addEntry } = useVerseHistory();

  // Navegación por teclado (flechas), puerto del listener global en script.js:
  // ignora cuando el foco está en un campo editable o hay modificadores.
  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      const isEditing = active?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (isEditing || ev.ctrlKey || ev.altKey || ev.metaKey) return;

      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        navigateTo(getNextReference(ref));
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        navigateTo(getPrevReference(ref));
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  // Picker inline sobre la referencia (puerto de showGridPicker + los clics en
  // .ref-book/.ref-chapter/.ref-verse dentro de displayVerse() en script.js).
  // El elemento ancla se guarda en estado (tomado de `ev.currentTarget` en el
  // clic) en vez de leerse de un ref durante el render.
  //
  // Encadenado: hacer clic en la referencia siempre abre primero el selector
  // de libro; elegir un libro encadena al selector de capítulo (de ese libro)
  // y elegir un capítulo encadena al de versículo — recién al elegir el
  // versículo se navega. `pendingBook`/`pendingChapter` guardan las
  // elecciones intermedias sin tocar la URL hasta el último paso.
  const [picker, setPicker] = useState<{
    target: Exclude<PickerTarget, null>;
    anchor: HTMLElement;
    pendingBook: string;
    pendingChapter: number;
  } | null>(null);
  const chapterSpanRef = useRef<HTMLSpanElement>(null);
  const verseSpanRef = useRef<HTMLSpanElement>(null);

  // El punto de entrada de la cadena depende de qué parte se clickea: el
  // libro siempre arranca en libro→capítulo→versículo, pero clickear
  // directamente el capítulo o el versículo salta los pasos anteriores
  // (ya están implícitos: mismo libro, y para versículo también el mismo
  // capítulo) y arranca la cadena justo ahí.
  function openPicker(target: Exclude<PickerTarget, null>) {
    return (ev: React.MouseEvent<HTMLElement>) => {
      setPicker({ target, anchor: ev.currentTarget, pendingBook: book, pendingChapter: chapter });
    };
  }

  function pickerItems(): GridPickerItem[] {
    if (!picker) return [];
    if (picker.target === 'book') return bookNames.map((b) => ({ value: b, label: b }));
    if (picker.target === 'chapter') {
      const chapters = Object.keys(bibleStructure[picker.pendingBook] ?? {}).map(Number).sort((a, b) => a - b);
      return chapters.map((c) => ({ value: String(c), label: String(c) }));
    }
    const totalVerses = bibleStructure[picker.pendingBook]?.[picker.pendingChapter] ?? 0;
    return Array.from({ length: totalVerses }, (_, i) => i + 1).map((v) => ({ value: String(v), label: String(v) }));
  }

  // Ajuste dinámico del tamaño de letra (puerto de fitVerseFontSize en
  // script.js): recalcula cuando cambia el texto o termina de cargar.
  const verseContainerRef = useRef<HTMLDivElement>(null);
  const verseTextRef = useRef<HTMLDivElement>(null);
  useFitVerseFontSize(verseContainerRef, verseTextRef, [text, isLoading, notFound]);

  function handlePickerSelect(item: GridPickerItem) {
    if (!picker) return;
    if (picker.target === 'book') {
      const selectedBook = item.value;
      const bookChapters = Object.keys(bibleStructure[selectedBook] ?? {}).map(Number).sort((a, b) => a - b);
      const nextChapter = bookChapters.includes(picker.pendingChapter) ? picker.pendingChapter : bookChapters[0];
      setPicker({
        target: 'chapter',
        anchor: chapterSpanRef.current ?? picker.anchor,
        pendingBook: selectedBook,
        pendingChapter: nextChapter,
      });
    } else if (picker.target === 'chapter') {
      const selectedChapter = parseInt(item.value, 10);
      setPicker({
        target: 'verse',
        anchor: verseSpanRef.current ?? picker.anchor,
        pendingBook: picker.pendingBook,
        pendingChapter: selectedChapter,
      });
    } else {
      const target = { book: picker.pendingBook, chapter: picker.pendingChapter, verse: parseInt(item.value, 10) };
      addEntry(target);
      navigateTo(target);
      setPicker(null);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.grid}>
        <div className={styles.mainSlot}>
          <div className={styles.sheet}>
            <div className={styles.verseContainer} ref={verseContainerRef}>
              <div
                key={`${book}-${chapter}-${verse}`}
                ref={verseTextRef}
                className={`${styles.verseText} ${direction === 'next' ? styles.flipInRight : direction === 'prev' ? styles.flipInLeft : ''}`}
                aria-live="polite"
              >
                {isLoading ? '' : notFound ? '' : text}
              </div>
              <div className={styles.status} data-empty={!isLoading && !notFound}>
                {isLoading ? (
                  'Se încarcă...'
                ) : notFound ? (
                  `Versiculul ${chapter}:${verse} nu a fost găsit.`
                ) : (
                  <>
                    <span className={styles.refPart} onClick={openPicker('book')}>
                      {book}
                    </span>{' '}
                    <span ref={chapterSpanRef} className={styles.refPart} onClick={openPicker('chapter')}>
                      {chapter}
                    </span>
                    <span className={styles.refColon}>:</span>
                    <span ref={verseSpanRef} className={styles.refPart} onClick={openPicker('verse')}>
                      {verse}
                    </span>
                    <VerseHistoryPanel history={history} onSelect={navigateTo} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {picker && (
        <GridPicker
          anchor={picker.anchor}
          items={pickerItems()}
          ariaLabel={`Selectează ${picker.target}`}
          onSelect={handlePickerSelect}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
