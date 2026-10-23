'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bibleStructure, bookNames } from '@/lib/bible-structure';
import { GridPicker, type GridPickerItem } from '@/components/shared/GridPicker';
import styles from './SelectionScreen.module.css';

type PickerTarget = 'book' | 'chapter' | 'verse';

// Puerto de screen-selection.js (handleBookSelection/handleChapterSelection):
// mismo flujo encadenado Carte -> Capitol -> Verset, pero con el mismo
// GridPicker (grid paginado, sin barra de scroll nativa) que usa la pantalla
// de lectura en vez del CustomDropdown (lista simple) que tenía antes —
// mismo "picker" en toda la app. Igual que en ReadingScreen, elegir en un
// paso encadena automáticamente al siguiente.
export function SelectionScreen() {
  const router = useRouter();
  const [book, setBook] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [picker, setPicker] = useState<{ target: PickerTarget; anchor: HTMLElement } | null>(null);

  const chapterTriggerRef = useRef<HTMLSpanElement>(null);
  const verseTriggerRef = useRef<HTMLSpanElement>(null);

  const chapters = useMemo(() => (book ? Object.keys(bibleStructure[book]).map(Number).sort((a, b) => a - b) : []), [book]);
  const verses = useMemo(() => {
    if (!book || chapter == null) return [];
    const total = bibleStructure[book][chapter] ?? 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [book, chapter]);

  function openPicker(target: PickerTarget) {
    return (ev: React.MouseEvent<HTMLElement>) => {
      if (target === 'chapter' && !book) return;
      if (target === 'verse' && chapter == null) return;
      setPicker({ target, anchor: ev.currentTarget });
    };
  }

  function pickerItems(): GridPickerItem[] {
    if (!picker) return [];
    if (picker.target === 'book') return bookNames.map((b) => ({ value: b, label: b }));
    if (picker.target === 'chapter') return chapters.map((c) => ({ value: String(c), label: String(c) }));
    return verses.map((v) => ({ value: String(v), label: String(v) }));
  }

  function handlePickerSelect(item: GridPickerItem) {
    if (!picker) return;
    if (picker.target === 'book') {
      setBook(item.value);
      setChapter(null);
      setPicker({ target: 'chapter', anchor: chapterTriggerRef.current ?? picker.anchor });
    } else if (picker.target === 'chapter') {
      setChapter(parseInt(item.value, 10));
      setPicker({ target: 'verse', anchor: verseTriggerRef.current ?? picker.anchor });
    } else if (book && chapter != null) {
      router.push(`/biblia/leer/${encodeURIComponent(book)}/${chapter}/${item.value}`);
      setPicker(null);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.display}>
        <span className={styles.mainLabel}>Carte</span>
        <span className={styles.bigText} onClick={openPicker('book')}>
          {book ?? 'Selectează'}
        </span>

        <div className={styles.chapterVerseRow}>
          <span className={styles.fieldWrap} data-disabled={!book}>
            <span className={styles.mainLabel}>Capitol</span>
            <span ref={chapterTriggerRef} className={styles.smallText} onClick={openPicker('chapter')}>
              {chapter ?? '—'}
            </span>
          </span>
          <span className={styles.fieldWrap} data-disabled={chapter == null}>
            <span className={styles.mainLabel}>Verset</span>
            <span ref={verseTriggerRef} className={styles.smallText} onClick={openPicker('verse')}>
              —
            </span>
          </span>
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
