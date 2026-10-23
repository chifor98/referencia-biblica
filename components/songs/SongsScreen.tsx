'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { filterSongs, findSongById, useSongs, type Song } from '@/lib/songs';
import styles from './SongsScreen.module.css';

const DEBOUNCE_MS = 120;
const MAX_SUGGESTIONS = 8;

// Puerto de components/screen-songs.html/.css/.js: mismo layout de dos paneles
// (aside de búsqueda ~25% + "libro" de lectura ~75%) y la misma búsqueda con
// debounce de 120ms + dropdown de sugerencias navegable por teclado. A diferencia
// del original, el texto de letras scrapeado (`verses`/`refren`) no distingue
// de forma fiable qué estrofa es el refren ni cuántas veces se repite, así
// que en vez de reconstruir eso se incrusta directamente el .ppt original
// (el mismo que se proyecta en la iglesia) vía el visor público de Microsoft
// Office — su orden real de diapositivas ya es correcto.
//
// Deviation: the old app kept selection state purely in memory (no per-song
// routing). We additionally mirror the selected song's id into `?song=<id>`
// so a reading can be shared/bookmarked — selection still lives in component
// state, the URL is just kept in sync for shareability.
export function SongsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { songs, isLoading, error, refresh } = useSongs();

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('song'));
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const listRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const slidesFrameRef = useRef<HTMLIFrameElement>(null);
  const slidesWrapRef = useRef<HTMLDivElement>(null);
  const [isSlidesFullscreen, setIsSlidesFullscreen] = useState(false);

  // El propio visor de Microsoft tiene un botón de pantalla completa, pero al
  // ser contenido de otro origen (view.officeapps.live.com) abre una pestaña
  // nueva en vez de expandirse — no podemos tocar ese botón. Ponemos en
  // pantalla completa el CONTENEDOR (slidesWrapRef), no el iframe: así, si
  // fuera el iframe, nada fuera de él se mostraría durante el modo pantalla
  // completa y no podríamos superponer nuestro propio botón de "salir" para
  // quien no sepa de la tecla Esc.
  const openSlidesFullscreen = useCallback(() => {
    slidesWrapRef.current?.requestFullscreen().catch(() => {
      // El navegador puede negar el pedido (sin gesto del usuario, sin
      // soporte, etc.) — no hay nada que mostrar, el iframe sigue visible igual.
    });
  }, []);

  const closeSlidesFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsSlidesFullscreen(document.fullscreenElement === slidesWrapRef.current);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const filtered = useMemo(() => filterSongs(songs, debouncedQuery), [songs, debouncedQuery]);
  const suggestions = useMemo(() => filtered.slice(0, MAX_SUGGESTIONS), [filtered]);
  const selectedSong = useMemo(() => findSongById(songs, selectedId), [songs, selectedId]);

  // Deep-link: scroll the selected item into view once the list is loaded
  // (e.g. when landing directly on /cantari?song=37).
  useEffect(() => {
    if (!selectedId) return;
    const el = listRefs.current.get(selectedId);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, filtered]);

  const selectSong = useCallback(
    (song: Song) => {
      setSelectedId(song.id);
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
      const params = new URLSearchParams(searchParams.toString());
      params.set('song', song.id);
      router.replace(`/cantari?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSuggestionsOpen(true);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setActiveSuggestion((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActiveSuggestion((i) => Math.max(0, i - 1));
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const song = suggestions[activeSuggestion >= 0 ? activeSuggestion : 0];
      if (song) selectSong(song);
    } else if (ev.key === 'Escape') {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
    }
  };

  const showSuggestions = suggestionsOpen && inputValue.trim().length > 0 && suggestions.length > 0;

  return (
    <div className={styles.wrap}>
      <aside className={styles.aside}>
        <div className={styles.searchPanel}>
          <div className={styles.searchIcon} aria-hidden="true">
            🔍
          </div>
          <h1 className={styles.searchTitle}>Căutare titluri</h1>

          <div className={styles.searchBoxWrap}>
            <div className={styles.searchBox}>
              <label htmlFor="songs-search-input" className={styles.visuallyHidden}>
                Căutați cântări
              </label>
              <input
                id="songs-search-input"
                type="search"
                className={styles.input}
                placeholder="Introduceți termenul de căutare..."
                aria-label="Căutați cântări"
                autoComplete="off"
                value={inputValue}
                onChange={(ev) => handleInputChange(ev.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setSuggestionsOpen(false)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {showSuggestions && (
              <div className={styles.suggestions} role="listbox" aria-label="Sugestii">
                {suggestions.map((song, idx) => (
                  <div
                    key={song.id}
                    role="option"
                    aria-selected={idx === activeSuggestion}
                    className={`${styles.suggestion} ${idx === activeSuggestion ? styles.suggestionActive : ''}`}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      selectSong(song);
                    }}
                  >
                    <strong>{song.title}</strong>
                    <small>{song.code ? `#${song.code}` : `#${song.id}`}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoading && songs.length === 0 && <div className={styles.statusText}>Se încarcă cântările...</div>}

          {error && songs.length === 0 && (
            <div className={styles.errorBox} role="alert">
              Eroare la încărcare.{' '}
              <button type="button" onClick={() => refresh()}>
                Reîncearcă
              </button>
            </div>
          )}

          {!isLoading && songs.length > 0 && (
            <div className={styles.statusText}>{filtered.length} cântări</div>
          )}

          <div className={styles.list} role="listbox" aria-label="Rezultate">
            {filtered.length === 0 && !isLoading ? (
              <div className={styles.empty}>Nicio cântare găsită.</div>
            ) : (
              filtered.map((song) => (
                <div
                  key={song.id}
                  ref={(el) => {
                    if (el) listRefs.current.set(song.id, el);
                    else listRefs.current.delete(song.id);
                  }}
                  role="option"
                  aria-selected={song.id === selectedId}
                  className={`${styles.listItem} ${song.id === selectedId ? styles.listItemActive : ''}`}
                  onClick={() => selectSong(song)}
                >
                  {song.code ? song.code : song.id} — {song.title}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.songHeader}>
          <h2 className={styles.songTitle}>
            {selectedSong
              ? `${selectedSong.code ? `${selectedSong.code} — ` : ''}${selectedSong.title}`
              : 'Selectați o cântare'}
          </h2>
        </div>

        <div className={styles.book}>
          <div className={styles.bookInner}>
            <div className={styles.bookPage}>
              {selectedSong?.fileUrl ? (
                <div ref={slidesWrapRef} className={styles.slidesFrameWrap}>
                  <iframe
                    key={selectedSong.id}
                    ref={slidesFrameRef}
                    className={styles.slidesFrame}
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedSong.fileUrl)}`}
                    title={`Diapozitive — ${selectedSong.title}`}
                    loading="lazy"
                  />
                  {/* Siempre en la misma esquina donde el visor de Microsoft
                      (otro origen, no tocable) tiene su propio botón de
                      pantalla completa — así queda donde la gente ya espera
                      buscarlo, y al estar SIEMPRE encima (entrando o
                      saliendo) también bloquea el clic al de ellos en los
                      dos estados — si solo se mostrara al entrar, al estar
                      ya en pantalla completa esa esquina quedaba descubierta
                      y el botón de Microsoft (que abre pestaña nueva en vez
                      de salir) volvía a ser clickeable. */}
                  <button
                    type="button"
                    className={styles.slidesFsBtn}
                    onClick={isSlidesFullscreen ? closeSlidesFullscreen : openSlidesFullscreen}
                    title={isSlidesFullscreen ? 'Ieși din ecran complet' : 'Ecran complet'}
                  >
                    {isSlidesFullscreen ? '✕' : '⛶'}
                  </button>
                </div>
              ) : (
                <div className={styles.lyrics}>
                  {selectedSong ? (
                    <p className={styles.placeholder}>Diapozitivele nu sunt disponibile pentru această cântare.</p>
                  ) : (
                    <p className={styles.placeholder}>Selectați o cântare pentru a vedea diapozitivele aici.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
