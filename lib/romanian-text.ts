// Utilidades de texto en rumano compartidas por el indexador de la Biblia
// (scripts/build-bible-index.mjs, en build time) y el motor de voz (cliente,
// en runtime) — portadas 1:1 de components/screen-voice.js.

export const ROMANIAN_STOPWORDS = new Set([
  'si', 'sau', 'dar', 'in', 'la', 'cu', 'pe', 'de', 'din', 'pentru',
  'ca', 'sa', 'cel', 'cea', 'cei', 'cele', 'un', 'o', 'a', 'ai', 'ale',
  'este', 'sunt', 'era', 'erau', 'fie', 'fost', 'fi', 'fiind',
  'am', 'are', 'avem', 'aveti', 'au', 'avea', 'avut',
  'va', 'voi', 'vor', 'ar', 'nu', 'ne', 'el', 'ea', 'ei', 'ele',
  'acest', 'aceasta', 'acesti', 'aceste', 'acel', 'aceea', 'acei', 'acelea',
  'tot', 'toata', 'toti', 'toate', 'prin', 'mai', 'cum', 'cat', 'care',
  'ce', 'se', 'daca', 'atunci', 'asa', 'inca', 'foarte',
]);

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, unu: 1, una: 1, un: 1, doi: 2, doua: 2, trei: 3, patru: 4, cinci: 5,
  sase: 6, sapte: 7, opt: 8, noua: 9, zece: 10, unsprezece: 11,
  doisprezece: 12, douasprezece: 12, treisprezece: 13, paisprezece: 14,
  patrusprezece: 14, cincisprezece: 15, saisprezece: 16, saptesprezece: 17,
  optsprezece: 18, nouasprezece: 19, douazeci: 20, treizeci: 30,
  patruzeci: 40, cincizeci: 50, saizeci: 60, saptezeci: 70, optzeci: 80,
  nouazeci: 90,
};

// Puerto de convertRomanianNumbersToDigits() (screen-voice.js).
export function convertRomanianNumbersToDigits(text: string): string {
  let result = text
    .toLowerCase()
    .replace(/ă|â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't');

  result = result.replace(/(\w+)\s+si\s+(\w+)\s+de\s+mii\s+(\w+)\s+sute/gi, (_m, tens, units, hundredWord) => {
    const total = ((NUMBER_WORDS[tens] || 0) + (NUMBER_WORDS[units] || 0)) * 1000 + (NUMBER_WORDS[hundredWord] || 0) * 100;
    return String(total);
  });
  result = result.replace(/(\w+)\s+de\s+mii\s+(\w+)\s+sute/gi, (_m, th, hundredWord) => {
    const total = (NUMBER_WORDS[th] || 0) * 1000 + (NUMBER_WORDS[hundredWord] || 0) * 100;
    return String(total);
  });
  result = result.replace(/(\w+)\s+si\s+(\w+)\s+de\s+mii/gi, (_m, tens, units) => {
    const total = ((NUMBER_WORDS[tens] || 0) + (NUMBER_WORDS[units] || 0)) * 1000;
    return String(total);
  });
  result = result.replace(/(\w+)\s+de\s+mii/gi, (_m, th) => String((NUMBER_WORDS[th] || 0) * 1000));
  result = result.replace(/(\w+)\s+mii\s+(\w+)\s+sute/gi, (_m, th, hundredWord) => {
    const total = (NUMBER_WORDS[th] || 0) * 1000 + (NUMBER_WORDS[hundredWord] || 0) * 100;
    return String(total);
  });
  result = result.replace(/(\w+)\s+sute/gi, (_m, hundredWord) => String((NUMBER_WORDS[hundredWord] || 0) * 100));
  result = result.replace(/\bsuta\b/gi, '100');
  result = result.replace(/(\w+)\s+si\s+(\w+)/gi, (m, tens, units) => {
    if (NUMBER_WORDS[tens] !== undefined && NUMBER_WORDS[units] !== undefined) {
      return String(NUMBER_WORDS[tens] + NUMBER_WORDS[units]);
    }
    return m;
  });

  const sorted = Object.entries(NUMBER_WORDS).sort((a, b) => b[0].length - a[0].length);
  for (const [word, num] of sorted) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(num));
  }
  return result;
}

// Puerto de normalizeText() (screen-voice.js).
export function normalizeText(text: string): string {
  const converted = convertRomanianNumbersToDigits(text);
  return converted
    .toLowerCase()
    .replace(/[.,;:!?""''„"«»\-–—()[\]{}<>/\\|@#$%^&*+=~`]/g, ' ')
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[ș]/g, 's')
    .replace(/[ț]/g, 't')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Puerto de getSignificantWords() (screen-voice.js).
export function getSignificantWords(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((w) => w.length > 2 && !ROMANIAN_STOPWORDS.has(w));
}

// Puerto de generateNGrams() (screen-voice.js).
export function generateNGrams(words: string[], n: number): string[] {
  const grams: string[] = [];
  for (let i = 0; i <= words.length - n; i += 1) {
    grams.push(words.slice(i, i + n).join(' '));
  }
  return grams;
}

// Puerto de wordsAreSimilar() (screen-voice.js): tolera pequeños errores del
// reconocimiento de voz (substring o distancia de edición <= 2).
export function wordsAreSimilar(word1: string, word2: string): boolean {
  if (word1.includes(word2) || word2.includes(word1)) return true;
  if (Math.abs(word1.length - word2.length) > 2) return false;

  let differences = 0;
  const maxLen = Math.max(word1.length, word2.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (word1[i] !== word2[i]) {
      differences += 1;
      if (differences > 2) return false;
    }
  }
  return differences <= 2;
}
