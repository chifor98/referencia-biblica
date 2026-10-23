import type { Metadata } from 'next';
import { Playfair_Display, Great_Vibes } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

// Fuente "de logo" para el nombre de la iglesia: script curvo y elegante,
// como en la versión original (index.html / home-cover.css).
const greatVibes = Great_Vibes({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  variable: '--font-great-vibes',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Referință Biblică',
  description: 'Lectura, recunoaștere vocală și cântări — Biserica Betel Bilbao',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className={`${playfair.variable} ${greatVibes.variable}`}>{children}</body>
    </html>
  );
}
