// Pasul 1: Definirea structurii detaliate a Bibliei
// Fiecare carte are un obiect cu capitolele ca chei și numărul de versete ca valori.
const bibleStructure = {
    'Geneza': { 1: 31, 2: 25, 3: 24, 4: 26, 5: 32, 6: 22, 7: 24, 8: 22, 9: 29, 10: 32, 11: 32, 12: 20, 13: 18, 14: 24, 15: 21, 16: 16, 17: 27, 18: 33, 19: 38, 20: 18, 21: 34, 22: 24, 23: 20, 24: 67, 25: 34, 26: 35, 27: 46, 28: 22, 29: 35, 30: 43, 31: 55, 32: 32, 33: 20, 34: 31, 35: 29, 36: 43, 37: 36, 38: 30, 39: 23, 40: 23, 41: 57, 42: 38, 43: 34, 44: 34, 45: 28, 46: 34, 47: 31, 48: 22, 49: 33, 50: 26 },
    'Exodul': { 1: 22, 2: 25, 3: 22, 4: 31, 5: 23, 6: 30, 7: 25, 8: 32, 9: 35, 10: 29, 11: 10, 12: 51, 13: 22, 14: 31, 15: 27, 16: 36, 17: 16, 18: 27, 19: 25, 20: 26, 21: 36, 22: 31, 23: 33, 24: 18, 25: 40, 26: 37, 27: 21, 28: 43, 29: 46, 30: 38, 31: 18, 32: 35, 33: 23, 34: 35, 35: 35, 36: 38, 37: 29, 38: 31, 39: 43, 40: 38 },
    'Leviticul': { 1: 17, 2: 16, 3: 17, 4: 35, 5: 19, 6: 30, 7: 38, 8: 36, 9: 24, 10: 20, 11: 47, 12: 8, 13: 59, 14: 57, 15: 33, 16: 34, 17: 16, 18: 30, 19: 37, 20: 27, 21: 24, 22: 33, 23: 44, 24: 23, 25: 55, 26: 46, 27: 34 },
    'Numeri': { 1: 54, 2: 34, 3: 51, 4: 49, 5: 31, 6: 27, 7: 89, 8: 26, 9: 23, 10: 36, 11: 35, 12: 16, 13: 33, 14: 45, 15: 41, 16: 50, 17: 13, 18: 32, 19: 22, 20: 29, 21: 35, 22: 41, 23: 30, 24: 25, 25: 18, 26: 65, 27: 23, 28: 31, 29: 40, 30: 16, 31: 54, 32: 42, 33: 56, 34: 29, 35: 34, 36: 13 },
    'Deuteronomul': { 1: 46, 2: 37, 3: 29, 4: 49, 5: 33, 6: 25, 7: 26, 8: 20, 9: 29, 10: 22, 11: 32, 12: 32, 13: 18, 14: 29, 15: 23, 16: 22, 17: 20, 18: 22, 19: 21, 20: 20, 21: 23, 22: 30, 23: 25, 24: 22, 25: 19, 26: 19, 27: 26, 28: 68, 29: 29, 30: 20, 31: 30, 32: 52, 33: 29, 34: 12 },
    'Iosua': { 1: 18, 2: 24, 3: 17, 4: 24, 5: 15, 6: 27, 7: 26, 8: 35, 9: 27, 10: 43, 11: 23, 12: 24, 13: 33, 14: 15, 15: 63, 16: 10, 17: 18, 18: 28, 19: 51, 20: 9, 21: 45, 22: 34, 23: 16, 24: 33 },
    'Judecători': { 1: 36, 2: 23, 3: 31, 4: 24, 5: 31, 6: 40, 7: 25, 8: 35, 9: 57, 10: 18, 11: 40, 12: 15, 13: 25, 14: 20, 15: 20, 16: 31, 17: 13, 18: 31, 19: 30, 20: 48, 21: 25 },
    'Rut': { 1: 22, 2: 23, 3: 18, 4: 22 },
    '1 Samuel': { 1: 28, 2: 36, 3: 21, 4: 22, 5: 12, 6: 21, 7: 17, 8: 22, 9: 27, 10: 27, 11: 15, 12: 25, 13: 23, 14: 52, 15: 35, 16: 23, 17: 58, 18: 30, 19: 24, 20: 42, 21: 15, 22: 23, 23: 29, 24: 22, 25: 44, 26: 25, 27: 12, 28: 25, 29: 11, 30: 31, 31: 13 },
    '2 Samuel': { 1: 27, 2: 32, 3: 39, 4: 12, 5: 25, 6: 23, 7: 29, 8: 18, 9: 13, 10: 19, 11: 27, 12: 31, 13: 39, 14: 33, 15: 37, 16: 23, 17: 29, 18: 33, 19: 43, 20: 26, 21: 22, 22: 51, 23: 39, 24: 25 },
    '1 Împărați': { 1: 53, 2: 46, 3: 28, 4: 34, 5: 18, 6: 38, 7: 51, 8: 66, 9: 28, 10: 29, 11: 43, 12: 33, 13: 34, 14: 31, 15: 34, 16: 34, 17: 24, 18: 46, 19: 21, 20: 43, 21: 29, 22: 53 },
    '2 Împărați': { 1: 18, 2: 25, 3: 27, 4: 44, 5: 27, 6: 33, 7: 20, 8: 29, 9: 37, 10: 36, 11: 21, 12: 21, 13: 25, 14: 29, 15: 38, 16: 20, 17: 41, 18: 37, 19: 37, 20: 21, 21: 26, 22: 20, 23: 37, 24: 20, 25: 30 },
    '1 Cronici': { 1: 54, 2: 55, 3: 24, 4: 43, 5: 26, 6: 81, 7: 40, 8: 40, 9: 44, 10: 14, 11: 47, 12: 40, 13: 14, 14: 17, 15: 29, 16: 43, 17: 27, 18: 17, 19: 19, 20: 8, 21: 30, 22: 19, 23: 32, 24: 31, 25: 31, 26: 32, 27: 34, 28: 21, 29: 30 },
    '2 Cronici': { 1: 17, 2: 18, 3: 17, 4: 22, 5: 14, 6: 42, 7: 22, 8: 18, 9: 31, 10: 19, 11: 23, 12: 16, 13: 22, 14: 15, 15: 19, 16: 14, 17: 19, 18: 34, 19: 11, 20: 37, 21: 20, 22: 12, 23: 21, 24: 27, 25: 28, 26: 23, 27: 9, 28: 27, 29: 36, 30: 27, 31: 21, 32: 33, 33: 25, 34: 33, 35: 27, 36: 23 },
    'Ezra': { 1: 11, 2: 70, 3: 13, 4: 24, 5: 17, 6: 22, 7: 28, 8: 36, 9: 15, 10: 44 },
    'Neemia': { 1: 11, 2: 20, 3: 32, 4: 23, 5: 19, 6: 19, 7: 73, 8: 18, 9: 38, 10: 39, 11: 36, 12: 47, 13: 31 },
    'Estera': { 1: 22, 2: 23, 3: 15, 4: 17, 5: 14, 6: 14, 7: 10, 8: 17, 9: 32, 10: 3 },
    'Iov': { 1: 22, 2: 13, 3: 26, 4: 21, 5: 27, 6: 30, 7: 21, 8: 22, 9: 35, 10: 22, 11: 20, 12: 25, 13: 28, 14: 22, 15: 35, 16: 22, 17: 16, 18: 21, 19: 29, 20: 29, 21: 34, 22: 30, 23: 17, 24: 25, 25: 6, 26: 14, 27: 23, 28: 28, 29: 25, 30: 31, 31: 40, 32: 22, 33: 33, 34: 37, 35: 16, 36: 33, 37: 24, 38: 41, 39: 30, 40: 24, 41: 34, 42: 17 },
    'Psalmii': { 1: 6, 2: 12, 3: 8, 4: 8, 5: 12, 6: 10, 7: 17, 8: 9, 9: 20, 10: 18, 11: 7, 12: 8, 13: 6, 14: 7, 15: 5, 16: 11, 17: 15, 18: 50, 19: 14, 20: 9, 21: 13, 22: 31, 23: 6, 24: 10, 25: 22, 26: 12, 27: 14, 28: 9, 29: 11, 30: 12, 31: 24, 32: 11, 33: 22, 34: 22, 35: 28, 36: 12, 37: 40, 38: 22, 39: 13, 40: 17, 41: 13, 42: 11, 43: 5, 44: 26, 45: 17, 46: 11, 47: 9, 48: 14, 49: 20, 50: 23, 51: 19, 52: 9, 53: 6, 54: 7, 55: 23, 56: 13, 57: 11, 58: 11, 59: 17, 60: 12, 61: 8, 62: 12, 63: 11, 64: 10, 65: 13, 66: 20, 67: 7, 68: 35, 69: 36, 70: 5, 71: 24, 72: 20, 73: 28, 74: 23, 75: 10, 76: 12, 77: 20, 78: 72, 79: 13, 80: 19, 81: 16, 82: 8, 83: 18, 84: 12, 85: 13, 86: 17, 87: 7, 88: 18, 89: 52, 90: 17, 91: 16, 92: 15, 93: 5, 94: 23, 95: 11, 96: 13, 97: 12, 98: 9, 99: 9, 100: 5, 101: 8, 102: 28, 103: 22, 104: 35, 105: 45, 106: 48, 107: 43, 108: 13, 109: 31, 110: 7, 111: 10, 112: 10, 113: 9, 114: 8, 115: 18, 116: 19, 117: 2, 118: 29, 119: 176, 120: 7, 121: 8, 122: 9, 123: 4, 124: 8, 125: 5, 126: 6, 127: 5, 128: 6, 129: 8, 130: 8, 131: 3, 132: 18, 133: 3, 134: 3, 135: 21, 136: 26, 137: 9, 138: 8, 139: 24, 140: 13, 141: 10, 142: 7, 143: 12, 144: 15, 145: 21, 146: 10, 147: 20, 148: 14, 149: 9, 150: 6 },
    'Proverbele': { 1: 33, 2: 22, 3: 35, 4: 27, 5: 23, 6: 35, 7: 27, 8: 36, 9: 18, 10: 32, 11: 31, 12: 28, 13: 25, 14: 35, 15: 33, 16: 33, 17: 28, 18: 24, 19: 29, 20: 30, 21: 31, 22: 29, 23: 35, 24: 34, 25: 28, 26: 28, 27: 27, 28: 28, 29: 27, 30: 33, 31: 31 },
    'Eclesiastul': { 1: 18, 2: 26, 3: 22, 4: 16, 5: 20, 6: 12, 7: 29, 8: 17, 9: 18, 10: 20, 11: 10, 12: 14 },
    'Cântarea Cântărilor': { 1: 17, 2: 17, 3: 11, 4: 16, 5: 16, 6: 13, 7: 13, 8: 14 },
    'Isaia': { 1: 31, 2: 22, 3: 26, 4: 6, 5: 30, 6: 13, 7: 25, 8: 22, 9: 21, 10: 34, 11: 16, 12: 6, 13: 22, 14: 32, 15: 9, 16: 14, 17: 14, 18: 7, 19: 25, 20: 6, 21: 17, 22: 25, 23: 18, 24: 23, 25: 12, 26: 21, 27: 13, 28: 29, 29: 24, 30: 33, 31: 9, 32: 20, 33: 24, 34: 17, 35: 10, 36: 22, 37: 38, 38: 22, 39: 8, 40: 31, 41: 29, 42: 25, 43: 28, 44: 28, 45: 25, 46: 13, 47: 15, 48: 22, 49: 26, 50: 11, 51: 23, 52: 15, 53: 12, 54: 17, 55: 13, 56: 12, 57: 21, 58: 14, 59: 21, 60: 22, 61: 11, 62: 12, 63: 19, 64: 12, 65: 25, 66: 24 },
    'Ieremia': { 1: 19, 2: 37, 3: 25, 4: 31, 5: 31, 6: 30, 7: 34, 8: 22, 9: 26, 10: 25, 11: 23, 12: 17, 13: 27, 14: 22, 15: 21, 16: 21, 17: 27, 18: 23, 19: 15, 20: 18, 21: 14, 22: 30, 23: 40, 24: 10, 25: 38, 26: 24, 27: 22, 28: 17, 29: 32, 30: 24, 31: 40, 32: 44, 33: 26, 34: 22, 35: 19, 36: 32, 37: 21, 38: 28, 39: 18, 40: 16, 41: 18, 42: 22, 43: 13, 44: 30, 45: 5, 46: 28, 47: 7, 48: 47, 49: 39, 50: 46, 51: 64, 52: 34 },
    'Plângerile lui Ieremia': { 1: 22, 2: 22, 3: 66, 4: 22, 5: 22 },
    'Ezechiel': { 1: 28, 2: 10, 3: 27, 4: 17, 5: 17, 6: 14, 7: 27, 8: 18, 9: 11, 10: 22, 11: 25, 12: 28, 13: 23, 14: 23, 15: 8, 16: 63, 17: 24, 18: 32, 19: 14, 20: 49, 21: 32, 22: 31, 23: 49, 24: 27, 25: 17, 26: 21, 27: 36, 28: 26, 29: 21, 30: 26, 31: 18, 32: 32, 33: 33, 34: 31, 35: 15, 36: 38, 37: 28, 38: 23, 39: 29, 40: 49, 41: 26, 42: 20, 43: 27, 44: 31, 45: 25, 46: 24, 47: 23, 48: 35 },
    'Daniel': { 1: 21, 2: 49, 3: 30, 4: 37, 5: 31, 6: 28, 7: 28, 8: 27, 9: 27, 10: 21, 11: 45, 12: 13 },
    'Osea': { 1: 11, 2: 23, 3: 5, 4: 19, 5: 15, 6: 11, 7: 16, 8: 14, 9: 17, 10: 15, 11: 12, 12: 14, 13: 16, 14: 9 },
    'Ioel': { 1: 20, 2: 32, 3: 21 },
    'Amos': { 1: 15, 2: 16, 3: 15, 4: 13, 5: 27, 6: 14, 7: 17, 8: 14, 9: 15 },
    'Obadia': { 1: 21 },
    'Iona': { 1: 17, 2: 10, 3: 10, 4: 11 },
    'Mica': { 1: 16, 2: 13, 3: 12, 4: 13, 5: 15, 6: 16, 7: 20 },
    'Naum': { 1: 15, 2: 13, 3: 19 },
    'Habacuc': { 1: 17, 2: 20, 3: 19 },
    'Țefania': { 1: 18, 2: 15, 3: 20 },
    'Hagai': { 1: 15, 2: 23 },
    'Zaharia': { 1: 21, 2: 13, 3: 10, 4: 14, 5: 11, 6: 15, 7: 14, 8: 23, 9: 17, 10: 12, 11: 17, 12: 14, 13: 9, 14: 21 },
    'Maleahi': { 1: 14, 2: 17, 3: 18, 4: 6 },
    'Matei': { 1: 25, 2: 23, 3: 17, 4: 25, 5: 48, 6: 34, 7: 29, 8: 34, 9: 38, 10: 42, 11: 30, 12: 50, 13: 58, 14: 36, 15: 39, 16: 28, 17: 27, 18: 35, 19: 30, 20: 34, 21: 46, 22: 46, 23: 39, 24: 51, 25: 46, 26: 75, 27: 66, 28: 20 },
    'Marcu': { 1: 45, 2: 28, 3: 35, 4: 41, 5: 43, 6: 56, 7: 37, 8: 38, 9: 50, 10: 52, 11: 33, 12: 44, 13: 37, 14: 72, 15: 47, 16: 20 },
    'Luca': { 1: 80, 2: 52, 3: 38, 4: 44, 5: 39, 6: 49, 7: 50, 8: 56, 9: 62, 10: 42, 11: 54, 12: 59, 13: 35, 14: 35, 15: 32, 16: 31, 17: 37, 18: 43, 19: 48, 20: 47, 21: 38, 22: 71, 23: 56, 24: 53 },
    'Ioan': { 1: 51, 2: 25, 3: 36, 4: 54, 5: 47, 6: 71, 7: 53, 8: 59, 9: 41, 10: 42, 11: 57, 12: 50, 13: 38, 14: 31, 15: 27, 16: 33, 17: 26, 18: 40, 19: 42, 20: 31, 21: 25 },
    'Faptele Apostolilor': { 1: 26, 2: 47, 3: 26, 4: 37, 5: 42, 6: 15, 7: 60, 8: 40, 9: 43, 10: 48, 11: 30, 12: 25, 13: 52, 14: 28, 15: 41, 16: 40, 17: 34, 18: 28, 19: 41, 20: 38, 21: 40, 22: 30, 23: 35, 24: 27, 25: 27, 26: 32, 27: 44, 28: 31 },
    'Romani': { 1: 32, 2: 29, 3: 31, 4: 25, 5: 21, 6: 23, 7: 25, 8: 39, 9: 33, 10: 21, 11: 36, 12: 21, 13: 14, 14: 23, 15: 33, 16: 27 },
    '1 Corinteni': { 1: 31, 2: 16, 3: 23, 4: 21, 5: 13, 6: 20, 7: 40, 8: 13, 9: 27, 10: 33, 11: 34, 12: 31, 13: 13, 14: 40, 15: 58, 16: 24 },
    '2 Corinteni': { 1: 24, 2: 17, 3: 18, 4: 18, 5: 21, 6: 18, 7: 16, 8: 24, 9: 15, 10: 18, 11: 33, 12: 21, 13: 14 },
    'Galateni': { 1: 24, 2: 21, 3: 29, 4: 31, 5: 26, 6: 18 },
    'Efeseni': { 1: 23, 2: 22, 3: 21, 4: 32, 5: 33, 6: 24 },
    'Filipeni': { 1: 30, 2: 30, 3: 21, 4: 23 },
    'Coloseni': { 1: 29, 2: 23, 3: 25, 4: 18 },
    '1 Tesaloniceni': { 1: 10, 2: 20, 3: 13, 4: 18, 5: 28 },
    '2 Tesaloniceni': { 1: 12, 2: 17, 3: 18 },
    '1 Timotei': { 1: 20, 2: 15, 3: 16, 4: 16, 5: 25, 6: 21 },
    '2 Timotei': { 1: 18, 2: 26, 3: 17, 4: 22 },
    'Tit': { 1: 16, 2: 15, 3: 15 },
    'Filimon': { 1: 25 },
    'Evrei': { 1: 14, 2: 18, 3: 19, 4: 16, 5: 14, 6: 20, 7: 28, 8: 13, 9: 28, 10: 39, 11: 40, 12: 29, 13: 25 },
    'Iacov': { 1: 27, 2: 26, 3: 18, 4: 17, 5: 20 },
    '1 Petru': { 1: 25, 2: 25, 3: 22, 4: 19, 5: 14 },
    '2 Petru': { 1: 21, 2: 22, 3: 18 },
    '1 Ioan': { 1: 10, 2: 29, 3: 24, 4: 21, 5: 21 },
    '2 Ioan': { 1: 13 },
    '3 Ioan': { 1: 14 },
    'Iuda': { 1: 25 },
    'Apocalipsa': { 1: 20, 2: 29, 3: 22, 4: 11, 5: 14, 6: 17, 7: 17, 8: 13, 9: 21, 10: 11, 11: 19, 12: 18, 13: 18, 14: 20, 15: 8, 16: 21, 17: 18, 18: 24, 19: 21, 20: 15, 21: 27, 22: 21 }
};

// Selection and small selector UI logic moved to separate files:
// - components/screen-selection.js
// - components/screen-reading.js
// They are loaded via <script> tags in index.html and depend on the shared globals
// (bibleStructure, fetchAndShowVerse, setReference, goToReadingScreen, etc.)

// --- LÓGICA DE VISTAS (PANTALLAS) ---

function goToReadingScreen(book, chapter, verse) {
    // Cambiar a pantalla de lectura
    document.getElementById('screen-selection').classList.remove('active');
    document.getElementById('screen-reading').classList.add('active');
    
    // Mostrar referencia en pantalla de lectura
    const combined = `${book} ${chapter}:${verse}`;
    const refEl = document.getElementById('reading-reference');
    if (refEl) refEl.textContent = combined;
    // Actualizar small selectors visuales si existen
    const sb = document.getElementById('small-selected-book');
    const sc = document.getElementById('small-selected-chapter');
    const sv = document.getElementById('small-selected-verse');
    if (sb) sb.textContent = book;
    if (sc) sc.textContent = String(chapter);
    if (sv) sv.textContent = String(verse);
    
    // Asegurar que los small-dropdowns estén poblados para el libro y capítulo actuales
    // (esto soluciona el caso en que el libro viene precargado y el usuario quiere cambiar capítulo)
    try {
        if (typeof handleSmallBookSelection === 'function') {
            handleSmallBookSelection(book);
        }
        if (typeof handleSmallChapterSelection === 'function') {
            handleSmallChapterSelection(String(chapter));
        }
        // Asegurar que el verset pequeño muestre el versículo actual
        const smallVerseEl = document.getElementById('small-selected-verse');
        if (smallVerseEl) smallVerseEl.textContent = String(verse);
    } catch (e) {
        console.warn('Error sincronizando small selectors:', e);
    }

    // Cargar y mostrar versículo siempre
    fetchAndShowVerse(book, chapter, verse);
}

function goToSelectionScreen() {
    // Cambiar a pantalla de selección
    document.getElementById('screen-reading').classList.remove('active');
    document.getElementById('screen-selection').classList.add('active');
    
    // Resetear selecciones
    document.getElementById('selected-book').textContent = 'Selectează';
    document.getElementById('selected-chapter').textContent = '0';
    document.getElementById('selected-verse').textContent = '0';
    
    // Deshabilitar Capitol y Verset
    document.getElementById('chapter-selector').setAttribute('data-disabled', 'true');
    document.getElementById('verse-selector').setAttribute('data-disabled', 'true');
    
    // Limpiar texto de lectura
    document.getElementById('verse-text-reading').textContent = '';
    document.getElementById('fetch-status-reading').textContent = '';
}

// --- NUEVA LÓGICA: Navegación y fetch de texto ---

const DEFAULT_API_BASE = 'https://bible-api.com/data'; // configurable (usaremos /data/{translation}/{book}/{chapter})

// ===== CACHÉ DE RESPUESTAS DEL API =====
// Guardamos los capítulos ya obtenidos para evitar consultas redundantes
const apiCache = {};

function getCacheKey(translation, bookCode, chapter) {
    return `${translation}:${bookCode}:${chapter}`;
}

function getCachedChapter(translation, bookCode, chapter) {
    const key = getCacheKey(translation, bookCode, chapter);
    return apiCache[key] || null;
}

function setCachedChapter(translation, bookCode, chapter, data) {
    const key = getCacheKey(translation, bookCode, chapter);
    apiCache[key] = data;
}

// Mapeo de nombres de libros (rumano) a códigos de API
const bookCodeMap = {
    'Geneza': 'GEN',
    'Exodul': 'EXO',
    'Leviticul': 'LEV',
    'Numeri': 'NUM',
    'Deuteronomul': 'DEU',
    'Iosua': 'JOS',
    'Judecători': 'JDG',
    'Rut': 'RUT',
    '1 Samuel': '1SA',
    '2 Samuel': '2SA',
    '1 Împărați': '1KI',
    '2 Împărați': '2KI',
    '1 Cronici': '1CH',
    '2 Cronici': '2CH',
    'Ezra': 'EZR',
    'Neemia': 'NEH',
    'Estera': 'EST',
    'Iov': 'JOB',
    'Psalmii': 'PSA',
    'Proverbele': 'PRO',
    'Eclesiastul': 'ECC',
    'Cântarea Cântărilor': 'SNG',
    'Isaia': 'ISA',
    'Ieremia': 'JER',
    'Plângerile lui Ieremia': 'LAM',
    'Ezechiel': 'EZK',
    'Daniel': 'DAN',
    'Osea': 'HOS',
    'Ioel': 'JOL',
    'Amos': 'AMO',
    'Obadia': 'OBA',
    'Iona': 'JON',
    'Mica': 'MIC',
    'Naum': 'NAM',
    'Habacuc': 'HAB',
    'Țefania': 'ZEP',
    'Hagai': 'HAG',
    'Zaharia': 'ZEC',
    'Maleahi': 'MAL',
    'Matei': 'MAT',
    'Marcu': 'MRK',
    'Luca': 'LUK',
    'Ioan': 'JHN',
    'Faptele Apostolilor': 'ACT',
    'Romani': 'ROM',
    '1 Corinteni': '1CO',
    '2 Corinteni': '2CO',
    'Galateni': 'GAL',
    'Efeseni': 'EPH',
    'Filipeni': 'PHP',
    'Coloseni': 'COL',
    '1 Tesaloniceni': '1TH',
    '2 Tesaloniceni': '2TH',
    '1 Timotei': '1TI',
    '2 Timotei': '2TI',
    'Tit': 'TIT',
    'Filimon': 'PHM',
    'Evrei': 'HEB',
    'Iacov': 'JAS',
    '1 Petru': '1PE',
    '2 Petru': '2PE',
    '1 Ioan': '1JN',
    '2 Ioan': '2JN',
    '3 Ioan': '3JN',
    'Iuda': 'JUD',
    'Apocalipsa': 'REV'
};

// Current reference cached in JS so navigation doesn't depend on DOM presence
let _currentReference = null;
// Navigation lock to prevent double-invocation while a transition runs
let _isNavigating = false;

function getCurrentReference() {
    // Prefer cached current reference when available (keeps navigation correct even if some DOM nodes are missing)
    if (_currentReference && _currentReference.book && !isNaN(_currentReference.chapter) && !isNaN(_currentReference.verse)) {
        return _currentReference;
    }

    // Be defensive: selected-book/chapter/verse may not exist in all screen variants.
    const selBookEl = document.getElementById('selected-book');
    const selChapterEl = document.getElementById('selected-chapter');
    const selVerseEl = document.getElementById('selected-verse');

    let book = selBookEl?.textContent?.trim();
    let chapter = selChapterEl ? parseInt(selChapterEl.textContent, 10) : NaN;
    let verse = selVerseEl ? parseInt(selVerseEl.textContent, 10) : NaN;

    // fallback to small selectors if main selected_* are not present
    if ((!book || book === '') || isNaN(chapter) || isNaN(verse)) {
        const sb = document.getElementById('small-selected-book')?.textContent?.trim();
        const sc = document.getElementById('small-selected-chapter')?.textContent;
        const sv = document.getElementById('small-selected-verse')?.textContent;
        if ((!book || book === '') && sb) book = sb;
        if (isNaN(chapter) && sc) chapter = parseInt(sc, 10);
        if (isNaN(verse) && sv) verse = parseInt(sv, 10);
    }

    // fallback to reading reference text (e.g. "Numeri 1:21") if still missing
    if ((!book || book === '') || isNaN(chapter) || isNaN(verse)) {
        const rr = document.getElementById('reading-reference')?.textContent?.trim();
        if (rr) {
            const m = rr.match(/(.+?)\s+(\d+):(\d+)/);
            if (m) {
                if (!book || book === '') book = m[1].trim();
                if (isNaN(chapter)) chapter = parseInt(m[2], 10);
                if (isNaN(verse)) verse = parseInt(m[3], 10);
            }
        }
    }

    if (!book || isNaN(chapter) || isNaN(verse)) {
        // fallback to cached current reference if available
        if (_currentReference && _currentReference.book && !isNaN(_currentReference.chapter) && !isNaN(_currentReference.verse)) {
            return _currentReference;
        }
        return null;
    }

    // ensure cache matches DOM-derived reference
    _currentReference = { book, chapter, verse };
    return { book, chapter, verse };
}

function setReference(book, chapter, verse, shouldFetch = true) {
    if (!bibleStructure[book]) return;
    // update cached current reference first
    _currentReference = { book, chapter, verse };

    const selBookEl = document.getElementById('selected-book');
    if (selBookEl) selBookEl.textContent = book;
    // Some setups may not have the selection components injected (they were removed/commented).
    // Call handlers defensively so a missing DOM or handler doesn't break navigation.
    try {
        if (typeof handleBookSelection === 'function') handleBookSelection(book);
    } catch (e) {
        console.warn('handleBookSelection error (ignored):', e);
    }

    // set chapter and verses dropdowns
    const selChapEl = document.getElementById('selected-chapter');
    if (selChapEl) selChapEl.textContent = String(chapter);
    try {
        if (typeof handleChapterSelection === 'function') handleChapterSelection(String(chapter));
    } catch (e) {
        console.warn('handleChapterSelection error (ignored):', e);
    }

    const selVerseEl = document.getElementById('selected-verse');
    if (selVerseEl) selVerseEl.textContent = String(verse);

    // Notificar cambio de referencia para actualizar Autocitire
    if (typeof updateAutocitireReference === 'function') {
        updateAutocitireReference({ book, chapter, verse });
    }

    // Ir a pantalla de lectura
    goToReadingScreen(book, chapter, verse);
}

function fetchAndShowVerse(book, chapter, verse) {
    const translation = document.getElementById('translation-select')?.value || 'rccv';

    const bookCode = bookCodeMap[book];
    if (!bookCode) {
        document.getElementById('fetch-status-reading').textContent = `Carte "${book}" nu a fost găsită.`;
        document.getElementById('verse-text-reading').textContent = '';
        return;
    }

    const statusEl = document.getElementById('fetch-status-reading');
    const textEl = document.getElementById('verse-text-reading');
    
    statusEl.textContent = 'Se încarcă...';
    textEl.textContent = '';

    // Verificar si ya tenemos este capítulo en caché
    const cached = getCachedChapter(translation, bookCode, chapter);
    if (cached) {
        console.log('Usando datos en caché para:', book, chapter);
        displayVerse(cached, book, chapter, verse, statusEl, textEl);
        return;
    }

    // Si no está en caché, hacer fetch del API
    const base = DEFAULT_API_BASE.replace(/\/$/, '');
    const url = `${base}/${encodeURIComponent(translation)}/${encodeURIComponent(bookCode)}/${encodeURIComponent(String(chapter))}`;

    fetch(url, { timeout: 8000 }) // 8 segundos de timeout
        .then(resp => {
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return resp.json();
        })
        .then(data => {
            console.log('API Response:', data);
            
            // Guardar en caché
            setCachedChapter(translation, bookCode, chapter, data);
            
            // Mostrar el versículo
            displayVerse(data, book, chapter, verse, statusEl, textEl);
        })
        .catch(err => {
            console.error('Fetch error:', err);
            statusEl.textContent = `Eroare: ${err.message}. Încearcă din nou.`;
            textEl.textContent = '';
        });
}

// Create and show a temporary dropdown near an anchor element.
// items: array of { value, label }
// onSelect(item) called when user selects an item
function showTempDropdown(anchorEl, items, onSelect = () => {}) {
    if (!anchorEl || !items || !Array.isArray(items)) return null;

    // remove any existing temp dropdowns
    document.querySelectorAll('.temp-dropdown').forEach(el => el.remove());

    const dd = document.createElement('div');
    dd.className = 'dropdown-content temp-dropdown show';
    dd.style.position = 'absolute';
    dd.style.transform = 'none';
    dd.style.zIndex = 9999;

    items.forEach(it => {
        const p = document.createElement('p');
        p.setAttribute('data-value', String(it.value));
        p.textContent = it.label;
        dd.appendChild(p);
    });

    // position below anchorEl
    const rect = anchorEl.getBoundingClientRect();
    // small offset
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.left + window.scrollX;
    dd.style.left = left + 'px';
    dd.style.top = top + 'px';
    dd.style.minWidth = Math.max(120, rect.width) + 'px';

    // click handler
    const onDocClick = (ev) => {
        if (!dd.contains(ev.target)) {
            cleanup();
        }
    };

    function cleanup() {
        document.removeEventListener('click', onDocClick);
        if (dd && dd.parentNode) dd.parentNode.removeChild(dd);
    }

    dd.addEventListener('click', (ev) => {
        const p = ev.target.closest && ev.target.closest('p');
        if (!p) return;
        const val = p.getAttribute('data-value');
        const label = p.textContent;
        try { onSelect({ value: val, label }); } catch (e) { console.warn('temp dropdown onSelect error', e); }
        cleanup();
    });

    document.body.appendChild(dd);
    // click outside closes
    setTimeout(() => document.addEventListener('click', onDocClick), 10);
    return dd;
}

function displayVerse(data, book, chapter, verse, statusEl, textEl) {
    // Buscar el versículo en data.verses
    let text = '';
    if (data.verses && Array.isArray(data.verses)) {
        const vIndex = verse - 1; // versículos son 1-based, array es 0-based
        if (vIndex >= 0 && vIndex < data.verses.length && data.verses[vIndex].text) {
            text = data.verses[vIndex].text;
        }
    }

    if (!text) {
        statusEl.textContent = `Versiculul ${chapter}:${verse} nu a fost găsit.`;
        textEl.textContent = '';
        return;
    }

    textEl.textContent = text.trim();
    // Render the reference as discrete selectable parts (book and chapter:verse)
    // They are visually unobtrusive and only underline on hover to indicate clickability.
    try {
        const safeBook = String(book).replace(/"/g, '&quot;');
        // Render book, chapter and verse as separate clickable parts so each can open its small dropdown
        statusEl.innerHTML = `
            <span class="ref-book ref-part" data-book="${safeBook}">${book}</span>
            <span class="ref-chapter ref-part" data-chapter="${chapter}">${chapter}</span>
            <span class="ref-colon">:</span>
            <span class="ref-verse ref-part" data-verse="${verse}">${verse}</span>
        `;

        // attach click handler to statusEl to open the corresponding small selector dropdowns
        statusEl.onclick = (ev) => {
            try {
                // close any open dropdowns first
                document.querySelectorAll('.dropdown-content.show').forEach(dd => dd.classList.remove('show'));

                const bookEl = ev.target.closest && ev.target.closest('.ref-book');
                if (bookEl) {
                    const bookName = bookEl.getAttribute('data-book');
                    // populate small selectors for this book and open the book dropdown
                    try {
                        const sb = document.getElementById('small-selected-book'); if (sb) sb.textContent = bookName;
                        if (typeof handleSmallBookSelection === 'function') try { handleSmallBookSelection(bookName); } catch (e) { console.warn('handleSmallBookSelection:', e); }
                        const dd = document.getElementById('small-book-dropdown');
                        if (dd) {
                            dd.classList.add('show');
                        } else {
                            // fallback: show a temporary dropdown near the clicked reference so we stay on the reading screen
                            try {
                                const books = Object.keys(bibleStructure).map(b => ({ value: b, label: b }));
                                showTempDropdown(bookEl || statusEl, books, (item) => {
                                    try {
                                        const bookName2 = item && item.value ? String(item.value) : null;
                                        if (!bookName2) return;
                                        // preserve previous chapter/verse when possible
                                        const prevChap = parseInt(document.getElementById('small-selected-chapter')?.textContent, 10) || parseInt(chapter, 10) || 1;
                                        const prevVerse = parseInt(document.getElementById('small-selected-verse')?.textContent, 10) || parseInt(verse, 10) || 1;

                                        const bookData = bibleStructure[bookName2] || {};
                                        const chaptersList = Object.keys(bookData).map(n=>parseInt(n,10)).sort((a,b)=>a-b);

                                        let newChap, newVerse;
                                        if (bookData && typeof bookData[prevChap] !== 'undefined') {
                                            // same chapter exists in new book
                                            const totalVerses = bookData[prevChap] || 0;
                                            newChap = prevChap;
                                            if (totalVerses >= prevVerse) newVerse = prevVerse; else newVerse = 1;
                                        } else {
                                            // fallback to first chapter
                                            newChap = chaptersList.length ? chaptersList[0] : 1;
                                            newVerse = 1;
                                        }

                                        const sb = document.getElementById('small-selected-book'); if (sb) sb.textContent = bookName2;
                                        const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = String(newChap);
                                        const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = String(newVerse);

                                        if (typeof handleSmallBookSelection === 'function') try { handleSmallBookSelection(bookName2); } catch (e) { console.warn(e); }
                                        // load selected verse of the new book/chapter
                                        try { setReference(bookName2, newChap, newVerse, true); } catch (e) { console.warn('setReference after temp book select failed', e); }
                                    } catch (e) { console.warn('temp book select error', e); }
                                });
                            } catch (e) { console.warn('temp dropdown book fallback failed', e); }
                        }
                    } catch (e) { console.warn(e); }
                    return;
                }

                const chapEl = ev.target.closest && ev.target.closest('.ref-chapter');
                if (chapEl) {
                    const ch = parseInt(chapEl.getAttribute('data-chapter'), 10);
                    if (!isNaN(ch)) {
                        try {
                            const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = String(ch);
                            // ensure verses dropdown is populated for the current book/chapter
                            if (typeof handleSmallChapterSelection === 'function') try { handleSmallChapterSelection(String(ch)); } catch (e) { console.warn('handleSmallChapterSelection:', e); }
                            const dd = document.getElementById('small-chapter-dropdown');
                            if (dd) {
                                dd.classList.add('show');
                            } else {
                                try {
                                    const bookName = book;
                                    const chapters = Object.keys(bibleStructure[bookName] || {}).map(n => ({ value: n, label: n }));
                                    showTempDropdown(chapEl || statusEl, chapters, (item) => {
                                            try {
                                                const selChap = item && item.value ? parseInt(item.value, 10) : NaN;
                                                if (isNaN(selChap)) return;
                                                const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = String(selChap);
                                                if (typeof handleSmallChapterSelection === 'function') try { handleSmallChapterSelection(String(selChap)); } catch (e) { console.warn(e); }
                                                // load verse: keep previous verse only if this chapter has that many verses, otherwise set to 1
                                                const prevVerse = parseInt(document.getElementById('small-selected-verse')?.textContent, 10) || parseInt(verse, 10) || 1;
                                                const totalVerses = (bibleStructure[book] && bibleStructure[book][selChap]) || 0;
                                                const vToUse = (totalVerses >= prevVerse) ? prevVerse : 1;
                                                try { setReference(book, selChap, vToUse, true); } catch (e) { console.warn('setReference after temp chapter select failed', e); }
                                            } catch (e) { console.warn('temp chapter select error', e); }
                                        });
                                } catch (e) { console.warn('temp dropdown chapter fallback failed', e); }
                            }
                        } catch (e) { console.warn(e); }
                    }
                    return;
                }

                const verseEl = ev.target.closest && ev.target.closest('.ref-verse');
                if (verseEl) {
                    const v = parseInt(verseEl.getAttribute('data-verse'), 10);
                    if (!isNaN(v)) {
                        try {
                            // ensure verses list is populated for current chapter
                            const currentChapter = parseInt(document.getElementById('small-selected-chapter')?.textContent, 10);
                            if (isNaN(currentChapter)) {
                                // try to derive from displayed ref
                                const chFromRef = parseInt(chapter, 10);
                                if (!isNaN(chFromRef)) {
                                    const sc = document.getElementById('small-selected-chapter'); if (sc) sc.textContent = String(chFromRef);
                                    if (typeof handleSmallChapterSelection === 'function') try { handleSmallChapterSelection(String(chFromRef)); } catch (e) { /* ignore */ }
                                }
                            }
                            const sv = document.getElementById('small-selected-verse'); if (sv) sv.textContent = String(v);
                            const dd = document.getElementById('small-verse-dropdown');
                            if (dd) {
                                dd.classList.add('show');
                            } else {
                                try {
                                    const bookName = book;
                                    const chapNum = parseInt(document.getElementById('small-selected-chapter')?.textContent || chapter, 10);
                                    const total = (bibleStructure[bookName] && bibleStructure[bookName][chapNum]) || 0;
                                    const verses = Array.from({ length: total }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
                                    showTempDropdown(verseEl || statusEl, verses, (item) => {
                                        try {
                                            const selV = item && item.value ? parseInt(item.value, 10) : NaN;
                                            if (!isNaN(selV)) setReference(bookName, chapNum, selV, true);
                                        } catch (e) { console.warn('temp verse select error', e); }
                                    });
                                } catch (e) { console.warn('temp dropdown verse fallback failed', e); }
                            }
                        } catch (e) { console.warn(e); }
                    }
                    return;
                }
            } catch (e) {
                console.warn('statusEl click handler error', e);
            }
        };
    } catch (e) {
        // fallback: plain text
        statusEl.textContent = `${book} ${chapter}:${verse}`;
    }

    // Ajustar tamaño de letra para que el texto quepa en la hoja si es necesario.
    // Mantener el tamaño máximo (5rem) si cabe; reducir proporcionalmente hasta un mínimo.
    try {
        // preferimos usar el id si existe
        if (typeof fitVerseFontSize === 'function') fitVerseFontSize();
    } catch (e) {
        console.warn('fitVerseFontSize failed:', e);
    }
}

// Animación de pasar página: reproduce animaciones out -> update -> in
function flipTransition(direction, updateCallback) {
    // Animate the inner verse text element instead of the whole container
    const container = document.getElementById('verse-text-reading') || document.getElementById('verse-text-container-reading');
    if (!container) {
        updateCallback();
        return;
    }

    const outClass = direction === 'next' ? 'flip-out-left' : 'flip-out-right';
    const inClass = direction === 'next' ? 'flip-in-right' : 'flip-in-left';

    // Añadir clase de salida
    container.classList.add(outClass);

    // Cuando termine la animación de salida, actualizar el contenido y hacer animación de entrada
    const onOutEnd = () => {
        container.classList.remove(outClass);
        container.removeEventListener('animationend', onOutEnd);

        // clear safety timeout if set
        if (safetyTimer) {
            clearTimeout(safetyTimer);
            safetyTimer = null;
        }

        // Ejecutar la actualización (cambia la referencia y hace fetch)
        try {
            updateCallback();
        } catch (e) {
            console.error('Error en updateCallback durante flipTransition:', e);
        }

        // Forzar reflow antes de la animación de entrada para asegurar que la clase se aplique
        // eslint-disable-next-line no-unused-expressions
        container.offsetWidth;

        container.classList.add(inClass);

        const onInEnd = () => {
            container.classList.remove(inClass);
            container.removeEventListener('animationend', onInEnd);
            // navigation finished
            try { _isNavigating = false; } catch (e) { /* ignore */ }
            if (finalClearTimer) { clearTimeout(finalClearTimer); finalClearTimer = null; }
        };
        container.addEventListener('animationend', onInEnd);
    };

    container.addEventListener('animationend', onOutEnd);

    // Safety: if animationend doesn't fire (missing CSS, zero-duration, or other issue),
    // call the out-end handler after a short timeout so navigation still proceeds.
    let safetyTimer = setTimeout(() => {
        try {
            // only run if still present
            onOutEnd();
        } catch (e) {
            console.warn('flipTransition safety timer error', e);
        }
    }, 700);
    // Final guard: ensure navigation lock is cleared eventually even if animations don't fire
    let finalClearTimer = setTimeout(() => {
        try { _isNavigating = false; } catch (e) { /* ignore */ }
    }, 1400);
}

function randomVerse() {
    const books = Object.keys(bibleStructure);
    const book = books[Math.floor(Math.random() * books.length)];
    const chapters = Object.keys(bibleStructure[book]);
    const chapter = parseInt(chapters[Math.floor(Math.random() * chapters.length)], 10);
    const verse = Math.floor(Math.random() * bibleStructure[book][chapter]) + 1;
    setReference(book, chapter, verse, true);
}

function goNext() {
    if (_isNavigating) return;
    const cur = getCurrentReference();
    console.log('goNext: current', cur);
    if (!cur) return;
    const { book, chapter, verse } = cur;
    const bookChapters = bibleStructure[book];
    if (!bookChapters) return;

    // Compute next reference without applying it yet
    let target = null;

    const lastVerse = bookChapters[chapter];
    if (verse < lastVerse) {
        target = { book, chapter, verse: verse + 1 };
    } else {
        // next chapter
        const chapters = Object.keys(bookChapters).map(n => parseInt(n, 10)).sort((a,b)=>a-b);
        const chapterIndex = chapters.indexOf(chapter);
        if (chapterIndex < chapters.length - 1) {
            const nextChapter = chapters[chapterIndex + 1];
            target = { book, chapter: nextChapter, verse: 1 };
        } else {
            // next book
            const books = Object.keys(bibleStructure);
            const bookIndex = books.indexOf(book);
            const nextBook = books[(bookIndex + 1) % books.length];
            const nextChapter = Math.min(...Object.keys(bibleStructure[nextBook]).map(n=>parseInt(n,10)));
            target = { book: nextBook, chapter: nextChapter, verse: 1 };
        }
    }

    if (!target) return;

    console.log('goNext: target', target);
    _isNavigating = true;
    flipTransition('next', () => {
        setReference(target.book, target.chapter, target.verse, true);
    });
}

function goPrev() {
    if (_isNavigating) return;
    const cur = getCurrentReference();
    console.log('goPrev: current', cur);
    if (!cur) return;
    const { book, chapter, verse } = cur;
    const bookChapters = bibleStructure[book];
    if (!bookChapters) return;

    let target = null;

    if (verse > 1) {
        target = { book, chapter, verse: verse - 1 };
    } else {
        // previous chapter
        const chapters = Object.keys(bookChapters).map(n => parseInt(n, 10)).sort((a,b)=>a-b);
        const chapterIndex = chapters.indexOf(chapter);
        if (chapterIndex > 0) {
            const prevChapter = chapters[chapterIndex - 1];
            const lastVersePrevChapter = bookChapters[prevChapter];
            target = { book, chapter: prevChapter, verse: lastVersePrevChapter };
        } else {
            // previous book
            const books = Object.keys(bibleStructure);
            const bookIndex = books.indexOf(book);
            const prevBook = books[(bookIndex - 1 + books.length) % books.length];
            const prevChapters = Object.keys(bibleStructure[prevBook]).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
            const lastChap = prevChapters[prevChapters.length - 1];
            const lastVerse = bibleStructure[prevBook][lastChap];
            target = { book: prevBook, chapter: lastChap, verse: lastVerse };
        }
    }

    if (!target) return;

    console.log('goPrev: target', target);
    _isNavigating = true;
    flipTransition('prev', () => {
        setReference(target.book, target.chapter, target.verse, true);
    });
}

// Note: reading navigation buttons removed from UI per user preference; navigation remains available via keyboard.

// Keyboard navigation: use left/right arrow keys to go previous/next.
// Ignore events when focus is inside an input, textarea, select or contentEditable element,
// and ignore when modifier keys (Ctrl/Alt/Meta) are pressed to avoid conflicts.
document.addEventListener('keydown', (ev) => {
    try {
        const active = document.activeElement;
        const tag = active && active.tagName ? active.tagName.toUpperCase() : null;
        const isEditing = active && (
            active.isContentEditable ||
            tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        );

        if (isEditing) return; // don't intercept typing
        if (ev.ctrlKey || ev.altKey || ev.metaKey) return; // allow browser shortcuts

        if (ev.key === 'ArrowRight') {
            ev.preventDefault();
            goNext();
        } else if (ev.key === 'ArrowLeft') {
            ev.preventDefault();
            goPrev();
        }
    } catch (e) {
        // defensive: do not break app on unexpected errors
        console.warn('keyboard nav handler error', e);
    }
});

// Fin de script

// Fin de script

// Inicial: no mostrar texto hasta que el usuario active el toggle, pero podemos poner un versículo aleatorio si quiere
// (dejamos el estado inicial como estaba: primer libro, primer capítulo, verset 1)

// -------------------------
// Ajuste dinámico de font-size para el texto del versículo (mejorado)
// - Calcula la altura disponible restando la altura de otros elementos dentro del contenedor
// - Usa búsqueda binaria para encontrar el mayor font-size (px) que haga que el contenido quepa
// - Si no cabe con el mínimo, deja el tamaño mínimo y permite el scrollbar
// -------------------------
function fitVerseFontSize(options = {}) {
    const textEl = document.getElementById('verse-text-reading') || document.querySelector('.verse-text-reading');
    if (!textEl) return;

    const container = textEl.closest('.verse-text-container-reading') || document.getElementById('reading-sheet') || textEl.parentElement;
    if (!container) return;

    const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const maxRem = (options.maxRem != null) ? options.maxRem : 5; // default 5rem
    const minPx = (options.minPx != null) ? options.minPx : Math.max(14, 0.875 * rootFont);
    const maxPx = maxRem * rootFont;

    // calcular ancho/alto disponibles dentro del contenedor (restando padding y siblings normales)
    const containerStyle = getComputedStyle(container);
    const padTop = parseFloat(containerStyle.paddingTop) || 0;
    const padBottom = parseFloat(containerStyle.paddingBottom) || 0;
    const padLeft = parseFloat(containerStyle.paddingLeft) || 0;
    const padRight = parseFloat(containerStyle.paddingRight) || 0;

    let availableHeight = container.clientHeight - padTop - padBottom;
    let availableWidth = container.clientWidth - padLeft - padRight;

    Array.from(container.children).forEach((ch) => {
        if (ch === textEl) return;
        const style = getComputedStyle(ch);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        if (style.position === 'absolute' || style.position === 'fixed') return; // ignore overlays
        availableHeight -= ch.offsetHeight;
    });

    if (availableHeight <= 24) availableHeight = Math.max(48, container.clientHeight * 0.5);
    if (availableWidth <= 40) availableWidth = Math.max(100, container.clientWidth - 32);

    // asegurar box-sizing y ancho fijo para mediciones
    textEl.style.boxSizing = 'border-box';
    const measuredWidth = Math.max(20, Math.floor(availableWidth));
    textEl.style.width = measuredWidth + 'px';

    // Binary search entre minPx y maxPx para el mayor tamaño que quepa (considerando ancho y alto)
    let low = Math.round(minPx);
    let high = Math.round(maxPx);
    let best = low;

    // Si con el tamaño máximo ya cabe, usamos maxPx
    textEl.style.fontSize = high + 'px';
    // forzar reflow
    // eslint-disable-next-line no-unused-expressions
    textEl.offsetHeight;
    if (textEl.scrollHeight <= availableHeight && textEl.scrollWidth <= measuredWidth + 1) {
        textEl.style.fontSize = high + 'px';
        textEl.style.width = '';
        return;
    }

    // búsqueda binaria con límite de iteraciones
    for (let i = 0; i < 12 && low <= high; i += 1) {
        const mid = Math.floor((low + high) / 2);
        textEl.style.fontSize = mid + 'px';
        // forzar reflow
        // eslint-disable-next-line no-unused-expressions
        textEl.offsetHeight;

        const fitsVert = textEl.scrollHeight <= availableHeight;
        const fitsHorz = textEl.scrollWidth <= measuredWidth + 1;

        if (fitsVert && fitsHorz) {
            best = mid;
            low = mid + 1; // intentar mayor
        } else {
            high = mid - 1; // reducir
        }
    }

    // aplicar el mejor encontrado (o el mínimo)
    const finalSize = Math.max(minPx, best);
    // aplicar tamaño final y asegurar que el ancho sea 100% del contenedor
    textEl.style.fontSize = finalSize + 'px';
    textEl.style.width = '';
}

// debounce simple para resize
let _fitVerseTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(_fitVerseTimeout);
    _fitVerseTimeout = setTimeout(() => {
        try { fitVerseFontSize(); } catch (e) { console.warn(e); }
    }, 140);
});

/* ----------------------
   Custom dropdown loader + helpers
   - Loads components/dropdown.html template and exposes two helpers:
       loadCustomDropdownTemplate() -> Promise<void>
       createCustomDropdown(containerElement, itemsArray, options) -> { destroy() }
   - The created dropdown will auto-open upward or downward depending on available space.
   Notes: non-invasive: doesn't replace existing .dropdown-content behaviour unless you instantiate it.
   ---------------------- */

let _customDropdownTemplate = null;

async function loadCustomDropdownTemplate() {
    if (_customDropdownTemplate) return;
    try {
        const resp = await fetch('components/dropdown.html');
        if (!resp.ok) throw new Error('Cannot load component template');
        const text = await resp.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = text;
        _customDropdownTemplate = wrapper.querySelector('#custom-dropdown-template');
        if (!_customDropdownTemplate) {
            console.warn('custom dropdown template not found in components/dropdown.html');
            _customDropdownTemplate = null;
        }
    } catch (e) {
        console.warn('Failed to load custom dropdown template:', e);
        _customDropdownTemplate = null;
    }
}

function createCustomDropdown(containerElement, items = [], options = {}) {
    // containerElement: element inside which to create the dropdown (e.g. a .selector-wrapper)
    // items: array of { value: string|number, label: string }
    // options: { labelText, onSelect(item) }
    if (!_customDropdownTemplate) {
        console.warn('Custom dropdown template not loaded. Call loadCustomDropdownTemplate() first.');
        return null;
    }

    const tpl = _customDropdownTemplate.content.cloneNode(true);
    const root = tpl.querySelector('.custom-dropdown');
    const trigger = root.querySelector('.cd-trigger');
    const labelEl = root.querySelector('.cd-label');
    const contentEl = root.querySelector('.cd-content');

    labelEl.textContent = options.labelText || labelEl.textContent || 'Selecciona';

    const buildList = (list) => {
        contentEl.innerHTML = '';
        if (!list || list.length === 0) {
            const p = document.createElement('div');
            p.className = 'cd-empty';
            p.textContent = options.emptyText || 'Nu există elemente';
            contentEl.appendChild(p);
            return;
        }
        list.forEach(it => {
            const p = document.createElement('p');
            const val = (typeof it === 'object') ? it.value : it;
            const lab = (typeof it === 'object') ? it.label : String(it);
            p.setAttribute('data-value', String(val));
            p.textContent = lab;
            contentEl.appendChild(p);
        });
    };

    buildList(items);

    // Insert before the end of containerElement
    containerElement.appendChild(root);

    let open = false;

    const decideOpenDirection = () => {
        // Force dropdown to always open downwards (user requested consistent down behavior).
        return 'down';
    };

    const openDropdown = () => {
        const dir = decideOpenDirection();
        contentEl.classList.remove('open-down', 'open-up');
        if (dir === 'down') contentEl.classList.add('open-down'); else contentEl.classList.add('open-up');
        contentEl.setAttribute('aria-hidden', 'false');
        open = true;
    };

    const closeDropdown = () => {
        contentEl.classList.remove('open-down', 'open-up');
        contentEl.setAttribute('aria-hidden', 'true');
        open = false;
    };

    const onTrigger = (ev) => {
        ev.stopPropagation();
        if (open) closeDropdown(); else openDropdown();
    };

    trigger.addEventListener('click', onTrigger);

    const onDocClick = () => { if (open) closeDropdown(); };
    document.addEventListener('click', onDocClick);

    // click on items
    contentEl.addEventListener('click', (ev) => {
        const p = ev.target.closest('p');
        if (!p) return;
        const value = p.getAttribute('data-value');
        const label = p.textContent;
        closeDropdown();
        if (typeof options.onSelect === 'function') options.onSelect({ value, label });
    });

    // expose API to update items or destroy
    return {
        destroy() {
            trigger.removeEventListener('click', onTrigger);
            document.removeEventListener('click', onDocClick);
            if (root && root.parentNode) root.parentNode.removeChild(root);
        },
        update(list) { buildList(list); }
    };
}

// Expose globally for ease of use in the app
window.loadCustomDropdownTemplate = loadCustomDropdownTemplate;
window.createCustomDropdown = createCustomDropdown;

// ----------------------
// Screen component loader
// ----------------------
let _screenTemplates = {};

async function loadScreenTemplates() {
    try {
        const base = 'components';
        const names = [
            'screen-selection.html', 'screen-reading.html', 'screen-voice.html',
            'selection-left.html', 'selection-nav.html',
            'reading-left.html', 'reading-sheet.html', 'reading-nav.html',
            'mic-button.html'
        ];

        await Promise.all(names.map(async (f) => {
            const resp = await fetch(`${base}/${f}`);
            if (!resp.ok) throw new Error(`Failed to load ${f}`);
            const text = await resp.text();
            const wrapper = document.createElement('div');
            wrapper.innerHTML = text;
            // expect a <template> inside
            const tpl = wrapper.querySelector('template');
            if (tpl && tpl.id) {
                _screenTemplates[tpl.id] = tpl;
            }
        }));
    } catch (e) {
        console.warn('Error loading screen templates:', e);
    }
}

function applyScreenTemplates() {
    try {
        const selTpl = _screenTemplates['screen-selection-template'];
        const readTpl = _screenTemplates['screen-reading-template'];

        // Replace the placeholder elements with the template root nodes
        if (selTpl) {
            const container = document.getElementById('screen-selection');
            if (container && container.parentNode) {
                // the template is expected to have a single top-level element (the screen div)
                const clone = selTpl.content.cloneNode(true);
                const newNode = clone.firstElementChild || clone.firstChild;
                if (newNode) {
                    container.parentNode.replaceChild(newNode, container);
                } else {
                    // fallback to injecting inside if template structure is different
                    container.innerHTML = '';
                    container.appendChild(clone);
                }
            }
        }

        if (readTpl) {
            const container = document.getElementById('screen-reading');
            if (container && container.parentNode) {
                const clone = readTpl.content.cloneNode(true);
                const newNode = clone.firstElementChild || clone.firstChild;
                if (newNode) {
                    container.parentNode.replaceChild(newNode, container);
                } else {
                    container.innerHTML = '';
                    container.appendChild(clone);
                }
            }
        }

        const voiceTpl = _screenTemplates['screen-voice-template'];
        if (voiceTpl) {
            const container = document.getElementById('screen-voice');
            if (container && container.parentNode) {
                const clone = voiceTpl.content.cloneNode(true);
                const newNode = clone.firstElementChild || clone.firstChild;
                if (newNode) {
                    container.parentNode.replaceChild(newNode, container);
                } else {
                    container.innerHTML = '';
                    container.appendChild(clone);
                }
            }
        }

        // After top-level screens are replaced, inject subcomponents into their slots
        const injectSlot = (slotId, tplId) => {
            try {
                const tpl = _screenTemplates[tplId];
                const slot = document.getElementById(slotId);
                if (tpl && slot && slot.parentNode) {
                    const clone = tpl.content.cloneNode(true);
                    const newNode = clone.firstElementChild || clone.firstChild;
                    if (newNode) slot.parentNode.replaceChild(newNode, slot);
                    else slot.parentNode.replaceChild(clone, slot);
                }
            } catch (e) {
                console.warn('Failed injecting slot', slotId, tplId, e);
            }
        };

    // Selection subcomponents
    injectSlot('selection-left-slot', 'selection-left-template');
    injectSlot('selection-nav-slot', 'selection-nav-template');

        // Reading subcomponents
    injectSlot('reading-left-slot', 'reading-left-template');
    injectSlot('reading-main-slot', 'reading-sheet-template');
    injectSlot('mic-button-slot', 'mic-button-template');

        // reading navigation UI intentionally not injected: we show only the verse text
        // and the selected reference. Navigation remains available via keyboard (arrow keys).

        // Notify listeners (screen scripts) that templates were injected so they can initialize.
        try {
            document.dispatchEvent(new CustomEvent('screens-injected'));
        } catch (e) {
            // ignore
        }

    } catch (e) {
        console.warn('Error applying screen templates:', e);
    }
}

// Load and apply at runtime (non-blocking)
loadScreenTemplates().then(() => applyScreenTemplates());

