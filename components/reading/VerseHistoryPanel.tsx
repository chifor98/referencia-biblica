'use client';

import type { VerseRef } from '@/lib/navigation';
import styles from './VerseHistoryPanel.module.css';

interface VerseHistoryPanelProps {
  history: VerseRef[];
  onSelect: (ref: VerseRef) => void;
}

// Panel discreto (casi invisible hasta pasar el ratón por encima), al lado
// del número de versículo, con el historial de versículos elegidos con el
// picker. Muestra como máximo 3 filas a la vez; con más entradas, la rueda
// del ratón desplaza la lista dentro del mismo espacio en vez de hacer
// crecer el panel.
export function VerseHistoryPanel({ history, onSelect }: VerseHistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {history.map((entry, i) => (
          <li key={`${entry.book}-${entry.chapter}-${entry.verse}-${i}`}>
            <button type="button" className={styles.entry} onClick={() => onSelect(entry)}>
              {entry.book} {entry.chapter}:{entry.verse}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
