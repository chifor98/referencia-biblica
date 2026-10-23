'use client';

import { useEffect, useState } from 'react';
import { ChurchLogo } from '@/components/shared/ChurchLogo';
import styles from './HomeCover.module.css';

interface KnownVerse {
  text: string;
  reference: string;
}

// Port verbatim din components/home-cover.js (knownVerses).
const KNOWN_VERSES: KnownVerse[] = [
  {
    text: 'Cu Dumnezeu sunt toți în pace, iar fără El nu este nici o pace.',
    reference: 'Ioan 14:27',
  },
  {
    text: 'Iubirea nu țintește rău; iubirea nu-și caută interesul, ci al celorlalți.',
    reference: '1 Corinteni 13:4-5',
  },
  {
    text: 'Cred, deci înțeleg. Căci dacă nu cred, nici nu voi înțelege.',
    reference: 'Psalmi 27:10',
  },
  {
    text: 'Domnul este pastorul meu, nu mă va lipsi de nimic.',
    reference: 'Psalmi 23:1',
  },
  {
    text: 'Ies din lume, vin înspre Dumnezeu și-I cad în genunchi.',
    reference: 'Psalmul 42:5',
  },
  {
    text: 'Noi trăim prin credință, nu prin vedere.',
    reference: '2 Corinteni 5:7',
  },
  {
    text: 'Dragostea apei nu-și găsește locul în ființa celui ce teme pe Domnul.',
    reference: 'Proverbe 21:21',
  },
  {
    text: 'Domnul este lumina mea și mântuirea mea.',
    reference: 'Psalmi 27:1',
  },
  {
    text: 'Fii puternic și nădăjduiește în Domnul.',
    reference: 'Psalmi 27:14',
  },
  {
    text: 'Cu cât mai mult ne apropiem de Dumnezeu, cu atât mai puțin ne teme.',
    reference: '1 Ioan 4:18',
  },
  {
    text: 'Binecuvântat fie Domnul, că m-a ascultat pe mine.',
    reference: 'Psalmi 118:21',
  },
  {
    text: 'Cine crede în Fiul are viața veșnică.',
    reference: 'Ioan 3:36',
  },
  {
    text: 'Sărutări pline de iubire pe toți voi în Hristos Isus.',
    reference: '1 Petru 5:14',
  },
  {
    text: 'Iertarea vine din iubire, iar iubirea vine din Dumnezeu.',
    reference: '1 Ioan 4:7',
  },
  {
    text: 'Nu voi fi niciodată singur, pentru că Dumnezeu este cu mine.',
    reference: 'Matei 28:20',
  },
];

const VERSE_ROTATION_MS = 10_000;
const FADE_MS = 300;

function pickRandomVerse(current: KnownVerse): KnownVerse {
  if (KNOWN_VERSES.length <= 1) return KNOWN_VERSES[0];
  let next = current;
  while (next === current) {
    next = KNOWN_VERSES[Math.floor(Math.random() * KNOWN_VERSES.length)];
  }
  return next;
}

// Puerto de home-cover.js (displayRandomVerse + startVerseAutoRotation/stopVerseAutoRotation):
// acolo rotația depindea de hook-uri manuale de enter/exit al "ecranului"; aici
// un interval legat de ciclul de viață al componentei (useEffect cu cleanup pe
// unmount) obține același efect fără mecanismul vechi de screen-enter/exit.
export function HomeCover() {
  // Pornim cu primul verset (determinist) ca să nu existe diferență între
  // randarea pe server și hidratarea pe client; primul verset aleatoriu real
  // apare la prima rotație (10s), din interiorul intervalului — nu sincron
  // în efect, pentru a respecta react-hooks/set-state-in-effect.
  const [verse, setVerse] = useState<KnownVerse>(KNOWN_VERSES[0]);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setFading(true);
      fadeTimeout = setTimeout(() => {
        setVerse((current) => pickRandomVerse(current));
        setFading(false);
      }, FADE_MS);
    }, VERSE_ROTATION_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <div className={styles.homeCover}>
      <div className={styles.coverBackground} aria-hidden="true">
        <div className={`${styles.coverTextBg} ${styles.coverText1}`}>Biserica Betel Bilbao</div>
        <div className={`${styles.coverTextBg} ${styles.coverText2}`}>Biserica Betel Bilbao</div>
        <div className={`${styles.coverTextBg} ${styles.coverText3}`}>Biserica Betel Bilbao</div>
        <div className={`${styles.coverTextBg} ${styles.coverText4}`}>Biserica Betel Bilbao</div>
        <div className={`${styles.coverTextBg} ${styles.coverText5}`}>Biserica Betel Bilbao</div>
        <div className={`${styles.coverTextBg} ${styles.coverText6}`}>Biserica Betel Bilbao</div>
      </div>

      <div className={styles.coverContent}>
        <div className={styles.logoContainer}>
          <ChurchLogo className={styles.logoSvg} />
        </div>

        <h1 className={styles.coverTitle}>Biserica Betel Bilbao</h1>

        <div className={styles.versesSection}>
          <div className={styles.verseContainer}>
            <p className={styles.verseText} style={{ opacity: fading ? 0 : 1 }}>
              &quot;{verse.text}&quot;
            </p>
            <p className={styles.verseReference} style={{ opacity: fading ? 0 : 1 }}>
              {verse.reference}
            </p>
          </div>
        </div>
      </div>

      <div className={`${styles.cornerDecoration} ${styles.cornerTopLeft}`} aria-hidden="true" />
      <div className={`${styles.cornerDecoration} ${styles.cornerTopRight}`} aria-hidden="true" />
      <div className={`${styles.cornerDecoration} ${styles.cornerBottomLeft}`} aria-hidden="true" />
      <div className={`${styles.cornerDecoration} ${styles.cornerBottomRight}`} aria-hidden="true" />
    </div>
  );
}
