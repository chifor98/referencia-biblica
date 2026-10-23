'use client';

import { useState } from 'react';
import type { MicSettings } from '@/lib/mic-settings';
import styles from './MicSettingsModal.module.css';

interface MicSettingsModalProps {
  settings: MicSettings;
  onChange: (updater: (prev: MicSettings) => MicSettings) => void;
  onReset: () => void;
  onClose: () => void;
}

type Tab = 'autocitire' | 'literal';

// Puerto limpio de mic-settings.html/js: se elimina la pestaña "IA" y el
// checkbox "caseSensitive" (confirmado que nada los leía) y todos los
// controles aplican y persisten en vivo — sin el botón "Guardar" del
// original, que solo cubría la mitad de los campos (inconsistencia de UX).
// El Reset ahora sí aplica y persiste los valores por defecto (antes solo
// tocaba el formulario visual).
export function MicSettingsModal({ settings, onChange, onReset, onClose }: MicSettingsModalProps) {
  const [tab, setTab] = useState<Tab>('autocitire');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(ev) => ev.stopPropagation()}>
        <div className={styles.header}>
          <h2>Configurare Microfon</h2>
          <button type="button" onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={tab === 'autocitire' ? styles.tabActive : styles.tab} onClick={() => setTab('autocitire')}>
            Autocitire
          </button>
          <button type="button" className={tab === 'literal' ? styles.tabActive : styles.tab} onClick={() => setTab('literal')}>
            Recunoaștere Literală
          </button>
        </div>

        <div className={styles.body}>
          {tab === 'autocitire' && (
            <>
              <div className={styles.field}>
                <label>
                  Viteză ({settings.autocite.speed.toFixed(1)}x)
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={settings.autocite.speed}
                    onChange={(ev) => onChange((prev) => ({ ...prev, autocite: { ...prev.autocite, speed: parseFloat(ev.target.value) } }))}
                  />
                </label>
              </div>

              <div className={styles.field}>
                <label>
                  Pauză între versete ({settings.autocite.delay}ms)
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={100}
                    value={settings.autocite.delay}
                    onChange={(ev) => onChange((prev) => ({ ...prev, autocite: { ...prev.autocite, delay: parseInt(ev.target.value, 10) } }))}
                  />
                </label>
              </div>

              <div className={styles.checkboxField}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.autocite.highlight}
                    onChange={(ev) => onChange((prev) => ({ ...prev, autocite: { ...prev.autocite, highlight: ev.target.checked } }))}
                  />
                  Evidențiază versetul afișat
                </label>
              </div>

              <div className={styles.checkboxField}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.autocite.loop}
                    onChange={(ev) => onChange((prev) => ({ ...prev, autocite: { ...prev.autocite, loop: ev.target.checked } }))}
                  />
                  Reia de la început la finalul cărții
                </label>
              </div>
            </>
          )}

          {tab === 'literal' && (
            <>
              <p className={styles.hint}>
                Praguri de acceptare (% din cuvintele versetului care trebuie fi rostite) — mai jos e mai permisiv.
              </p>

              <div className={styles.field}>
                <label>
                  Același capitol ({settings.literal.sameChapter}%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.literal.sameChapter}
                    onChange={(ev) => onChange((prev) => ({ ...prev, literal: { ...prev.literal, sameChapter: parseInt(ev.target.value, 10) } }))}
                  />
                </label>
              </div>

              <div className={styles.field}>
                <label>
                  Aceeași carte ({settings.literal.sameBook}%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.literal.sameBook}
                    onChange={(ev) => onChange((prev) => ({ ...prev, literal: { ...prev.literal, sameBook: parseInt(ev.target.value, 10) } }))}
                  />
                </label>
              </div>

              <div className={styles.field}>
                <label>
                  Altă carte ({settings.literal.otherBook}%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.literal.otherBook}
                    onChange={(ev) => onChange((prev) => ({ ...prev, literal: { ...prev.literal, otherBook: parseInt(ev.target.value, 10) } }))}
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            Resetare valori implicite
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
