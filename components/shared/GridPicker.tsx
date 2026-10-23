'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './GridPicker.module.css';

export interface GridPickerItem {
  value: string;
  label: string;
}

interface GridPickerProps {
  anchor: HTMLElement;
  items: GridPickerItem[];
  pageSize?: number;
  ariaLabel?: string;
  onSelect: (item: GridPickerItem) => void;
  onClose: () => void;
}

// Puerto de showGridPicker() (script.js): picker paginado en grid (5 columnas,
// 25 ítems/página) usado como selector inline al hacer clic sobre la
// referencia mostrada en la pantalla de lectura (book/chapter/verse).
//
// El posicionamiento (medir el ancla + colisión con los bordes del viewport)
// se hace mutando `container.style` directamente dentro de un
// useLayoutEffect en vez de pasar por estado de React: es una sincronización
// puramente imperativa con el DOM medido tras el layout, sin necesidad de
// disparar un re-render — evita el patrón "setState dentro de un efecto".
export function GridPicker({ anchor, items, pageSize = 25, ariaLabel = 'Selector', onSelect, onClose }: GridPickerProps) {
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Lado (arriba/abajo del ancla) decidido una sola vez por ancla, no en cada
  // página: si se recalculara con cada página, el popup podía saltar de un
  // lado a otro simplemente porque la última página tiene menos filas (y por
  // tanto menos altura) que las anteriores.
  const sideRef = useRef<'below' | 'above'>('below');
  const sideAnchorRef = useRef<HTMLElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice(page * pageSize, page * pageSize + pageSize);
  // Se rellena hasta `pageSize` con celdas vacías para que la cuadrícula
  // (y por tanto la altura del popup) sea igual en todas las páginas.
  const paddedItems: Array<GridPickerItem | null> = [...pageItems];
  while (paddedItems.length < pageSize) paddedItems.push(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isNewAnchor = sideAnchorRef.current !== anchor;
    sideAnchorRef.current = anchor;

    const position = () => {
      const rect = anchor.getBoundingClientRect();
      const gap = 8;
      const margin = 6;

      if (isNewAnchor) {
        const spaceBelow = window.innerHeight - rect.bottom - gap;
        sideRef.current = spaceBelow < el.offsetHeight ? 'above' : 'below';
      }

      const top =
        sideRef.current === 'above'
          ? Math.max(gap, rect.top + window.scrollY - el.offsetHeight - margin)
          : rect.bottom + window.scrollY + margin;
      const left = rect.left + window.scrollX;
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;

      const cRect = el.getBoundingClientRect();
      if (cRect.right > window.innerWidth - 8) {
        el.style.left = `${Math.max(8, left - (cRect.right - (window.innerWidth - 8)))}px`;
      }
      el.style.visibility = 'visible';
      el.querySelector<HTMLButtonElement>('.gridPickerCell')?.focus();
    };

    // Posicionar en dos pasadas: la primera con las dimensiones ya conocidas,
    // la segunda (rAF) corrige tras el layout final del contenido paginado.
    position();
    const raf = requestAnimationFrame(position);
    return () => cancelAnimationFrame(raf);
  }, [anchor, page]);

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) onClose();
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      const active = document.activeElement;
      if (!containerRef.current?.contains(active)) return;
      const cells = Array.from(containerRef.current.querySelectorAll<HTMLButtonElement>('.gridPickerCell'));
      if (!cells.length) return;
      const idx = cells.indexOf(active as HTMLButtonElement);
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        cells[Math.min(cells.length - 1, idx + 1)]?.focus();
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        cells[Math.max(0, idx - 1)]?.focus();
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        cells[Math.min(cells.length - 1, idx + 5)]?.focus();
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        cells[Math.max(0, idx - 5)]?.focus();
      }
    };
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 10);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={containerRef}
      className={styles.container}
      role="dialog"
      aria-label={ariaLabel}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        visibility: 'hidden',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10000,
      }}
    >
      <div className={styles.grid}>
        {paddedItems.map((item, i) =>
          item ? (
            <button
              key={item.value}
              type="button"
              className={`${styles.cell} gridPickerCell`}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect(item);
              }}
            >
              {item.label}
            </button>
          ) : (
            <div key={`empty-${i}`} className={styles.cell} style={{ visibility: 'hidden' }} aria-hidden="true" />
          ),
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.info}>
          {page + 1}/{totalPages}
        </div>
        <div className={styles.pager}>
          <button type="button" className={styles.pagerBtn} disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            ◀
          </button>
          <button
            type="button"
            className={styles.pagerBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            ▶
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
