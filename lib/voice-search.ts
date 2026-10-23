import { bibleStructure } from './bible-structure';
import type { VerseRef } from './navigation';
import { generateNGrams, getSignificantWords, normalizeText, wordsAreSimilar } from './romanian-text';

export interface IndexedVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  significantWords: string[];
}

export interface BibleSearchIndex {
  verses: IndexedVerse[];
  ngramIndex: Record<string, number[]>;
}

export interface ContentMatch {
  book: string;
  chapter: number;
  verse: number;
  similarity: number;
  matchedWindow: string;
  text: string;
}

// ===== VALIDACIÓN Y NOMBRES DE LIBRO =====
// Puerto de validateReference() (screen-voice.js).
export function validateReference(ref: { book: string; chapter: number; verse?: number }): boolean {
  const chapterData = bibleStructure[ref.book]?.[ref.chapter];
  if (!chapterData) return false;
  if (ref.verse && ref.verse > chapterData) return false;
  return true;
}

// Puerto de bookNameVariations + normalizeBookName() (screen-voice.js).
const BOOK_NAME_VARIATIONS: Record<string, string> = {
  psalmul: 'Psalmii', psalm: 'Psalmii', psalmi: 'Psalmii', psalmii: 'Psalmii', ps: 'Psalmii',
  geneza: 'Geneza', gen: 'Geneza',
  exod: 'Exodul', exodul: 'Exodul', ex: 'Exodul',
  ioan: 'Ioan', in: 'Ioan', ioa: 'Ioan',
  matei: 'Matei', mat: 'Matei', mt: 'Matei',
  romani: 'Romani', rom: 'Romani',
  '1 corinteni': '1 Corinteni', '2 corinteni': '2 Corinteni', '1 cor': '1 Corinteni', '2 cor': '2 Corinteni',
  '1 samuel': '1 Samuel', '2 samuel': '2 Samuel', '1 sam': '1 Samuel', '2 sam': '2 Samuel',
  '1 imparati': '1 Împărați', '2 imparati': '2 Împărați', '1 imp': '1 Împărați', '2 imp': '2 Împărați',
  proverbe: 'Proverbele', proverbele: 'Proverbele', prov: 'Proverbele',
  apocalipsa: 'Apocalipsa', apoc: 'Apocalipsa', ap: 'Apocalipsa',
};

export function normalizeBookName(bookName: string | null | undefined): string | null {
  if (!bookName) return null;
  const normalized = bookName.toLowerCase().trim();

  if (BOOK_NAME_VARIATIONS[normalized]) return BOOK_NAME_VARIATIONS[normalized];

  const bookNames = Object.keys(bibleStructure);
  const exactMatch = bookNames.find((b) => b.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  const partialMatch = bookNames.find((b) => b.toLowerCase().includes(normalized) || normalized.includes(b.toLowerCase()));
  return partialMatch ?? null;
}

// Puerto de la normalización de libro dentro de handleDetectedReference()
// (fallback sin diacríticos, luego coincidencia parcial case-insensitive).
export function resolveBookName(book: string): string {
  if (bibleStructure[book]) return book;
  const withoutDiacritics = book.replace(/ă|â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't');
  if (bibleStructure[withoutDiacritics]) return withoutDiacritics;

  const bookLower = book.toLowerCase();
  const match = Object.keys(bibleStructure).find(
    (b) => b.toLowerCase() === bookLower || b.toLowerCase().includes(bookLower) || bookLower.includes(b.toLowerCase()),
  );
  return match ?? book;
}

// ===== DETECCIÓN DE REFERENCIAS EXPLÍCITAS =====
// Puerto de detectExplicitReference() (screen-voice.js): "Ioan 3:16", "Ioan 3 cu 16",
// "Ioan 3 versetul 16", "capitolul 3 din Ioan", "în Ioan 3".
const EXPLICIT_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /\b(\w+(?:\s+\w+)?)\s+(\d+)\s+cu\s+(\d+)\b/i, name: 'cu-pattern' },
  { regex: /\b(\w+(?:\s+\w+)?)\s+(\d+):(\d+)\b/i, name: 'colon-pattern' },
  { regex: /\b(\w+(?:\s+\w+)?)\s+(\d+)\s+(?:versetul|versul|vers\.?)\s+(\d+)\b/i, name: 'versetul-pattern' },
  { regex: /\bcapitolul?\s+(\d+)\s+din\s+(\w+(?:\s+\w+)?)\b/i, name: 'capitolul-din-pattern' },
  { regex: /\b(?:în|la|din)\s+(\w+(?:\s+\w+)?)\s+(\d+)\b/i, name: 'in-pattern' },
];

export function detectExplicitReference(text: string): VerseRef | null {
  for (const pattern of EXPLICIT_PATTERNS) {
    const match = text.match(pattern.regex);
    if (!match) continue;

    let book: string | null;
    let chapter: number;
    let verse: number;

    if (pattern.name === 'capitolul-din-pattern') {
      chapter = parseInt(match[1], 10);
      book = normalizeBookName(match[2]);
      verse = 1;
    } else if (pattern.name === 'in-pattern') {
      book = normalizeBookName(match[1]);
      chapter = parseInt(match[2], 10);
      verse = 1;
    } else {
      book = normalizeBookName(match[1]);
      chapter = parseInt(match[2], 10);
      verse = match[3] ? parseInt(match[3], 10) : 1;
    }

    if (book && chapter) {
      const ref = { book, chapter, verse: verse || 1 };
      if (validateReference(ref)) return ref;
    }
  }
  return null;
}

// ===== DETECCIÓN POR REGEX CONTEXTUAL =====
// Puerto de buildRomanianBiblePatterns()/detectReferenceWithRegex() (screen-voice.js):
// patrones de contexto (p.ej. "versetul 5" a secas) que solo disparan si hay un
// `currentContext` reciente (últimos 10s para el patrón de solo-número).
export interface DetectionContext {
  book: string | null;
  chapter: number | null;
  timestamp: number | null;
}

interface ContextPattern {
  regex: RegExp;
  needsContext: boolean;
  lowPriority: boolean;
  extract: (match: RegExpMatchArray, ctx: DetectionContext) => VerseRef | null;
}

export function buildRomanianBiblePatterns(): ContextPattern[] {
  const bookNames = Object.keys(bibleStructure);
  const escaped = bookNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const bookGroup = escaped.join('|') || 'UNK_BOOK';

  return [
    {
      regex: new RegExp(`\\b(${bookGroup})\\s+(\\d+):(\\d+)\\b`, 'i'),
      needsContext: false,
      lowPriority: false,
      extract: (m) => ({ book: m[1], chapter: parseInt(m[2], 10), verse: parseInt(m[3], 10) }),
    },
    {
      regex: new RegExp(`\\b(${bookGroup})\\s+(\\d+)\\s+cu\\s+(\\d+)\\b`, 'i'),
      needsContext: false,
      lowPriority: false,
      extract: (m) => ({ book: m[1], chapter: parseInt(m[2], 10), verse: parseInt(m[3], 10) }),
    },
    {
      regex: new RegExp(`\\b(${bookGroup})\\s+(?:capitolul|cap\\.?)\\s+(\\d+)\\s+(?:versetul|vers\\.?|v\\.)\\s+(\\d+)\\b`, 'i'),
      needsContext: false,
      lowPriority: false,
      extract: (m) => ({ book: m[1], chapter: parseInt(m[2], 10), verse: parseInt(m[3], 10) }),
    },
    {
      regex: new RegExp(`\\b(?:capitolul|cap\\.?)\\s+(\\d+)\\s+din\\s+(${bookGroup})\\b`, 'i'),
      needsContext: false,
      lowPriority: false,
      extract: (m) => ({ book: m[2], chapter: parseInt(m[1], 10), verse: 1 }),
    },
    {
      regex: /\b(?:versetul|versul|vers\.?)\s+(\d+)\b/i,
      needsContext: true,
      lowPriority: false,
      extract: (m, ctx) => (ctx.book && ctx.chapter ? { book: ctx.book, chapter: ctx.chapter, verse: parseInt(m[1], 10) } : null),
    },
    {
      regex: /\b(\d{1,3})\b/,
      needsContext: true,
      lowPriority: true,
      extract: (m, ctx) => {
        if (!ctx.book || !ctx.chapter) return null;
        const num = parseInt(m[1], 10);
        if (num < 1 || num > 200) return null;
        if (!ctx.timestamp || Date.now() - ctx.timestamp > 10000) return null;
        return { book: ctx.book, chapter: ctx.chapter, verse: num };
      },
    },
  ];
}

export function detectReferenceWithRegex(text: string, patterns: ContextPattern[], ctx: DetectionContext): VerseRef | null {
  for (const pattern of patterns) {
    if (pattern.lowPriority) continue;
    const match = text.match(pattern.regex);
    if (match) {
      const ref = pattern.extract(match, ctx);
      if (ref && validateReference(ref)) return ref;
    }
  }
  for (const pattern of patterns) {
    if (!pattern.lowPriority) continue;
    const match = text.match(pattern.regex);
    if (match) {
      const ref = pattern.extract(match, ctx);
      if (ref && validateReference(ref)) return ref;
    }
  }
  return null;
}

// ===== BÚSQUEDA POR CONTENIDO (N-GRAMAS + VENTANAS) =====
// Puerto de searchByNGrams() (screen-voice.js).
function searchByNGrams(significantWords: string[], index: BibleSearchIndex) {
  const candidates = new Map<number, { count: number; exactMatch: boolean }>();
  const allSpokenNgrams = [
    ...generateNGrams(significantWords, 5),
    ...generateNGrams(significantWords, 4),
    ...generateNGrams(significantWords, 3),
  ];

  for (const ngram of allSpokenNgrams) {
    const verseIndices = index.ngramIndex[ngram];
    if (!verseIndices) continue;
    const weight = ngram.split(' ').length;
    const isLong = weight >= 4;

    for (const verseIndex of verseIndices) {
      const candidate = candidates.get(verseIndex) ?? { count: 0, exactMatch: false };
      candidate.count += weight;
      if (isLong) candidate.exactMatch = true;
      candidates.set(verseIndex, candidate);
    }
  }

  return Array.from(candidates.entries())
    .map(([verseIndex, data]) => ({ verseIndex, count: data.count, exactMatch: data.exactMatch }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// Puerto de calculateWindowMatch() (screen-voice.js).
function calculateWindowMatch(windowWords: string[], verseWords: string[]): number {
  if (windowWords.length === 0 || verseWords.length === 0) return 0;
  let best = 0;
  for (let i = 0; i <= verseWords.length - windowWords.length; i += 1) {
    const verseWindow = verseWords.slice(i, i + windowWords.length);
    let matches = 0;
    for (let j = 0; j < windowWords.length; j += 1) {
      if (windowWords[j] === verseWindow[j]) matches += 1;
      else if (wordsAreSimilar(windowWords[j], verseWindow[j])) matches += 0.7;
    }
    const score = matches / windowWords.length;
    if (score > best) best = score;
  }
  return best;
}

// Puntúa cada versículo candidato contra ventanas de 5/4/3 palabras
// consecutivas del texto hablado (comparten n-gramas), con bonus por tamaño
// de ventana y n-grama exacto. Compartido por searchInCompleteBible() (mejor
// match único) y searchTopMatches() (varios candidatos, usado para el
// "grounding" del modo IA — ver app/api/analyze-verse/route.ts).
function scoreCandidates(spokenText: string, index: BibleSearchIndex): Map<number, { score: number; matchedWindow: string }> {
  const significantWords = getSignificantWords(spokenText);
  const best = new Map<number, { score: number; matchedWindow: string }>();
  if (significantWords.length < 3) return best;

  const windows: { words: string[]; size: number }[] = [];
  for (let windowSize = 5; windowSize >= 3; windowSize -= 1) {
    for (let i = 0; i <= significantWords.length - windowSize; i += 1) {
      windows.push({ words: significantWords.slice(i, i + windowSize), size: windowSize });
    }
  }

  for (const window of windows) {
    const candidates = searchByNGrams(window.words, index);
    for (const candidate of candidates) {
      const verse = index.verses[candidate.verseIndex];
      if (!verse) continue;

      const windowScore = calculateWindowMatch(window.words, verse.significantWords);
      const sizeBonus = (window.size / 5) * 0.2;
      const ngramBonus = candidate.exactMatch ? 0.15 : 0;
      const finalScore = windowScore + sizeBonus + ngramBonus;

      const existing = best.get(candidate.verseIndex);
      if (!existing || finalScore > existing.score) {
        best.set(candidate.verseIndex, { score: finalScore, matchedWindow: window.words.join(' ') });
      }
    }
  }

  return best;
}

function toContentMatch(index: BibleSearchIndex, verseIndex: number, data: { score: number; matchedWindow: string }): ContentMatch {
  const verse = index.verses[verseIndex];
  return {
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    similarity: Math.max(0, Math.min(1, data.score)),
    matchedWindow: data.matchedWindow,
    text: verse.text,
  };
}

// Puerto de searchInCompleteBible() (screen-voice.js): el versículo candidato
// con mayor puntuación.
export function searchInCompleteBible(spokenText: string, index: BibleSearchIndex): ContentMatch | null {
  const scored = scoreCandidates(spokenText, index);
  let bestVerseIndex = -1;
  let bestScore = -1;
  for (const [verseIndex, data] of scored) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestVerseIndex = verseIndex;
    }
  }
  return bestVerseIndex === -1 ? null : toContentMatch(index, bestVerseIndex, scored.get(bestVerseIndex)!);
}

// Top N versículos candidatos (no solo el mejor) con su texto real — usado
// para "anclar" al modo IA: en vez de pedirle a la IA que recuerde el
// versículo de memoria (y arriesgarse a que invente capítulo/versículo), se
// le dan estos candidatos reales del índice para que solo elija entre ellos.
//
// Se probó (y se descartó) un fallback de coincidencia de palabras sueltas
// para cuando los n-gramas no encuentran nada (texto muy distorsionado): aun
// ponderando por rareza de palabra (IDF), seguía generando falsos positivos
// — la IA terminaba "escogiendo" un candidato débil en vez de decir que
// ninguno encaja. Para una app que te lleva a un versículo, un falso
// positivo es peor que no encontrar nada, así que solo se usan los
// candidatos de frases casi exactas (más estrictos, pero fiables).
export function searchTopMatches(spokenText: string, index: BibleSearchIndex, limit = 5): ContentMatch[] {
  const scored = scoreCandidates(spokenText, index);
  return Array.from(scored.entries())
    .map(([verseIndex, data]) => toContentMatch(index, verseIndex, data))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Puerto de computeSpokenVerseCoverage() (screen-voice.js): cuántas palabras
// dijo el usuario respecto al total de palabras significativas del versículo
// candidato — es la métrica que se compara contra los umbrales configurables
// sameChapter/sameBook/otherBook (no la similitud de la ventana).
export function computeSpokenVerseCoverage(transcript: string, match: ContentMatch, index: BibleSearchIndex) {
  const spokenWords = normalizeText(transcript).split(/\s+/).filter((w) => w.length > 0);
  const verse = index.verses.find((v) => v.book === match.book && v.chapter === match.chapter && v.verse === match.verse);
  if (!verse) return { coverage: 0, spokenCount: spokenWords.length, verseCount: 0 };

  const verseWords = verse.significantWords.length ? verse.significantWords : normalizeText(verse.text).split(/\s+/).filter((w) => w.length > 0);
  const coverage = verseWords.length > 0 ? spokenWords.length / verseWords.length : 0;
  return { coverage, spokenCount: spokenWords.length, verseCount: verseWords.length };
}

// Puerto de calculateSequenceSimilarity() (screen-voice.js), usado por Autocitire
// para detectar el final del versículo actual / el inicio del siguiente.
export function calculateSequenceSimilarity(target: string[], spoken: string[]): number {
  if (target.length !== spoken.length || target.length === 0) return 0;
  let matches = 0;
  for (let i = 0; i < target.length; i += 1) {
    if (target[i] === spoken[i]) matches += 1;
    else if (wordsAreSimilar(target[i], spoken[i])) matches += 0.7;
  }
  return matches / target.length;
}
