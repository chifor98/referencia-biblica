import { bibleStructure, bookNames } from './bible-structure';

export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

export function verseRefPath(ref: VerseRef): string {
  return `/biblia/leer/${encodeURIComponent(ref.book)}/${ref.chapter}/${ref.verse}`;
}

function sortedChapters(book: string): number[] {
  return Object.keys(bibleStructure[book] ?? {})
    .map((n) => parseInt(n, 10))
    .sort((a, b) => a - b);
}

// Puerto puro (sin DOM) de goNext() en script.js: avanza un versículo,
// cruzando de capítulo/libro cuando hace falta, con wraparound al final de la Biblia.
export function getNextReference(ref: VerseRef): VerseRef {
  const { book, chapter, verse } = ref;
  const bookChapters = bibleStructure[book];
  if (!bookChapters) return ref;

  const lastVerse = bookChapters[chapter];
  if (verse < lastVerse) {
    return { book, chapter, verse: verse + 1 };
  }

  const chapters = sortedChapters(book);
  const chapterIndex = chapters.indexOf(chapter);
  if (chapterIndex < chapters.length - 1) {
    return { book, chapter: chapters[chapterIndex + 1], verse: 1 };
  }

  const bookIndex = bookNames.indexOf(book);
  const nextBook = bookNames[(bookIndex + 1) % bookNames.length];
  const nextChapter = Math.min(...sortedChapters(nextBook));
  return { book: nextBook, chapter: nextChapter, verse: 1 };
}

// Puerto puro de goPrev(): retrocede un versículo, cruzando de capítulo/libro
// hacia atrás cuando hace falta, con wraparound al principio de la Biblia.
export function getPrevReference(ref: VerseRef): VerseRef {
  const { book, chapter, verse } = ref;
  const bookChapters = bibleStructure[book];
  if (!bookChapters) return ref;

  if (verse > 1) {
    return { book, chapter, verse: verse - 1 };
  }

  const chapters = sortedChapters(book);
  const chapterIndex = chapters.indexOf(chapter);
  if (chapterIndex > 0) {
    const prevChapter = chapters[chapterIndex - 1];
    return { book, chapter: prevChapter, verse: bookChapters[prevChapter] };
  }

  const bookIndex = bookNames.indexOf(book);
  const prevBook = bookNames[(bookIndex - 1 + bookNames.length) % bookNames.length];
  const prevChapters = sortedChapters(prevBook);
  const lastChap = prevChapters[prevChapters.length - 1];
  return { book: prevBook, chapter: lastChap, verse: bibleStructure[prevBook][lastChap] };
}

// Puerto de randomVerse(): referencia aleatoria válida en toda la Biblia.
export function getRandomReference(): VerseRef {
  const book = bookNames[Math.floor(Math.random() * bookNames.length)];
  const chapters = sortedChapters(book);
  const chapter = chapters[Math.floor(Math.random() * chapters.length)];
  const verse = Math.floor(Math.random() * bibleStructure[book][chapter]) + 1;
  return { book, chapter, verse };
}

// Compara dos referencias por posición absoluta en la Biblia (libro -> capítulo -> versículo),
// usado por la animación de flip para decidir la dirección (adelante/atrás).
export function compareReferences(a: VerseRef, b: VerseRef): number {
  const bookDiff = bookNames.indexOf(a.book) - bookNames.indexOf(b.book);
  if (bookDiff !== 0) return bookDiff;
  const chapterDiff = a.chapter - b.chapter;
  if (chapterDiff !== 0) return chapterDiff;
  return a.verse - b.verse;
}
