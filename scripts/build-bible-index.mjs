// Genera public/bible-index/bible-index.json a partir de data/ron-rccv.usfx.xml.
// Puerto a build-time de loadBibleFromXML() (antes: components/screen-voice.js),
// para no parsear 4.6MB de XML + generar n-gramas en el navegador de cada visitante.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { bibleStructure } from '../lib/bible-structure.ts';
import { bookCodeMap } from '../lib/book-codes.ts';
import { getSignificantWords, generateNGrams } from '../lib/romanian-text.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XML_PATH = path.join(__dirname, '..', 'data', 'ron-rccv.usfx.xml');
const OUT_DIR = path.join(__dirname, '..', 'public', 'bible-index');
const OUT_PATH = path.join(OUT_DIR, 'bible-index.json');

// El <h> del XML usa diacríticos/mayúsculas distintos a bibleStructure en varios
// libros (p.ej. "Proverbe" vs "Proverbele", ţ-cedilla vs ț-comma). El id de 3
// letras del XML sí coincide siempre con bookCodeMap, así que lo usamos como
// clave canónica en vez de confiar en el texto de <h>.
const codeToBookName = Object.fromEntries(Object.entries(bookCodeMap).map(([name, code]) => [code, name]));

async function main() {
  console.log('📖 Leyendo XML fuente...');
  const xml = await readFile(XML_PATH, 'utf-8');

  const verses = [];
  const ngramIndex = new Map();
  let totalBooks = 0;

  const bookRe = /<book id="([A-Z0-9]+)">([\s\S]*?)<\/book>/g;
  let bookMatch;
  while ((bookMatch = bookRe.exec(xml)) !== null) {
    const [, bookId, bookContent] = bookMatch;
    const bookName = codeToBookName[bookId];
    if (!bookName || !bibleStructure[bookName]) {
      console.warn(`⚠️  Libro con id "${bookId}" no reconocido, se omite.`);
      continue;
    }
    totalBooks += 1;

    // Procesamos todo el contenido del libro como un único flujo (en vez de
    // por <p> como el original) para no perder versículos que continúan en
    // un párrafo de poesía sin su propio marcador <c id="N"/>.
    const chapterNums = Array.from(bookContent.matchAll(/<c id="(\d+)"\s*\/>/g)).map((m) => parseInt(m[1], 10));
    const chapterParts = bookContent.split(/<c id="\d+"\s*\/>/);

    for (let i = 1; i < chapterParts.length; i += 1) {
      const chapterNum = chapterNums[i - 1];
      const versesRaw = chapterParts[i].split(/<v id="(\d+)"\s*\/>/);

      for (let j = 2; j < versesRaw.length; j += 2) {
        const verseNum = parseInt(versesRaw[j - 1], 10);
        const verseText = versesRaw[j].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!verseText) continue;

        const significantWords = getSignificantWords(verseText);
        const verseIndex = verses.length;
        verses.push({ book: bookName, chapter: chapterNum, verse: verseNum, text: verseText, significantWords });

        const ngrams = [
          ...generateNGrams(significantWords, 3),
          ...generateNGrams(significantWords, 4),
          ...generateNGrams(significantWords, 5),
        ];
        for (const ngram of ngrams) {
          let list = ngramIndex.get(ngram);
          if (!list) {
            list = [];
            ngramIndex.set(ngram, list);
          }
          list.push(verseIndex);
        }
      }
    }
  }

  const ngramIndexObj = Object.fromEntries(ngramIndex);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify({ verses, ngramIndex: ngramIndexObj }), 'utf-8');

  const stats = await stat(OUT_PATH);
  console.log(`✅ ${totalBooks} libros, ${verses.length} versete, ${ngramIndex.size} n-grame indexate.`);
  console.log(`   → ${path.relative(process.cwd(), OUT_PATH)} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

  const expectedBooks = Object.keys(bibleStructure).length;
  if (totalBooks !== expectedBooks) {
    console.warn(`⚠️  Se esperaban ${expectedBooks} libros (bibleStructure) pero se indexaron ${totalBooks}.`);
  }
}

main().catch((err) => {
  console.error('❌ Error generando el índice bíblico:', err);
  process.exit(1);
});
