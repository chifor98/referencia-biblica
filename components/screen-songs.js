// Simple local-first songs component
 (function () {
  // guard to avoid double-initializing the songs behaviour which can cause
  // duplicate DOM injections / renderings when templates are applied more than once
  let songsInitialized = false;
  // DEBUG: set to true to force a small hardcoded list for visual testing
  // Default to false so the real local JSON list is used in normal runs
  const DEBUG_HARDCODE_SONGS = false;
  const DEBUG_SAMPLE_SONGS = [
    { id: 1, denumire: 'Prueba: Cántico de la mañana' },
    { id: 2, denumire: 'Prueba: Alabad al Señor' },
    { id: 3, denumire: 'Prueba: Camino de luz' }
  ];
  // Visible marker to confirm the songs component script is loaded
  try { console.log('[songs] script loaded'); } catch(e) { /* ignore */ }
  // Control whether the floating debug overlay is shown (false in production)
  const DEBUG_SHOW_OVERLAY = false;
  try {
    // report current counts of relevant nodes to detect duplicates
    const screens = document.querySelectorAll('#screen-songs');
    const lists = document.querySelectorAll('.songs-list');
    console.log('[songs] DOM counts -> #screen-songs:', screens.length, ', .songs-list:', lists.length);
  } catch (e) { /* ignore */ }
  // Do not show the floating debug overlay by default. Remove any existing one.
  try { const existingDbg = document.getElementById('songs-debug-overlay'); if (existingDbg && existingDbg.parentNode) existingDbg.parentNode.removeChild(existingDbg); } catch(e) {}

  function applySongsTemplate() {
    const tmpl = document.getElementById('screen-songs-template');
    if (!tmpl) return;
    const placeholder = document.getElementById('screen-songs');
    const frag = tmpl.content.cloneNode(true);
    const newNode = frag.firstElementChild || frag.firstChild;
    if (placeholder && placeholder.parentNode) placeholder.parentNode.replaceChild(newNode, placeholder);
    else {
      // if a #screen-songs already exists in the document, do not append another
      if (document.getElementById('screen-songs')) {
        try { console.log('[songs] applySongsTemplate: #screen-songs already exists, skipping append'); } catch(e){}
      } else {
        const containerMain = document.getElementById('container');
        if (containerMain) containerMain.appendChild(newNode);
      }
    }
    setTimeout(initSongsBehaviour, 10);
  }

  async function fetchLocalList() {
    const statusEl = document.getElementById('songs-status');
    const setStatus = txt => { try { if (statusEl) statusEl.textContent = txt; } catch(e){} };
    try {
      // Try a few common relative paths so the component works regardless of base path
      const candidates = [
        'components/lista-denumirii-PDC.json',
        './components/lista-denumirii-PDC.json',
        '/components/lista-denumirii-PDC.json'
      ];
      let resp = null;
      let arr = null;
      for (let i = 0; i < candidates.length; i++) {
        const url = candidates[i];
        try {
          setStatus('Încarcare listă: ' + url);
          resp = await fetch(url);
          if (resp && resp.ok) {
            arr = await resp.json();
            break;
          }
        } catch (e) {
          // try next
        }
      }
      if (!arr) throw new Error('No local file (all candidates failed)');
      if (!Array.isArray(arr)) return [];
      if (!Array.isArray(arr)) return [];

      // Deduplicate entries by normalized title (strip numeric prefixes and compare lowercase)
      // Also extract a hymn code (if present) like "008" so we can display it instead
      const stripPrefix = s => String(s || '').trim().replace(/^\s*\d+\s*[-._—:]?\s*/, '');
      const normalize = s => stripPrefix(s).toLowerCase();
      const extractCode = s => {
        // capture leading numeric code (keep leading zeros)
        const m = String(s || '').trim().match(/^\s*(\d+)\s*[-._—:]?\s*(.*)$/);
        if (!m) return { code: null, title: String(s || '').trim() };
        return { code: m[1], title: (m[2] || '').trim() };
      };

      const seen = new Set();
      const unique = [];
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i];
        const raw = (it && it.denumire) ? String(it.denumire).trim() : '';
        const key = normalize(raw);
        if (!key) continue;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(raw);
        }
      }

      const mapped = unique.map((rawTitle, idx) => {
        const parsed = extractCode(rawTitle);
        const displayTitle = parsed.title || stripPrefix(rawTitle);
        return { id: idx + 1, code: parsed.code || null, denumire: displayTitle };
      });
      try { console.log('[songs] fetchLocalList -> loaded', mapped.length, 'unique items (deduped)'); } catch(e) {}
      // Try to enrich mapped items with descriere/url from the detailed catalog
      try {
        const detailCandidates = [
          'components/Pe-Drumul-Credintei.json',
          './components/Pe-Drumul-Credintei.json',
          '/components/Pe-Drumul-Credintei.json'
        ];
        let detailsJson = null;
        for (let i = 0; i < detailCandidates.length; i++) {
          try {
            const r = await fetch(detailCandidates[i]);
            if (r && r.ok) { detailsJson = await r.json(); break; }
          } catch (e) { /* try next */ }
        }
        if (detailsJson && typeof detailsJson === 'object') {
          const mapByNorm = new Map();
          const mapByCode = new Map();
          Object.keys(detailsJson).forEach(k => {
            const o = detailsJson[k]; if (!o) return;
            const den = String(o.denumire || '');
            const denNorm = stripPrefix(den).toLowerCase();
            mapByNorm.set(denNorm, { key: k, obj: o });
            const m = den.match(/^\s*(\d+)\s*[-._—:]?/);
            if (m) mapByCode.set(m[1], { key: k, obj: o });
          });
          mapped.forEach(it => {
            const norm = String(it.denumire || '').toLowerCase();
            if (mapByNorm.has(norm)) {
              const found = mapByNorm.get(norm);
              it.detailId = found.key;
              it.descriere = found.obj.descriere || null;
              it.url = found.obj.url || found.obj.url_fisier || null;
              it.url_fisier = found.obj.url_fisier || null;
            } else if (it.code && mapByCode.has(it.code)) {
              const found = mapByCode.get(it.code);
              it.detailId = found.key;
              it.descriere = found.obj.descriere || null;
              it.url = found.obj.url || found.obj.url_fisier || null;
              it.url_fisier = found.obj.url_fisier || null;
            }
          });
          // cache details for later
          window._songs_details_cache = detailsJson;
        }
      } catch (e) { /* non-fatal */ }

      setStatus(mapped.length + ' cântece încărcate');
      return mapped;
    } catch (e) {
      console.warn('fetchLocalList error', e);
      try { if (document.getElementById('songs-status')) document.getElementById('songs-status').textContent = 'Eroare la încărcare: ' + (e && e.message ? e.message : String(e)); } catch(e) {}
      return [];
    }
  }

  function renderList(items) {
    const listEl = document.getElementById('songs-list');
    if (!listEl) return;
    listEl.style.display = 'block';
    listEl.innerHTML = '';
    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'songs-empty';
      empty.textContent = 'Nicio cântare găsită.';
      listEl.appendChild(empty);
      return;
    }
    items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'song-item';
      div.setAttribute('data-id', it.id);
      if (it.detailId) div.setAttribute('data-detail-id', it.detailId);
      // Remove any numeric prefix from the displayed title (e.g. "008 " or "448 - ")
      const displayTitle = String(it.denumire || '');
      const leftLabel = (it.code ? it.code : String(it.id));
      div.textContent = `${leftLabel} — ${displayTitle}`;
      div.addEventListener('click', () => selectSong(it));
      listEl.appendChild(div);
    });
    // update visible counter if present
    const countEl = document.getElementById('songs-count');
    if (countEl) countEl.textContent = `${items.length} canciones`;
    console.debug('[songs] renderList -> rendered', items.length, 'items');

    // DEBUG overlay: also render a small floating debug box into document.body (optional)
    if (DEBUG_SHOW_OVERLAY) {
      try {
        let dbg = document.getElementById('songs-debug-overlay');
        if (!dbg) {
          dbg = document.createElement('div');
          dbg.id = 'songs-debug-overlay';
          dbg.style.position = 'fixed';
          dbg.style.right = '12px';
          dbg.style.bottom = '12px';
          dbg.style.background = 'rgba(0,0,0,0.8)';
          dbg.style.color = '#fff';
          dbg.style.padding = '10px 12px';
          dbg.style.borderRadius = '8px';
          dbg.style.zIndex = '99999999';
          dbg.style.maxWidth = '320px';
          dbg.style.fontSize = '13px';
          dbg.style.fontFamily = 'sans-serif';
          document.body.appendChild(dbg);
        }
        const preview = items.slice(0,6).map(it => `• ${it.denumire}`).join('\n');
        dbg.textContent = `${items.length} items rendered\n${preview}`;
      } catch (e) { console.debug('[songs] debug overlay error', e); }
    }
  }

  function selectSong(item) {
    // Mark selected in the visible list and scroll into view.
    document.querySelectorAll('.songs-list .song-item').forEach(el => el.classList.remove('active'));
    const el = document.querySelector(`.songs-list .song-item[data-id="${item.id}"]`);
    if (el) {
      el.classList.add('active');
      if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // Update title and lyrics pane
    try {
      const titleEl = document.getElementById('song-title');
      const lyricsEl = document.getElementById('song-lyrics');
      if (titleEl) titleEl.textContent = (item.code ? `${item.code} — ` : '') + (item.denumire || '');
      if (lyricsEl) {
        lyricsEl.textContent = 'Se încarcă versurile...';
      }

      // If the item already contains 'descriere' (enriched during list fetch), use it
      const loadDetails = async () => {
        try {
          if (item.descriere) {
            if (lyricsEl) lyricsEl.innerHTML = escapeHtml(item.descriere).replace(/\n/g, '<br>');
            // append resource link if present on the item
            if (item.url || item.url_fisier) {
              try { const prev = document.getElementById('song-resource-link'); if (prev && prev.parentNode) prev.parentNode.removeChild(prev); } catch(e){}
              try {
                const wrap = document.createElement('div');
                wrap.id = 'song-resource-link';
                wrap.style.marginTop = '12px';
                const a = document.createElement('a');
                a.href = item.url || item.url_fisier;
                a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.textContent = 'Abrir recurso (archivo/versión online)';
                a.style.display = 'inline-block'; a.style.marginTop = '8px'; a.style.color = '#2b6cb0';
                if (lyricsEl && lyricsEl.parentNode) lyricsEl.parentNode.appendChild(wrap).appendChild(a);
              } catch (e) { /* ignore */ }
            }
            return;
          }

          console.debug('[songs] selectSong -> loading details for', item);
          if (!window._songs_details_cache) {
            try {
              const resp = await fetch('components/Pe-Drumul-Credintei.json');
              if (!resp.ok) throw new Error('Detalles no disponibles');
              const json = await resp.json();
              window._songs_details_cache = json;
            } catch (e) { window._songs_details_cache = null; console.warn('[songs] details fetch failed', e); }
          }

          const details = window._songs_details_cache;
          if (!details) {
            if (lyricsEl) lyricsEl.textContent = 'Versuri no disponibles.';
            return;
          }

          const norm = s => String(s || '').trim().replace(/^\s*\d+\s*[-._—:]?\s*/, '').toLowerCase();
          const targetTitle = (item.denumire || '').toLowerCase();
          const targetCode = item.code ? String(item.code) : null;
          let found = null;
          if (item.detailId && details[item.detailId]) {
            found = details[item.detailId];
            console.debug('[songs] details match via detailId ->', item.detailId);
          } else {
            found = Object.values(details).find(o => {
              const den = String(o.denumire || '');
              const denNorm = norm(den);
              if (targetCode && den.indexOf(targetCode) !== -1) return true;
              if (denNorm === targetTitle) return true;
              return false;
            });
          }

          console.debug('[songs] details loaded, entries:', details ? Object.keys(details).length : 0, 'found match:', !!found, 'item.detailId:', item.detailId);
          if (found) {
            const desc = found.descriere || found.description || '';
            if (lyricsEl) lyricsEl.innerHTML = desc ? escapeHtml(desc).replace(/\n/g, '<br>') : 'Versuri indisponibile.';
            if (found.url_fisier || found.url) {
              const linkUrl = found.url || found.url_fisier;
              try {
                const prev = document.getElementById('song-resource-link'); if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
                const wrap = document.createElement('div'); wrap.id = 'song-resource-link'; wrap.style.marginTop = '12px';
                const a = document.createElement('a'); a.href = linkUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.textContent = 'Abrir recurso (archivo/versión online)'; a.style.display = 'inline-block'; a.style.marginTop = '8px'; a.style.color = '#2b6cb0';
                if (lyricsEl && lyricsEl.parentNode) lyricsEl.parentNode.appendChild(wrap).appendChild(a);
              } catch (e) { /* ignore link append errors */ }
            }
          } else {
            if (lyricsEl) lyricsEl.textContent = 'Versuri indisponibile pentru această cântare.';
            const prev = document.getElementById('song-resource-link'); if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
          }
        } catch (e) { console.warn('[songs] loadDetails error', e); }
      };

      loadDetails();
    } catch (e) {
      console.warn('[songs] selectSong render error', e);
    }
  }

  function showSuggestions(items) {
    const box = document.getElementById('songs-suggestions');
    if (!box) return;
    box.innerHTML = '';
    if (!items || items.length === 0) { box.style.display = 'none'; return; }
    const slice = items.slice(0, 8);
    console.debug('[songs] showSuggestions ->', slice.length, 'items for query', { box, parent: box.parentElement });
    slice.forEach(it => {
      const d = document.createElement('div');
      d.className = 'suggestion';
      d.setAttribute('data-id', it.id);
      d.setAttribute('aria-selected', 'false');
      d.tabIndex = -1;
      const smallLabel = it.code ? `#${it.code}` : `#${it.id}`;
      d.innerHTML = `<strong>${escapeHtml(it.denumire)}</strong><small>${smallLabel}</small>`;
      d.addEventListener('click', () => chooseSuggestion(it.id));
      box.appendChild(d);
    });
    // use class toggle so CSS debug helpers can take effect
    box.classList.add('show');
  }

  function clearSuggestions() {
    const box = document.getElementById('songs-suggestions'); if (!box) return; box.innerHTML = ''; box.classList.remove('show');
  }

  function chooseSuggestion(id) {
    const item = (window._songs_cache || []).find(s => String(s.id) === String(id));
    if (!item) return;
    const input = document.getElementById('songs-search-input'); if (input) input.value = item.denumire || '';
    clearSuggestions(); selectSong(item);
    const li = document.querySelector(`.songs-list .song-item[data-id="${item.id}"]`);
    if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function showLoading(show, msg) { const el = document.getElementById('songs-loading'); if (!el) return; if (msg) el.textContent = msg; el.style.display = show ? 'inline-block' : 'none'; }

  function showError(msg) { const el = document.getElementById('songs-error'); if (!el) return; if (!msg) { el.style.display = 'none'; el.textContent = ''; } else { el.style.display = 'inline-block'; el.textContent = msg; } }

  function initSongsBehaviour() {
    if (songsInitialized) { try { console.log('[songs] initSongsBehaviour called but already initialized'); } catch(e){}; return; }
    songsInitialized = true;
    const input = document.getElementById('songs-search-input');
    let songs = [];
    showLoading(true, 'Încărcare...');
  fetchLocalList().then(async arr => {
      // Order by numeric hymn code (if present) preserving leading zeros visually,
      // otherwise fall back to alphabetical order by title. Reassign ids to
      // match the final ordering so data-id and selection remain consistent.
      const inputArr = (arr || []).slice();
      const sorter = (x, y) => {
        const ax = x && x.code ? parseInt(String(x.code).replace(/^0+/, '') || '0', 10) : null;
        const by = y && y.code ? parseInt(String(y.code).replace(/^0+/, '') || '0', 10) : null;
        if (ax !== null && by !== null) return ax - by;
        if (ax !== null) return -1; // x has code, y doesn't -> x first
        if (by !== null) return 1;  // y has code, x doesn't -> y first
        return String(x.denumire).localeCompare(String(y.denumire));
      };
      inputArr.sort(sorter);

      // Attempt to enrich songs with a detail id from the catalog so we can
      // directly lookup verses by internal id (avoids fuzzy matching later).
      const ensureDetails = async () => {
        if (!window._songs_details_cache) {
          try {
            const resp = await fetch('components/Pe-Drumul-Credintei.json');
            if (resp && resp.ok) {
              window._songs_details_cache = await resp.json();
            }
          } catch (e) { /* ignore */ }
        }
        const details = window._songs_details_cache || {};
        // build quick lookup maps
        const mapByNorm = new Map();
        const mapByCode = new Map();
        Object.keys(details).forEach(k => {
          const o = details[k];
          if (!o) return;
          const den = String(o.denumire || '');
          const denNorm = den.replace(/^\s*\d+\s*[-._—:]?\s*/, '').toLowerCase();
          mapByNorm.set(denNorm, k);
          const m = den.match(/^\s*(\d+)\s*[-._—:]?/);
          if (m) mapByCode.set(m[1], k);
        });

        // attach detailId where possible
        inputArr.forEach(s => {
          const norm = String(s.denumire || '').toLowerCase();
          if (mapByNorm.has(norm)) s.detailId = mapByNorm.get(norm);
          else if (s.code && mapByCode.has(s.code)) s.detailId = mapByCode.get(s.code);
        });
      };

      // run enrichment but don't block rendering too long
      await ensureDetails();

      // reassign ids according to sorted position
      songs = inputArr.map((s, i) => ({ ...s, id: i + 1 }));
      // If debugging, override with a small hardcoded sample so we can confirm rendering
      if (DEBUG_HARDCODE_SONGS) {
        songs = DEBUG_SAMPLE_SONGS.slice();
        window._songs_cache = songs;
        console.debug('[songs] DEBUG_HARDCODE_SONGS active -> using sample', songs.length);
      }
      window._songs_cache = songs;
  try { console.log('[songs] initSongsBehaviour -> cache populated with', songs.length, 'items'); } catch(e) {}
      // ensure a small counter element exists above the list for debugging/visibility
      let countEl = document.getElementById('songs-count');
      if (!countEl) {
        countEl = document.createElement('div');
        countEl.id = 'songs-count';
        countEl.style.margin = '6px 0 12px 0';
        countEl.style.color = '#dcdcdc';
        countEl.style.fontWeight = '700';
        const parent = document.querySelector('.search-center');
        if (parent) parent.insertBefore(countEl, document.getElementById('songs-list'));
      }
      countEl.textContent = `${songs.length} canciones cargadas`;
      renderList(songs);
      showLoading(false);
    }).catch(e => { showLoading(false); showError('Eroare la încărcare'); console.warn(e); });

    if (!input) return;
    let debounce = null;
    input.addEventListener('input', (ev) => {
      const q = (ev.target.value || '').trim().toLowerCase();
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        console.debug('[songs] input ->', q);
        if (!q) { clearSuggestions(); renderList(songs); return; }
        const filtered = (window._songs_cache || []).filter(s => {
          const inTitle = (s.denumire || '').toLowerCase().includes(q);
          const inId = String(s.id).includes(q);
          const inCode = s.code ? String(s.code).toLowerCase().includes(q) : false;
          return inTitle || inId || inCode;
        });
        console.debug('[songs] filtered ->', filtered.length);
        // update visible list and suggestions
        renderList(filtered);
        showSuggestions(filtered);
      }, 120);
    });

    // Wire the search button to apply the same filter
    const btn = document.getElementById('songs-search-btn');
    if (btn) btn.addEventListener('click', () => {
      const q = (input && input.value || '').trim().toLowerCase();
      if (!q) { clearSuggestions(); renderList(songs); return; }
      const filtered = (window._songs_cache || []).filter(s => {
        const inTitle = (s.denumire || '').toLowerCase().includes(q);
        const inId = String(s.id).includes(q);
        const inCode = s.code ? String(s.code).toLowerCase().includes(q) : false;
        return inTitle || inId || inCode;
      });
      renderList(filtered);
      showSuggestions(filtered);
    });

    input.addEventListener('keydown', (ev) => {
      const box = document.getElementById('songs-suggestions'); if (!box || box.style.display === 'none') return;
      const items = Array.from(box.querySelectorAll('.suggestion'));
      if (!items.length) return;
      const current = items.findIndex(i => i.getAttribute('aria-selected') === 'true');
      if (ev.key === 'ArrowDown') { ev.preventDefault(); const next = items[Math.min(items.length-1, Math.max(0, current+1))]; items.forEach(i => i.setAttribute('aria-selected','false')); if (next) next.setAttribute('aria-selected','true'); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); const prev = items[Math.max(0, (current === -1 ? items.length-1 : current-1))]; items.forEach(i => i.setAttribute('aria-selected','false')); if (prev) prev.setAttribute('aria-selected','true'); }
      else if (ev.key === 'Enter') { ev.preventDefault(); const sel = items.find(it => it.getAttribute('aria-selected') === 'true') || items[0]; if (sel) chooseSuggestion(sel.getAttribute('data-id')); }
      else if (ev.key === 'Escape') { clearSuggestions(); }
    });
  }

  try { window.applySongsTemplate = applySongsTemplate; } catch (e) { /* ignore */ }

  // Try to initialize when templates are injected by the app loader.
  // The global loader (`script.js`) dispatches a `screens-injected` event after it
  // replaces placeholders with template content. Listen for that and run the init
  // if the songs DOM was injected.
  try {
    document.addEventListener('screens-injected', () => {
      try { console.log('[songs] screens-injected event received'); } catch (e) {}
      try {
        try { console.log('[songs] DOM counts at screens-injected -> #screen-songs:', document.querySelectorAll('#screen-songs').length, ', .songs-list:', document.querySelectorAll('.songs-list').length); } catch(e) {}
        // If multiple #screen-songs were accidentally injected, keep only the first and remove extras
        try {
          const screens = Array.from(document.querySelectorAll('#screen-songs'));
          if (screens.length > 1) {
            console.warn('[songs] found duplicate #screen-songs elements, removing extras:', screens.length);
            for (let i = 1; i < screens.length; i++) {
              const s = screens[i]; if (s && s.parentNode) s.parentNode.removeChild(s);
            }
          }
        } catch(e) { /* ignore */ }
        // if the list container exists, run the initializer
        if (document.getElementById('songs-list') || document.getElementById('songs-search-input')) {
          try { initSongsBehaviour(); } catch (e) { console.warn('[songs] init after screens-injected failed', e); }
        }
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }

  // Also attempt to initialize immediately if the DOM already contains the songs elements
  try { if (document.getElementById('songs-list') || document.getElementById('songs-search-input')) { console.log('[songs] initializing immediately (elements present)'); initSongsBehaviour(); } } catch (e) { /* ignore */ }
})();
