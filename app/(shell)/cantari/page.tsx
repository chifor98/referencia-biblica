import { Suspense } from 'react';
import { SongsScreen } from '@/components/songs/SongsScreen';

// SongsScreen reads the selected song from the `?song=` query string via
// useSearchParams(), which Next.js requires to be wrapped in Suspense so the
// route can still be statically rendered.
export default function CantariPage() {
  return (
    <Suspense fallback={null}>
      <SongsScreen />
    </Suspense>
  );
}
