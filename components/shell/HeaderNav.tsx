'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './HeaderNav.module.css';

const LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/biblia', label: 'Referință' },
  { href: '/cantari', label: 'Cântări' },
];

// Puerto de header-menu.js (NavigationManager): antes toggleaba clases .active
// a mano entre 5 "pantallas"; aquí la ruta activa (usePathname) es la única
// fuente de verdad, sin necesidad de sincronizar dos sistemas de navegación.
export function HeaderNav() {
  const pathname = usePathname();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.content}>
        <h1 className={styles.title}>Biserica Betel Bilbao</h1>
        <nav className={styles.menuBar} aria-label="Navigare principală">
          {LINKS.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={styles.menuBtn}
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
