// Screen-selection specific script
// Depends on shared globals in script.js: bibleStructure, setReference, fetchAndShowVerse, goToReadingScreen

// Función para rellenar las opciones de un desplegable
function fillDropdown(dropdownId, options, isBook = false) {
    // try to scope to injected screen-selection container first to avoid ID collisions
    const root = document.getElementById('screen-selection');
    const dropdown = (root && root.querySelector(`#${dropdownId}`)) || document.getElementById(dropdownId);
    if (!dropdown) return;
    dropdown.innerHTML = '';
    if (!options || options.length === 0) {
        const p = document.createElement('p');
        p.setAttribute('data-value', '');
        p.textContent = isBook ? 'Nicio carte găsită' : 'Alegeți mai întâi cartea';
        p.style.opacity = '0.7';
        dropdown.appendChild(p);
        return;
    }

    options.forEach(option => {
        const p = document.createElement('p');
        p.setAttribute('data-value', option);
        p.textContent = option;
        dropdown.appendChild(p);
    });
}

// Toggle dropdown visibility
function attachSelectorToggles() {
    const root = document.getElementById('screen-selection') || document;
    root.querySelectorAll('.selector-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', function(event) {
            // No permitir clic si está deshabilitado
            if (this.getAttribute('data-disabled') === 'true') {
                event.stopPropagation();
                return;
            }

            // Close other dropdowns
            document.querySelectorAll('.dropdown-content.show').forEach(dd => {
                if (dd !== this.querySelector('.dropdown-content')) {
                    dd.classList.remove('show');
                }
            });

            const dropdown = this.querySelector('.dropdown-content');
            if (dropdown) dropdown.classList.toggle('show');
            event.stopPropagation();
        });
    });

    // close when clicking outside
    document.body.addEventListener('click', () => {
        const root = document.getElementById('screen-selection') || document;
        root.querySelectorAll('.dropdown-content').forEach(dd => {
            dd.classList.remove('show');
        });
    });
}

// Handlers for main selectors
function handleBookSelection(bookName) {
    const bookData = bibleStructure[bookName] || {};
    const chapters = Object.keys(bookData);

    fillDropdown('chapter-dropdown', chapters);

    const firstChapter = chapters[0] || '1';
    const chapterEl = document.getElementById('selected-chapter');
    if (chapterEl) chapterEl.textContent = firstChapter;

    const chapterSelector = document.getElementById('chapter-selector');
    if (chapterSelector) chapterSelector.removeAttribute('data-disabled');

    const verseSelector = document.getElementById('verse-selector');
    if (verseSelector) verseSelector.setAttribute('data-disabled', 'true');
    const verseEl = document.getElementById('selected-verse');
    if (verseEl) verseEl.textContent = '0';

    handleChapterSelection(firstChapter);
}

function handleChapterSelection(chapterNumber) {
    const currentBookName = document.getElementById('selected-book')?.textContent;
    const bookData = bibleStructure[currentBookName] || {};
    const totalVerses = bookData[chapterNumber] || 0;
    const verses = Array.from({ length: totalVerses }, (_, i) => i + 1);

    fillDropdown('verse-dropdown', verses);

    const verseEl = document.getElementById('selected-verse');
    if (verseEl) verseEl.textContent = '0';
    const verseSelector = document.getElementById('verse-selector');
    if (verseSelector) verseSelector.removeAttribute('data-disabled');
}

function initializeSelectors() {
    const root = document.getElementById('screen-selection');
    const bookNames = Object.keys(bibleStructure);
    fillDropdown('book-dropdown', bookNames);

    const sb = root?.querySelector('#selected-book') || document.getElementById('selected-book'); if (sb) sb.textContent = 'Selectează';
    const sc = root?.querySelector('#selected-chapter') || document.getElementById('selected-chapter'); if (sc) sc.textContent = '0';
    const sv = root?.querySelector('#selected-verse') || document.getElementById('selected-verse'); if (sv) sv.textContent = '0';

    const chapterSelector = root?.querySelector('#chapter-selector') || document.getElementById('chapter-selector'); if (chapterSelector) chapterSelector.setAttribute('data-disabled', 'true');
    const verseSelector = root?.querySelector('#verse-selector') || document.getElementById('verse-selector'); if (verseSelector) verseSelector.setAttribute('data-disabled', 'true');

    attachSelectorToggles();

    // attach click handler for dropdown items (scoped)
    const dropdowns = (root && Array.from(root.querySelectorAll('#book-dropdown, #chapter-dropdown, #verse-dropdown'))) || Array.from(document.querySelectorAll('#book-dropdown, #chapter-dropdown, #verse-dropdown'));
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(event) {
            if (event.target.tagName === 'P') {
                const selectedValue = event.target.getAttribute('data-value');
                const selectedText = event.target.textContent;
                const wrapper = this.closest('.selector-wrapper');
                if (!wrapper) return;

                if (wrapper.id === 'book-selector') {
                    const el = root?.querySelector('#selected-book') || document.getElementById('selected-book'); if (el) el.textContent = selectedText;
                    handleBookSelection(selectedText);
                } else if (wrapper.id === 'chapter-selector') {
                    const el = root?.querySelector('#selected-chapter') || document.getElementById('selected-chapter'); if (el) el.textContent = selectedValue;
                    handleChapterSelection(selectedValue);
                } else if (wrapper.id === 'verse-selector') {
                    const el = root?.querySelector('#selected-verse') || document.getElementById('selected-verse'); if (el) el.textContent = selectedValue;

                    // ensure chapter is set
                    let book = (root?.querySelector('#selected-book') || document.getElementById('selected-book'))?.textContent.trim();
                    let chapter = parseInt((root?.querySelector('#selected-chapter') || document.getElementById('selected-chapter'))?.textContent, 10);
                    const verseNum = parseInt(selectedValue, 10);

                    if (book && (isNaN(chapter) || chapter === 0)) {
                        const bookData = bibleStructure[book];
                        if (bookData) {
                            const chapters = Object.keys(bookData).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
                            if (chapters.length > 0) {
                                chapter = chapters[0];
                                const chapEl = root?.querySelector('#selected-chapter') || document.getElementById('selected-chapter'); if (chapEl) chapEl.textContent = String(chapter);
                                handleChapterSelection(String(chapter));
                            }
                        }
                    }

                    const bookData = bibleStructure[book] || {};
                    const totalVerses = bookData[chapter] || 0;

                    if (book && !isNaN(chapter) && !isNaN(verseNum) && verseNum >= 1 && verseNum <= totalVerses) {
                        // use setReference so the global cached reference (_currentReference) is updated
                        // and handlers that depend on selected-* elements run consistently.
                        try {
                            setReference(book, chapter, verseNum, true);
                        } catch (e) {
                            // fallback to goToReadingScreen if setReference is not available for some reason
                            try { setTimeout(() => goToReadingScreen(book, chapter, verseNum), 40); } catch (ee) { /* ignore */ }
                        }
                    } else {
                        const statusEl = root?.querySelector('#fetch-status-reading') || document.getElementById('fetch-status-reading');
                        if (statusEl) statusEl.textContent = 'Verset invalid sau capitol necompletat.';
                    }
                }

                this.classList.remove('show');
            }
        });
    });
}

function _tryInitSelection() {
    try { initializeSelectors(); } catch (e) { /* might run before template injection */ }
}

document.addEventListener('screens-injected', _tryInitSelection);
// attempt immediate init in case templates were already injected
_tryInitSelection();
