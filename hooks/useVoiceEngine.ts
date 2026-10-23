'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VerseRef } from '@/lib/navigation';
import type { MicSettings } from '@/lib/mic-settings';
import {
  buildRomanianBiblePatterns,
  calculateSequenceSimilarity,
  computeSpokenVerseCoverage,
  detectExplicitReference,
  detectReferenceWithRegex,
  resolveBookName,
  searchInCompleteBible,
  type BibleSearchIndex,
  type DetectionContext,
} from '@/lib/voice-search';
import { getSignificantWords } from '@/lib/romanian-text';
import { useVerseHistory } from './useVerseHistory';
import type { BibleIndexStatus } from './useBibleSearchIndex';

export type VoiceMode = 'literal' | 'ai' | 'autocitire';

export interface HighlightPulse {
  id: number;
  durationMs: number;
}

interface UseVoiceEngineArgs {
  currentRef: VerseRef;
  onNavigate: (ref: VerseRef) => void;
  micSettings: MicSettings;
  indexStatus: BibleIndexStatus;
  loadIndex: () => Promise<BibleSearchIndex>;
}

const SATURATION_DEFAULTS = { maxSessionMs: 5 * 60 * 1000, silenceThresholdMs: 30 * 1000, backoffBaseMs: 1000, checkIntervalMs: 5000 };
const AI_ANALYSIS_INTERVAL_MS = 5000;

// Puerto de voiceState + todas las funciones de components/screen-voice.js
// (initVoiceRecognition, toggleUnifiedVoice, start/stopVoiceRecognition,
// start/stopAIRecognition, start/stopAutocitire, handleSpeechResult,
// processTranscriptIncremental, handleDetectedReference, el watchdog de
// saturación, etc.) como un único hook de React. Diferencias deliberadas
// respecto al original:
//  - Limpieza real en el efecto de desmontaje (abort + clear de todos los
//    timers) — el original no limpiaba nada al no haber ciclo de vida de
//    componente.
//  - Los mensajes de alert() se exponen como estado `error` para que la UI
//    los muestre sin bloquear (en vez de un diálogo nativo).
//  - Las detecciones por voz (Literal/IA) se anotan en el mismo historial
//    compartido que el picker de libro/capítulo/versículo (useVerseHistory),
//    en vez de en un historial propio y separado como en el original.
//  - Los valores "actuales" que necesitan los callbacks imperativos (eventos
//    de SpeechRecognition, timers) se sincronizan a refs dentro de un
//    useEffect (nunca durante el render), y todas las funciones internas se
//    declaran en orden de dependencia para no referenciarse antes de existir.
export function useVoiceEngine({ currentRef, onNavigate, micSettings, indexStatus, loadIndex }: UseVoiceEngineArgs) {
  const [isListening, setIsListening] = useState(false);
  const [mode, setModeState] = useState<VoiceMode>('literal');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addEntry: addHistoryEntry } = useVerseHistory();
  const [highlightPulse, setHighlightPulse] = useState<HighlightPulse | null>(null);

  // "Latest ref": se sincroniza en un efecto (nunca durante el render) para
  // que los callbacks imperativos siempre lean el valor más reciente sin
  // recrear el reconocedor de voz ni sufrir closures obsoletos.
  const latest = useRef({ currentRef, onNavigate, micSettings, indexStatus });
  useEffect(() => {
    latest.current = { currentRef, onNavigate, micSettings, indexStatus };
  }, [currentRef, onNavigate, micSettings, indexStatus]);

  const isListeningRef = useRef(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const patternsRef = useRef(buildRomanianBiblePatterns());
  const indexRef = useRef<BibleSearchIndex | null>(null);

  const autocitireModeRef = useRef(false);
  const aiModeRef = useRef(false);
  const aiBufferRef = useRef('');
  const aiLastAnalysisRef = useRef<number | null>(null);
  const aiJustDetectedRef = useRef(false);
  const aiJustDetectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autocitireCurrentVerseRef = useRef<VerseRef | null>(null);
  const autocitireLastWordsRef = useRef<string[]>([]);
  const lastIncrementalSearchRef = useRef<number | null>(null);

  const currentContextRef = useRef<DetectionContext>({ book: null, chapter: null, timestamp: null });
  const recentReferencesRef = useRef<Map<string, number>>(new Map());

  const sessionStartRef = useRef<number | null>(null);
  const lastResultTimestampRef = useRef<number | null>(null);
  const restartAttemptsRef = useRef(0);
  const isRestartingRef = useRef(false);
  const watchdogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightIdRef = useRef(0);

  // Mantiene sincronizado el contexto de detección con la referencia mostrada
  // (puerto de setVoiceCurrentContext, invocado desde setReference en el
  // original cada vez que cambia la referencia por cualquier vía) y, si
  // Autocitire está activo, la posición de seguimiento (updateAutocitireReference).
  useEffect(() => {
    currentContextRef.current = { book: currentRef.book, chapter: currentRef.chapter, timestamp: Date.now() };
    if (autocitireModeRef.current) {
      autocitireCurrentVerseRef.current = currentRef;
      const verse = indexRef.current?.verses.find((v) => v.book === currentRef.book && v.chapter === currentRef.chapter && v.verse === currentRef.verse);
      autocitireLastWordsRef.current = verse ? verse.significantWords.slice(-10) : [];
    }
  }, [currentRef]);

  // ===== DETECCIÓN =====
  const handleDetectedReference = useCallback(
    (ref: VerseRef, method: string) => {
      const refKey = `${ref.book}-${ref.chapter}-${ref.verse}`;
      const now = Date.now();

      const lastTime = recentReferencesRef.current.get(refKey);
      if (lastTime != null) {
        const dedupMs = method === 'explicit' || method === 'explicit-incremental' ? 2000 : method === 'content' ? 3000 : 5000;
        if (now - lastTime < dedupMs) return;
      }
      recentReferencesRef.current.set(refKey, now);

      currentContextRef.current = { book: ref.book, chapter: ref.chapter, timestamp: now };

      for (const [key, time] of recentReferencesRef.current.entries()) {
        if (now - time > 30000) recentReferencesRef.current.delete(key);
      }

      const normalizedBook = resolveBookName(ref.book);
      const resolvedRef: VerseRef = { book: normalizedBook, chapter: ref.chapter, verse: ref.verse };

      addHistoryEntry(resolvedRef);
      latest.current.onNavigate(resolvedRef);
    },
    [addHistoryEntry],
  );

  const processTranscriptIncremental = useCallback(
    (transcript: string) => {
      const index = indexRef.current;
      if (!index) return;

      const explicitRef = detectExplicitReference(transcript);
      if (explicitRef) {
        handleDetectedReference(explicitRef, 'explicit-incremental');
        return;
      }

      const regexRef = detectReferenceWithRegex(transcript, patternsRef.current, currentContextRef.current);
      if (regexRef) {
        handleDetectedReference(regexRef, 'regex');
        return;
      }

      const globalMatch = searchInCompleteBible(transcript, index);
      if (!globalMatch) return;

      const litCfg = latest.current.micSettings.literal;
      const ctx = currentContextRef.current;
      let thresholdPct = litCfg.otherBook;
      if (ctx.book && ctx.chapter && globalMatch.book === ctx.book && globalMatch.chapter === ctx.chapter) {
        thresholdPct = litCfg.sameChapter;
      } else if (ctx.book && globalMatch.book === ctx.book) {
        thresholdPct = litCfg.sameBook;
      }

      const coverage = computeSpokenVerseCoverage(transcript, globalMatch, index);
      if (coverage.coverage >= thresholdPct / 100) {
        handleDetectedReference(globalMatch, 'content-incremental-coverage');
      }
    },
    [handleDetectedReference],
  );

  // ===== AUTOCITIRE =====
  const advanceToNextVerse = useCallback((nextRef: VerseRef) => {
    autocitireCurrentVerseRef.current = nextRef;
    const index = indexRef.current;
    const verse = index?.verses.find((v) => v.book === nextRef.book && v.chapter === nextRef.chapter && v.verse === nextRef.verse);
    autocitireLastWordsRef.current = verse ? verse.significantWords.slice(-10) : [];

    const autociteCfg = latest.current.micSettings.autocite;
    const pauseMs = Math.max(0, Math.floor(autociteCfg.delay / Math.max(0.1, autociteCfg.speed)));

    if (autociteCfg.highlight) {
      highlightIdRef.current += 1;
      setHighlightPulse({ id: highlightIdRef.current, durationMs: pauseMs || 600 });
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightPulse(null), pauseMs || 600);
    }

    latest.current.onNavigate(nextRef);

    // Reiniciar el reconocimiento para vaciar el buffer de audio y evitar
    // detectar la misma transición dos veces (workaround deliberado, no un bug).
    const recognition = recognitionRef.current;
    if (recognition && isListeningRef.current) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (autocitireModeRef.current) {
          try {
            recognition.start();
          } catch {
            // ya iniciado
          }
        }
      }, pauseMs);
    }
  }, []);

  const checkVerseTransition = useCallback(
    (spokenWords: string[], nextVerseSignificantWords: string[], nextRef: VerseRef) => {
      const lastWords = autocitireLastWordsRef.current;
      if (lastWords.length > 0) {
        const recentSpoken = spokenWords.slice(-20);
        for (let i = Math.min(5, lastWords.length); i >= 3; i -= 1) {
          const target = lastWords.slice(-i);
          for (let j = 0; j <= recentSpoken.length - i; j += 1) {
            const window = recentSpoken.slice(j, j + i);
            if (calculateSequenceSimilarity(target, window) >= 0.6) {
              advanceToNextVerse(nextRef);
              return;
            }
          }
        }
      }

      if (nextVerseSignificantWords.length >= 3) {
        const firstWords = nextVerseSignificantWords.slice(0, 5);
        const recentSpoken = spokenWords.slice(-15);
        for (let i = 3; i <= Math.min(5, firstWords.length); i += 1) {
          const target = firstWords.slice(0, i);
          for (let j = 0; j <= recentSpoken.length - i; j += 1) {
            const window = recentSpoken.slice(j, j + i);
            if (calculateSequenceSimilarity(target, window) >= 0.6) {
              advanceToNextVerse(nextRef);
              return;
            }
          }
        }
      }
    },
    [advanceToNextVerse],
  );

  const processAutocitireTranscript = useCallback(
    (transcript: string) => {
      const currentRefLocal = autocitireCurrentVerseRef.current;
      const index = indexRef.current;
      if (!currentRefLocal || !index) return;

      const spokenWords = getSignificantWords(transcript);
      const nextRef: VerseRef = { book: currentRefLocal.book, chapter: currentRefLocal.chapter, verse: currentRefLocal.verse + 1 };
      let nextVerse = index.verses.find((v) => v.book === nextRef.book && v.chapter === nextRef.chapter && v.verse === nextRef.verse);

      if (!nextVerse) {
        nextRef.chapter += 1;
        nextRef.verse = 1;
        nextVerse = index.verses.find((v) => v.book === nextRef.book && v.chapter === nextRef.chapter && v.verse === nextRef.verse);

        if (!nextVerse && latest.current.micSettings.autocite.loop) {
          const wrap = index.verses.find((v) => v.book === nextRef.book && v.chapter === 1 && v.verse === 1) ?? index.verses[0];
          if (wrap) {
            checkVerseTransition(spokenWords, wrap.significantWords, { book: wrap.book, chapter: wrap.chapter, verse: wrap.verse });
          }
          return;
        }
        if (!nextVerse) return;
      }

      checkVerseTransition(spokenWords, nextVerse.significantWords, nextRef);
    },
    [checkVerseTransition],
  );

  // ===== IA =====
  const analyzeTranscriptWithAI = useCallback(
    async (transcript: string) => {
      try {
        const res = await fetch('/api/analyze-verse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, language: 'ro' }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.reference) {
          const ref: VerseRef = { book: data.reference.book, chapter: data.reference.chapter, verse: data.reference.verse };
          handleDetectedReference(ref, 'ai');
          aiBufferRef.current = '';
          aiJustDetectedRef.current = true;
          if (aiJustDetectedTimerRef.current) clearTimeout(aiJustDetectedTimerRef.current);
          aiJustDetectedTimerRef.current = setTimeout(() => {
            aiJustDetectedRef.current = false;
          }, 10000);
        }
      } catch {
        // red no disponible: se reintenta en el próximo tick del intervalo
      }
    },
    [handleDetectedReference],
  );

  const startAIAnalysisInterval = useCallback(() => {
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    aiIntervalRef.current = setInterval(() => {
      if (!aiModeRef.current) {
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        return;
      }
      const now = Date.now();
      const sinceLast = now - (aiLastAnalysisRef.current || 0);
      const minChars = aiJustDetectedRef.current ? 20 : 35;

      if (sinceLast >= AI_ANALYSIS_INTERVAL_MS && aiBufferRef.current.trim().length > minChars) {
        analyzeTranscriptWithAI(aiBufferRef.current);
        aiLastAnalysisRef.current = now;
        const words = aiBufferRef.current.split(' ');
        if (words.length > 100) aiBufferRef.current = words.slice(-50).join(' ');
      }
    }, 1000);
  }, [analyzeTranscriptWithAI]);

  // ===== TRANSCRIPCIÓN =====
  const handleSpeechResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      let transcript = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      if (!transcript.trim()) return;

      lastResultTimestampRef.current = Date.now();
      // Un resultado real prueba que el micrófono/reconocimiento funciona:
      // se reinicia el contador de reintentos para que el backoff exponencial
      // vuelva a partir de 1s en el próximo silencio, en vez de seguir
      // creciendo indefinidamente por reinicios normales del modo continuo.
      restartAttemptsRef.current = 0;
      const words = transcript.split(/\s+/).filter(Boolean);
      setLiveTranscript(words.slice(-5).join(' '));

      if (aiModeRef.current) {
        if (isFinal) aiBufferRef.current += ` ${transcript}`;
      } else if (autocitireModeRef.current) {
        const now = Date.now();
        if (!lastIncrementalSearchRef.current || now - lastIncrementalSearchRef.current > 500) {
          lastIncrementalSearchRef.current = now;
          processAutocitireTranscript(transcript);
        }
      } else if (transcript.trim().split(' ').length >= 3) {
        const now = Date.now();
        if (!lastIncrementalSearchRef.current || now - lastIncrementalSearchRef.current > 1000) {
          lastIncrementalSearchRef.current = now;
          processTranscriptIncremental(transcript);
        }
      }
    },
    [processAutocitireTranscript, processTranscriptIncremental],
  );

  // ===== WATCHDOG DE SATURACIÓN =====
  const stopWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    restartAttemptsRef.current = 0;
    isRestartingRef.current = false;
  }, []);

  // Declarado aquí (antes de safeRestartRecognition) para que este último
  // pueda usarlo al rendirse definitivamente tras fallos consecutivos — ver
  // el comentario en esa función.
  const stopAll = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
    autocitireModeRef.current = false;
    aiModeRef.current = false;
    aiBufferRef.current = '';
    autocitireCurrentVerseRef.current = null;
    autocitireLastWordsRef.current = [];
    setIsListening(false);
    setLiveTranscript('');
    stopWatchdog();
    // Cancela un reinicio ya agendado (backoff en curso) para que no reviva
    // el reconocimiento justo después de haberlo detenido a propósito.
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, [stopWatchdog]);

  const safeRestartRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isRestartingRef.current) return;

    isRestartingRef.current = true;
    restartAttemptsRef.current += 1;
    const attempt = restartAttemptsRef.current;
    const backoff = Math.min(60000, 2 ** Math.max(0, attempt - 1) * SATURATION_DEFAULTS.backoffBaseMs);

    try {
      recognition.stop();
    } catch {
      // ignore
    }
    restartTimeoutRef.current = setTimeout(() => {
      restartTimeoutRef.current = null;
      try {
        recognition.start();
        sessionStartRef.current = Date.now();
        lastResultTimestampRef.current = Date.now();
      } catch {
        // ya iniciado
      } finally {
        isRestartingRef.current = false;
      }
    }, backoff);
    // Deliberadamente sin tope de reintentos ni "me rindo": el modo de voz
    // debe seguir funcionando indefinidamente hasta que el usuario lo apague
    // a mano, incluso tras silencios largos o varios reinicios seguidos del
    // reconocimiento del navegador. Solo un error real de permiso del
    // micrófono (handleSpeechError) detiene la escucha por sí sola.
  }, []);

  const startWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) return;
    watchdogTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (!sessionStartRef.current) sessionStartRef.current = now;
      if (lastResultTimestampRef.current && now - lastResultTimestampRef.current > SATURATION_DEFAULTS.silenceThresholdMs) {
        safeRestartRecognition();
        return;
      }
      if (now - sessionStartRef.current > SATURATION_DEFAULTS.maxSessionMs) {
        safeRestartRecognition();
      }
    }, SATURATION_DEFAULTS.checkIntervalMs);
  }, [safeRestartRecognition]);

  // ===== CONTROL DE MODOS =====
  const handleSpeechEnd = useCallback(() => {
    if (isListeningRef.current) safeRestartRecognition();
  }, [safeRestartRecognition]);

  const handleSpeechError = useCallback(
    (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        setError('Permite accesul la microfon pentru a folosi această funcție.');
        stopAll();
      }
    },
    [stopAll],
  );

  const ensureRecognition = useCallback((): SpeechRecognition | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return null;

    const recognition = new Ctor();
    recognition.lang = 'ro-RO';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => handleSpeechResult(event);
    recognition.onerror = (event) => handleSpeechError(event);
    recognition.onend = () => handleSpeechEnd();
    recognitionRef.current = recognition;
    return recognition;
  }, [handleSpeechEnd, handleSpeechError, handleSpeechResult]);

  const startMode = useCallback(
    async (nextMode: VoiceMode) => {
      setError(null);
      const recognition = ensureRecognition();
      if (!recognition) {
        setError('Browserul tău nu suportă recunoașterea vocală. Încearcă Chrome sau Edge.');
        return;
      }

      if (nextMode === 'autocitire' && !latest.current.currentRef.book) {
        setError('Te rog să selectezi mai întâi un verset din care să începi citirea.');
        return;
      }

      if (nextMode !== 'ai') {
        try {
          indexRef.current = await loadIndex();
        } catch {
          setError('Nu s-a putut încărca indexul Bibliei pentru căutare vocală.');
          return;
        }
      }

      autocitireModeRef.current = nextMode === 'autocitire';
      aiModeRef.current = nextMode === 'ai';

      if (nextMode === 'autocitire') {
        autocitireCurrentVerseRef.current = latest.current.currentRef;
        const verse = indexRef.current?.verses.find(
          (v) => v.book === latest.current.currentRef.book && v.chapter === latest.current.currentRef.chapter && v.verse === latest.current.currentRef.verse,
        );
        autocitireLastWordsRef.current = verse ? verse.significantWords.slice(-10) : [];
      } else if (nextMode === 'ai') {
        aiBufferRef.current = '';
        aiLastAnalysisRef.current = Date.now();
      }

      try {
        recognition.start();
        setIsListening(true);
        sessionStartRef.current = Date.now();
        lastResultTimestampRef.current = Date.now();
        restartAttemptsRef.current = 0;
        startWatchdog();
        if (nextMode === 'ai') startAIAnalysisInterval();
      } catch {
        setError('Eroare la pornirea microfonului.');
        autocitireModeRef.current = false;
        aiModeRef.current = false;
      }
    },
    [ensureRecognition, loadIndex, startAIAnalysisInterval, startWatchdog],
  );

  const setMode = useCallback(
    (nextMode: VoiceMode) => {
      setModeState(nextMode);
      if (isListeningRef.current) {
        stopAll();
        setTimeout(() => startMode(nextMode), 100);
      }
    },
    [stopAll, startMode],
  );

  const toggle = useCallback(() => {
    if (isListeningRef.current) {
      stopAll();
    } else {
      startMode(mode);
    }
  }, [mode, startMode, stopAll]);

  // Limpieza real al desmontar (el original nunca liberaba nada).
  useEffect(
    () => () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      if (aiJustDetectedTimerRef.current) clearTimeout(aiJustDetectedTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  return useMemo(
    () => ({ isListening, mode, setMode, toggle, liveTranscript, error, highlightPulse, indexStatus }),
    [isListening, mode, setMode, toggle, liveTranscript, error, highlightPulse, indexStatus],
  );
}
