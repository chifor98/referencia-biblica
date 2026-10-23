'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { VerseRef } from '@/lib/navigation';
import { verseRefPath } from '@/lib/navigation';
import { useMicSettings } from '@/hooks/useMicSettings';
import { useBibleSearchIndex } from '@/hooks/useBibleSearchIndex';
import { useVoiceEngine, type VoiceMode } from '@/hooks/useVoiceEngine';
import { MicSettingsModal } from './MicSettingsModal';
import styles from './VoiceMicWidget.module.css';

const MODE_LABELS: Record<VoiceMode, string> = {
  'literal': 'Autorecunoaște literal',
  'ai': 'Autorecunoaște cu IA',
  'autocitire': 'Autocitire',
};

// Puerto de mic-button.html/js + screen-voice.js (la parte de UI): widget
// flotante mejorado según lo acordado — mantiene el botón/petal-animation
// original, sustituye los `alert()` bloqueantes por un banner de error no
// bloqueante y envía los versículos detectados por voz al mismo historial
// que el picker de libro/capítulo/versículo (ver useVerseHistory).
//
// Sin props: vive en app/(shell)/biblia/leer/layout.tsx (una ruta estable,
// por encima de [book]/[chapter]/[verse]) para no desmontarse en cada
// navegación entre versículos, así que lee el versículo actual con
// useParams() en vez de recibirlo de su padre.
export function VoiceMicWidget() {
  const params = useParams<{ book: string; chapter: string; verse: string }>();
  const router = useRouter();

  const currentRef = useMemo<VerseRef>(() => {
    const chapter = parseInt(params.chapter ?? '', 10);
    const verse = parseInt(params.verse ?? '', 10);
    return {
      book: decodeURIComponent(params.book ?? ''),
      chapter: Number.isNaN(chapter) ? 1 : chapter,
      verse: Number.isNaN(verse) ? 1 : verse,
    };
  }, [params.book, params.chapter, params.verse]);

  const onNavigate = useCallback((ref: VerseRef) => router.push(verseRefPath(ref)), [router]);

  const micSettings = useMicSettings();
  const bibleIndex = useBibleSearchIndex();
  const engine = useVoiceEngine({
    currentRef,
    onNavigate,
    micSettings: micSettings.settings,
    indexStatus: bibleIndex.status,
    loadIndex: bibleIndex.load,
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.settingsBtn}
          title="Configurare Microfon"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>

        <button
          type="button"
          className={`${styles.micButton} ${engine.isListening ? styles.listening : ''}`}
          onClick={engine.toggle}
          aria-pressed={engine.isListening}
          title={engine.isListening ? 'Oprește ascultarea' : 'Pornește ascultarea'}
        >
          <div className={`${styles.layer} ${styles.layer1}`} />
          <div className={`${styles.layer} ${styles.layer2}`} />
          <div className={`${styles.layer} ${styles.layer3}`} />
          <div className={`${styles.layer} ${styles.layer4}`} />
          <svg className={styles.icon} viewBox="-90 1 511 511.99899" xmlns="http://www.w3.org/2000/svg">
            <path
              style={{ fill: '#EDEEF0' }}
              d="m332.464844 275.082031c0-8.429687-6.835938-15.265625-15.269532-15.265625-8.433593 0-15.269531 6.835938-15.269531 15.265625 0 74.6875-60.757812 135.445313-135.445312 135.445313-74.683594 0-135.441407-60.757813-135.441407-135.445313 0-8.429687-6.835937-15.265625-15.269531-15.265625-8.433593 0-15.269531 6.835938-15.269531 15.265625 0 86.378907 66.320312 157.539063 150.710938 165.273438v41.105469h-56.664063c-8.433594 0-15.269531 6.835937-15.269531 15.269531 0 8.433593 6.835937 15.269531 15.269531 15.269531h143.871094c8.429687 0 15.265625-6.835938 15.265625-15.269531 0-8.433594-6.835938-15.269531-15.265625-15.269531h-56.667969v-41.105469c84.394531-7.730469 150.714844-78.894531 150.714844-165.273438zm0 0"
            />
            <path
              style={{ fill: '#EDEEF0' }}
              d="m166.480469 372.851562c53.910156 0 97.769531-43.859374 97.769531-97.769531v-177.316406c0-53.90625-43.859375-97.765625-97.769531-97.765625-53.90625 0-97.765625 43.859375-97.765625 97.765625v177.316406c0 53.910157 43.859375 97.769531 97.765625 97.769531zm-67.230469-275.085937c0-37.070313 30.160156-67.226563 67.230469-67.226563 37.070312 0 67.230469 30.15625 67.230469 67.226563v177.316406c0 37.070313-30.160157 67.230469-67.230469 67.230469-37.070313 0-67.230469-30.160156-67.230469-67.230469zm0 0"
            />
          </svg>
        </button>

        {!engine.isListening && (
          <div className={styles.modeLabel}>{MODE_LABELS[engine.mode]}</div>
        )}

        <div className={styles.modeSelector}>
          {(Object.keys(MODE_LABELS) as VoiceMode[]).map((m) => (
            <label key={m} className={styles.modeOption}>
              <input type="radio" name="voice-mode" value={m} checked={engine.mode === m} onChange={() => engine.setMode(m)} />
              <span>{MODE_LABELS[m]}</span>
            </label>
          ))}
          <label className={`${styles.modeOption} ${styles.transcriptOption}`}>
            <input
              type="checkbox"
              checked={micSettings.settings.showLiveTranscript ?? true}
              onChange={(ev) => {
                const checked = ev.target.checked;
                micSettings.update((prev) => ({ ...prev, showLiveTranscript: checked }));
              }}
            />
            <span>Arată transcrierea live</span>
          </label>
        </div>
      </div>

      {engine.isListening && engine.liveTranscript && micSettings.settings.showLiveTranscript && (
        <div className={styles.liveTranscript}>
          <span>{engine.liveTranscript}</span>
        </div>
      )}

      {engine.error && (
        <div className={styles.errorBanner} role="alert">
          {engine.error}
        </div>
      )}

      {settingsOpen && (
        <MicSettingsModal
          settings={micSettings.settings}
          onChange={micSettings.update}
          onReset={micSettings.reset}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
