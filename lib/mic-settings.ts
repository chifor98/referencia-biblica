// Puerto de components/mic-settings.js (window.microphoneConfig), limpiado:
// se elimina la pestaña "IA" y el checkbox "caseSensitive" (nada los leía —
// confirmado por análisis del código original) y todos los valores se aplican
// y persisten en vivo (el original mezclaba aplicación en vivo para los
// umbrales Literal con un botón "Guardar" para Autocitire, una inconsistencia
// de UX; aquí todo se comporta igual y de forma predecible).

export interface AutociteSettings {
  speed: number; // 0.5 - 2
  delay: number; // 0 - 5000 ms
  highlight: boolean;
  loop: boolean;
}

export interface LiteralSettings {
  sameChapter: number; // 0-100 (%), umbral de cobertura cuando el candidato está en el mismo capítulo
  sameBook: number; // 0-100 (%), mismo libro, capítulo distinto
  otherBook: number; // 0-100 (%), libro distinto
}

export interface MicSettings {
  autocite: AutociteSettings;
  literal: LiteralSettings;
  showLiveTranscript: boolean;
}

export const DEFAULT_MIC_SETTINGS: MicSettings = {
  autocite: { speed: 1, delay: 500, highlight: true, loop: true },
  literal: { sameChapter: 5, sameBook: 35, otherBook: 89 },
  showLiveTranscript: true,
};

const STORAGE_KEYS = {
  autociteSpeed: 'mic_autocite_speed',
  autociteDelay: 'mic_autocite_delay',
  autociteHighlight: 'mic_autocite_highlight',
  autociteLoop: 'mic_autocite_loop',
  literalSameChapter: 'mic_literal_sameChapter',
  literalSameBook: 'mic_literal_sameBook',
  literalOtherBook: 'mic_literal_otherBook',
  showLiveTranscript: 'mic_show_live_transcript',
} as const;

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = parseFloat(raw);
    return Number.isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw === 'true';
  } catch {
    return fallback;
  }
}

export function loadMicSettings(): MicSettings {
  if (typeof window === 'undefined') return DEFAULT_MIC_SETTINGS;
  return {
    autocite: {
      speed: readNumber(STORAGE_KEYS.autociteSpeed, DEFAULT_MIC_SETTINGS.autocite.speed),
      delay: readNumber(STORAGE_KEYS.autociteDelay, DEFAULT_MIC_SETTINGS.autocite.delay),
      highlight: readBool(STORAGE_KEYS.autociteHighlight, DEFAULT_MIC_SETTINGS.autocite.highlight),
      loop: readBool(STORAGE_KEYS.autociteLoop, DEFAULT_MIC_SETTINGS.autocite.loop),
    },
    literal: {
      sameChapter: readNumber(STORAGE_KEYS.literalSameChapter, DEFAULT_MIC_SETTINGS.literal.sameChapter),
      sameBook: readNumber(STORAGE_KEYS.literalSameBook, DEFAULT_MIC_SETTINGS.literal.sameBook),
      otherBook: readNumber(STORAGE_KEYS.literalOtherBook, DEFAULT_MIC_SETTINGS.literal.otherBook),
    },
    showLiveTranscript: readBool(STORAGE_KEYS.showLiveTranscript, DEFAULT_MIC_SETTINGS.showLiveTranscript),
  };
}

export function saveMicSettings(settings: MicSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.autociteSpeed, String(settings.autocite.speed));
    localStorage.setItem(STORAGE_KEYS.autociteDelay, String(settings.autocite.delay));
    localStorage.setItem(STORAGE_KEYS.autociteHighlight, String(settings.autocite.highlight));
    localStorage.setItem(STORAGE_KEYS.autociteLoop, String(settings.autocite.loop));
    localStorage.setItem(STORAGE_KEYS.literalSameChapter, String(settings.literal.sameChapter));
    localStorage.setItem(STORAGE_KEYS.literalSameBook, String(settings.literal.sameBook));
    localStorage.setItem(STORAGE_KEYS.literalOtherBook, String(settings.literal.otherBook));
    localStorage.setItem(STORAGE_KEYS.showLiveTranscript, String(settings.showLiveTranscript));
  } catch {
    // localStorage puede fallar en modo privado; los ajustes solo viven en memoria para esta sesión.
  }
}
