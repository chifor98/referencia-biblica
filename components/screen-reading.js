// Screen-reading specific script
// Depends on shared globals in script.js: bibleStructure, fetchAndShowVerse, setReference, goToSelectionScreen, goNext, goPrev

function fillDropdownLocal(dropdownId, options) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    dropdown.innerHTML = '';
    if (!options || options.length === 0) {
        const p = document.createElement('p');
        p.setAttribute('data-value', '');
        p.textContent = '—';
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

function handleSmallBookSelection(bookName) {
    const bookData = bibleStructure[bookName] || {};
    const chapters = Object.keys(bookData).map(n => parseInt(n, 10)).sort((a,b)=>a-b);

    fillDropdownLocal('small-chapter-dropdown', chapters);

    const curChap = parseInt(document.getElementById('small-selected-chapter')?.textContent, 10);
    const curVerse = parseInt(document.getElementById('small-selected-verse')?.textContent, 10);

    if (!isNaN(curChap) && chapters.includes(curChap)) {
        const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = String(curChap);
        const totalVerses = bookData[curChap] || 0;
        const verseOptions = Array.from({ length: totalVerses }, (_, i) => i + 1);
        fillDropdownLocal('small-verse-dropdown', verseOptions);

        if (!isNaN(curVerse) && curVerse >= 1 && curVerse <= totalVerses) {
            const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = String(curVerse);
            document.getElementById('selected-book').textContent = bookName;
            document.getElementById('selected-chapter').textContent = String(curChap);
            document.getElementById('selected-verse').textContent = String(curVerse);
            fetchAndShowVerse(bookName, curChap, curVerse);
            return;
        } else {
            const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = '0';
            return;
        }
    } else {
        const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = '0';
        const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = '0';
        fillDropdownLocal('small-verse-dropdown', []);
        document.getElementById('selected-book').textContent = bookName;
        document.getElementById('selected-chapter').textContent = '0';
        document.getElementById('selected-verse').textContent = '0';
        return;
    }
}

function handleSmallChapterSelection(chapterNumber) {
    const currentBookName = document.getElementById('small-selected-book')?.textContent;
    const bookData = bibleStructure[currentBookName] || {};
    const totalVerses = bookData[chapterNumber] || 0;
    const verses = Array.from({ length: totalVerses }, (_, i) => i + 1);

    fillDropdownLocal('small-verse-dropdown', verses);

    const curVerse = parseInt(document.getElementById('small-selected-verse')?.textContent, 10);
    if (!isNaN(curVerse) && curVerse >= 1 && curVerse <= totalVerses) {
        const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = String(curVerse);
        document.getElementById('selected-chapter').textContent = String(chapterNumber);
        document.getElementById('selected-verse').textContent = String(curVerse);
        fetchAndShowVerse(currentBookName, parseInt(chapterNumber, 10), curVerse);
    } else {
        const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = '0';
        document.getElementById('selected-chapter').textContent = String(chapterNumber);
        document.getElementById('selected-verse').textContent = '0';
    }
}

function initializeSmallSelectors() {
    const bookNames = Object.keys(bibleStructure);
    fillDropdownLocal('small-book-dropdown', bookNames);

    const sb = document.getElementById('small-selected-book'); if (sb) sb.textContent = 'Selectează';
    const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = '0';
    const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = '0';

    // attach click handlers
    document.querySelectorAll('#small-book-dropdown, #small-chapter-dropdown, #small-verse-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', function(event) {
            if (event.target.tagName === 'P') {
                const selectedValue = event.target.getAttribute('data-value');
                const selectedText = event.target.textContent;
                const wrapper = this.closest('.selector-wrapper');
                if (!wrapper) return;

                if (wrapper.id === 'small-book-selector') {
                    const el = document.getElementById('small-selected-book'); if (el) el.textContent = selectedText;
                    handleSmallBookSelection(selectedText);
                    const mainBook = document.getElementById('selected-book'); if (mainBook) mainBook.textContent = selectedText;
                } else if (wrapper.id === 'small-chapter-selector') {
                    const el = document.getElementById('small-selected-chapter'); if (el) el.textContent = selectedValue;
                    handleSmallChapterSelection(selectedValue);
                    const mainChap = document.getElementById('selected-chapter'); if (mainChap) mainChap.textContent = selectedValue;
                } else if (wrapper.id === 'small-verse-selector') {
                    const el = document.getElementById('small-selected-verse'); if (el) el.textContent = selectedValue;
                    // sync main and navigate
                    const book = document.getElementById('small-selected-book')?.textContent.trim();
                    const chapter = parseInt(document.getElementById('small-selected-chapter')?.textContent, 10);
                    const verseNum = parseInt(selectedValue, 10);
                    if (book && !isNaN(chapter) && !isNaN(verseNum)) {
                        document.getElementById('selected-book').textContent = book;
                        document.getElementById('selected-chapter').textContent = String(chapter);
                        document.getElementById('selected-verse').textContent = String(verseNum);
                        setReference(book, chapter, verseNum, true);
                    }
                }

                this.classList.remove('show');
            }
        });
    });

    // nav buttons
    document.getElementById('next-btn-reading')?.addEventListener('click', () => goNext());
    document.getElementById('prev-btn-reading')?.addEventListener('click', () => goPrev());
    document.getElementById('reset-btn-reading')?.addEventListener('click', () => goToSelectionScreen());
}

function _tryInitReading() {
    try { initializeSmallSelectors(); } catch (e) { /* may run before template injection */ }
}

document.addEventListener('screens-injected', _tryInitReading);
// attempt immediate init in case templates were already injected
_tryInitReading();
