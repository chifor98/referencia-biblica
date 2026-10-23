import { notFound } from 'next/navigation';
import { bibleStructure } from '@/lib/bible-structure';
import { ReadingScreen } from '@/components/reading/ReadingScreen';

interface PageProps {
  params: Promise<{ book: string; chapter: string; verse: string }>;
}

export default async function LeerPage({ params }: PageProps) {
  const { book: bookParam, chapter: chapterParam, verse: verseParam } = await params;
  const book = decodeURIComponent(bookParam);
  const chapter = parseInt(chapterParam, 10);
  const verse = parseInt(verseParam, 10);

  if (!bibleStructure[book] || Number.isNaN(chapter) || Number.isNaN(verse)) {
    notFound();
  }

  return <ReadingScreen book={book} chapter={chapter} verse={verse} />;
}
