// ===== VOICE RECOGNITION SYSTEM =====
// Sistema de reconocimiento continuo de referencias bíblicas en rumano
// Versión integrada: no usa pantalla separada, navega directamente a los versículos

// Estado global del sistema de voz
const voiceState = {
    recognition: null,
    isListening: false,
    processingQueue: [],
    recentReferences: new Map(), // cache para deduplicación
    history: [], // historial de referencias detectadas
    lastTranscript: '',
    maxConcurrentRequests: 3,
    activeRequests: 0,
    // Contexto actual para detección secuencial
    currentContext: {
        book: null,
        chapter: null,
        verse: null,
        timestamp: null
    },
    // Cache de versículos del capítulo actual
    chapterVerses: {},
    chapterCacheKey: null,
    // Cache completa de la Biblia
    bibleCacheComplete: false,
    bibleVerses: [], // Array de {book, chapter, verse, text, normalizedText, significantWords, ngrams}
    ngramIndex: new Map(), // n-grama -> [referencias] para búsqueda rápida
    lastIncrementalSearch: null, // timestamp de última búsqueda incremental
    incrementalMatchCache: null, // cache de último match incremental
    // Modo Autocitire (seguimiento secuencial)
    autocitireMode: false, // true cuando está en modo Autocitire
    autocitireCurrentVerse: null, // {book, chapter, verse} actual en seguimiento
    autocitireLastWords: [], // últimas palabras del versículo actual para detectar fin
    // Modo IA
    aiMode: false, // true cuando está en modo Autorecunoaște cu IA
    aiTranscriptBuffer: '', // acumula transcript para análisis con IA
    aiLastAnalysis: null, // timestamp de último análisis con IA
    aiAnalysisInterval: 5000 // analizar cada 5 segundos
};

// Nombres de libros de la Biblia en rumano (del bibleStructure)
const bookNames = Object.keys(bibleStructure);

// ===== VARIACIONES DE NOMBRES DE LIBROS =====
// Mapeo de variaciones comunes (singular/plural, abreviaciones) a nombres oficiales
const bookNameVariations = {
    // Salmos
    'psalmul': 'Psalmii',
    'psalm': 'Psalmii',
    'psalmi': 'Psalmii',
    'psalmii': 'Psalmii',
    'ps': 'Psalmii',
    
    // Génesis
    'geneza': 'Geneza',
    'gen': 'Geneza',
    
    // Éxodo
    'exod': 'Exodul',
    'exodul': 'Exodul',
    'ex': 'Exodul',
    
    // Juan
    'ioan': 'Ioan',
    'in': 'Ioan',
    'ioa': 'Ioan',
    
    // Mateo
    'matei': 'Matei',
    'mat': 'Matei',
    'mt': 'Matei',
    
    // Romanos
    'romani': 'Romani',
    'rom': 'Romani',
    
    // Corintios
    '1 corinteni': '1 Corinteni',
    '2 corinteni': '2 Corinteni',
    '1 cor': '1 Corinteni',
    '2 cor': '2 Corinteni',
    
    // Samuel
    '1 samuel': '1 Samuel',
    '2 samuel': '2 Samuel',
    '1 sam': '1 Samuel',
    '2 sam': '2 Samuel',
    
    // Reyes (Împărați)
    '1 imparati': '1 Împărați',
    '2 imparati': '2 Împărați',
    '1 imp': '1 Împărați',
    '2 imp': '2 Împărați',
    
    // Proverbios
    'proverbe': 'Proverbele',
    'proverbele': 'Proverbele',
    'prov': 'Proverbele',
    
    // Apocalipsis
    'apocalipsa': 'Apocalipsa',
    'apoc': 'Apocalipsa',
    'ap': 'Apocalipsa'
};

// Función para normalizar nombre de libro
function normalizeBookName(bookName) {
    if (!bookName) {
        console.log('⚠️ normalizeBookName: bookName is null/undefined');
        return null;
    }
    
    const normalized = bookName.toLowerCase().trim();
    console.log(`🔄 Normalizing book name: "${bookName}" → "${normalized}"`);
    
    // Primero intentar con variaciones
    if (bookNameVariations[normalized]) {
        console.log(`  ✓ Found in variations: ${bookNameVariations[normalized]}`);
        return bookNameVariations[normalized];
    }
    
    // Buscar coincidencia exacta (case-insensitive)
    const exactMatch = bookNames.find(b => b.toLowerCase() === normalized);
    if (exactMatch) {
        console.log(`  ✓ Exact match found: ${exactMatch}`);
        return exactMatch;
    }
    
    // Buscar coincidencia parcial
    const partialMatch = bookNames.find(b => 
        b.toLowerCase().includes(normalized) || normalized.includes(b.toLowerCase())
    );
    if (partialMatch) {
        console.log(`  ✓ Partial match found: ${partialMatch}`);
        return partialMatch;
    }
    
    console.log(`  ✗ No match found for: "${bookName}"`);
    return null;
}

// ===== PATRONES REGEX PARA DETECCIÓN RÁPIDA =====
const romanianBiblePatterns = [
    // Patrón 1: "Geneza 1:1" o "Ioan 3:16"
    {
        regex: new RegExp(`\\b(${bookNames.join('|')})\\s+(\\d+):(\\d+)\\b`, 'i'),
        extract: (match) => ({
            book: match[1],
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
        })
    },
    // Patrón 2: "Geneza 2 cu 5" (formato rumano con "cu" = con)
    {
        regex: new RegExp(`\\b(${bookNames.join('|')})\\s+(\\d+)\\s+cu\\s+(\\d+)\\b`, 'i'),
        extract: (match) => ({
            book: match[1],
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
        })
    },
    // Patrón 3: "Geneza capitolul 1 versetul 1"
    {
        regex: new RegExp(`\\b(${bookNames.join('|')})\\s+(?:capitolul|cap\\.?)\\s+(\\d+)\\s+(?:versetul|vers\\.?|v\\.)\\s+(\\d+)\\b`, 'i'),
        extract: (match) => ({
            book: match[1],
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
        })
    },
    // Patrón 4: "capitolul 3 din Ioan"
    {
        regex: new RegExp(`\\b(?:capitolul|cap\\.?)\\s+(\\d+)\\s+din\\s+(${bookNames.join('|')})\\b`, 'i'),
        extract: (match) => ({
            book: match[2],
            chapter: parseInt(match[1]),
            verse: 1 // default al primer versículo
        })
    },
    // Patrón 5: "versetul 5" o "versul 5" (en contexto)
    {
        regex: /\b(?:versetul|versul|vers\.?)\s+(\d+)\b/i,
        extract: (match, context) => {
            if (!context.book || !context.chapter) return null;
            return {
                book: context.book,
                chapter: context.chapter,
                verse: parseInt(match[1])
            };
        },
        needsContext: true
    },
    // Patrón 6: Solo números (ej: "5", "6", "7") cuando hay contexto reciente
    {
        regex: /\b(\d{1,3})\b/,
        extract: (match, context) => {
            if (!context.book || !context.chapter) return null;
            const num = parseInt(match[1]);
            // Solo aceptar números que parezcan versículos (1-200)
            if (num < 1 || num > 200) return null;
            // Verificar que el contexto sea reciente (últimos 10 segundos)
            if (Date.now() - context.timestamp > 10000) return null;
            return {
                book: context.book,
                chapter: context.chapter,
                verse: num
            };
        },
        needsContext: true,
        lowPriority: true // Solo usar si otros patrones fallan
    }
];

// ===== INICIALIZACIÓN =====
function initVoiceRecognition() {
    console.log('🎤 Initializing voice recognition...');
    
    // Verificar soporte de Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Browser does not support speech recognition');
        return false;
    }

    // Configurar Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceState.recognition = new SpeechRecognition();
    
    voiceState.recognition.lang = 'ro-RO'; // Rumano
    voiceState.recognition.continuous = true; // Escucha continua
    voiceState.recognition.interimResults = true; // Resultados parciales
    voiceState.recognition.maxAlternatives = 1;

    // Event listeners
    voiceState.recognition.onresult = handleSpeechResult;
    voiceState.recognition.onerror = handleSpeechError;
    voiceState.recognition.onend = handleSpeechEnd;

    // Botón unificado de voz
    const unifiedBtn = document.getElementById('voice-unified-btn');
    if (unifiedBtn) {
        unifiedBtn.addEventListener('click', toggleUnifiedVoice);
    }

    // Listener para cambio de modo
    const modeRadios = document.querySelectorAll('input[name="voice-mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', handleModeChange);
    });
    
    // Actualizar etiqueta inicial
    updateModeLabel();

    // Botones de historial (opcional - solo si existen en el HTML)
    const historyToggle = document.getElementById('history-toggle-btn');
    if (historyToggle) {
        historyToggle.addEventListener('click', () => {
            console.log('History toggle clicked');
            // Funcionalidad de historial - implementar si es necesario
        });
    }

    const historyClose = document.getElementById('history-close-btn');
    if (historyClose) {
        historyClose.addEventListener('click', () => {
            console.log('History close clicked');
        });
    }

    const historyClear = document.getElementById('history-clear-btn');
    if (historyClear) {
        historyClear.addEventListener('click', () => {
            console.log('History clear clicked');
            voiceState.history = [];
        });
    }

    console.log('✅ Voice recognition initialized');
    
    // Cargar toda la Biblia desde XML local en segundo plano
    loadBibleFromXML();
    
    // Prueba de normalización de caracteres rumanos
    console.log('🧪 Testing Romanian character normalization:');
    console.log('  "Fiindcă atât" → "' + normalizeText('Fiindcă atât') + '"');
    console.log('  "Împărăția" → "' + normalizeText('Împărăția') + '"');
    console.log('  "înțelepciunea" → "' + normalizeText('înțelepciunea') + '"');
    console.log('  Expected: all special chars (ă,â,î,ș,ț) converted to (a,a,i,s,t)');
    
    return true;
}

// ===== ACTUALIZAR ETIQUETA DE MODO =====
function updateModeLabel() {
    const selectedMode = document.querySelector('input[name="voice-mode"]:checked');
    const modeLabelText = document.getElementById('mode-label-text');
    
    if (selectedMode && modeLabelText) {
        const labelText = selectedMode.nextElementSibling.textContent;
        modeLabelText.textContent = labelText;
    }
}

// ===== CONTROL DE ESCUCHA =====
function toggleUnifiedVoice() {
    // Verificar qué modo está seleccionado
    const selectedMode = document.querySelector('input[name="voice-mode"]:checked')?.value;
    
    if (voiceState.isListening) {
        // Detener cualquier modo activo
        if (voiceState.autocitireMode) {
            stopAutocitire();
        } else if (voiceState.aiMode) {
            stopAIRecognition();
        } else {
            stopVoiceRecognition();
        }
    } else {
        // Iniciar según el modo seleccionado
        if (selectedMode === 'autocitire') {
            startAutocitire();
        } else if (selectedMode === 'recognize-ai') {
            startAIRecognition();
        } else {
            startVoiceRecognition();
        }
    }
}

function handleModeChange() {
    // Actualizar etiqueta del modo
    updateModeLabel();
    
    // Si está escuchando, detener y reiniciar con el nuevo modo
    if (voiceState.isListening) {
        const wasListening = true;
        
        if (voiceState.autocitireMode) {
            stopAutocitire();
        } else if (voiceState.aiMode) {
            stopAIRecognition();
        } else {
            stopVoiceRecognition();
        }
        
        // Reiniciar con el nuevo modo después de un breve delay
        if (wasListening) {
            setTimeout(() => {
                toggleUnifiedVoice();
            }, 100);
        }
    }
}

function toggleVoiceRecognition() {
    if (voiceState.isListening && !voiceState.autocitireMode) {
        stopVoiceRecognition();
    } else if (voiceState.isListening && voiceState.autocitireMode) {
        // Si está en Autocitire, detener Autocitire primero
        stopAutocitire();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if (!voiceState.recognition) {
        const success = initVoiceRecognition();
        if (!success) {
            alert('Browserul tău nu suportă recunoașterea vocală. Încearcă Chrome sau Edge.');
            return;
        }
    }

    // Asegurarse de que no está en modo Autocitire
    voiceState.autocitireMode = false;

    try {
        voiceState.recognition.start();
        voiceState.isListening = true;
        updateButtonState(true);
        console.log('🎤 Started voice recognition...');
    } catch (error) {
        console.error('Error starting recognition:', error);
        alert('Eroare la pornirea microfonului: ' + error.message);
    }
}

function stopVoiceRecognition() {
    if (voiceState.recognition) {
        voiceState.recognition.stop();
    }
    voiceState.isListening = false;
    updateButtonState(false);
    
    // Ocultar transcripción en vivo
    const liveTranscriptDiv = document.getElementById('voice-live-transcript');
    if (liveTranscriptDiv) {
        liveTranscriptDiv.style.display = 'none';
    }
    
    console.log('🛑 Stopped voice recognition');
}

function updateButtonState(listening) {
    const btn = document.getElementById('voice-unified-btn');
    if (!btn) return;

    if (listening) {
        btn.classList.add('listening');
    } else {
        btn.classList.remove('listening');
    }
}

function handleSpeechEnd() {
    console.log('Speech ended');
    // Auto-reiniciar si aún está en modo listening
    if (voiceState.isListening) {
        setTimeout(() => {
            try {
                voiceState.recognition.start();
            } catch (error) {
                console.error('Error restarting:', error);
            }
        }, 100);
    }
}

function handleSpeechError(event) {
    // No mostrar errores esperados/normales
    if (event.error === 'no-speech') {
        // Silencio normal, no es error
        return;
    }
    
    if (event.error === 'aborted') {
        // El reconocimiento fue detenido intencionalmente (cambio de modo, reinicio, etc.)
        console.log('🔄 Speech recognition aborted (intentional stop)');
        return;
    }
    
    // Mostrar otros errores
    console.error('Speech error:', event.error);
    
    // Si es error de permisos, mostrar mensaje específico
    if (event.error === 'not-allowed') {
        alert('Permite accesul la microfon pentru a folosi această funcție.');
        stopVoiceRecognition();
    }
}

// ===== MODO AUTOCITIRE (SEGUIMIENTO SECUENCIAL) =====
function toggleAutocitire() {
    if (voiceState.isListening && voiceState.autocitireMode) {
        stopAutocitire();
    } else {
        startAutocitire();
    }
}

function startAutocitire() {
    // Primero verificar que tenemos una referencia actual
    if (!_currentReference || !_currentReference.book) {
        alert('Te rog să selectezi mai întâi un verset din care să începi citirea.');
        return;
    }

    console.log('📖 Starting Autocitire mode from:', _currentReference);
    
    voiceState.autocitireMode = true;
    voiceState.autocitireCurrentVerse = { ..._currentReference };
    
    // Cargar el texto del versículo actual para detectar su fin
    loadCurrentVerseForAutocitire(voiceState.autocitireCurrentVerse);
    
    // Iniciar reconocimiento de voz
    if (!voiceState.recognition) {
        const success = initVoiceRecognition();
        if (!success) {
            alert('Browserul tău nu suportă recunoașterea vocală.');
            voiceState.autocitireMode = false;
            return;
        }
    }

    try {
        voiceState.recognition.start();
        voiceState.isListening = true;
        updateAutocitireButtonState(true);
        console.log('🎤 Autocitire started...');
    } catch (error) {
        console.error('Error starting Autocitire:', error);
        alert('Eroare la pornirea microfonului: ' + error.message);
        voiceState.autocitireMode = false;
    }
}

function stopAutocitire() {
    console.log('🛑 Stopping Autocitire mode');
    voiceState.autocitireMode = false;
    voiceState.autocitireCurrentVerse = null;
    voiceState.autocitireLastWords = [];
    
    if (voiceState.recognition) {
        voiceState.recognition.stop();
    }
    voiceState.isListening = false;
    updateAutocitireButtonState(false);
}

// ===== MODO IA (AUTORECUNOAȘTE CU IA) =====
function startAIRecognition() {
    if (!voiceState.recognition) {
        const success = initVoiceRecognition();
        if (!success) {
            alert('Browserul tău nu suportă recunoașterea vocală. Încearcă Chrome sau Edge.');
            return;
        }
    }

    console.log('🤖 Starting AI Recognition mode...');
    
    // Activar modo IA
    voiceState.aiMode = true;
    voiceState.autocitireMode = false;
    voiceState.aiTranscriptBuffer = '';
    voiceState.aiLastAnalysis = Date.now();

    try {
        voiceState.recognition.start();
        voiceState.isListening = true;
        updateButtonState(true);
        console.log('🎤 AI Recognition started...');
        
        // Iniciar análisis periódico
        startAIAnalysisInterval();
    } catch (error) {
        console.error('Error starting AI Recognition:', error);
        alert('Eroare la pornirea microfonului: ' + error.message);
        voiceState.aiMode = false;
    }
}

function stopAIRecognition() {
    console.log('🛑 Stopping AI Recognition mode');
    voiceState.aiMode = false;
    voiceState.aiTranscriptBuffer = '';
    
    if (voiceState.recognition) {
        voiceState.recognition.stop();
    }
    voiceState.isListening = false;
    updateButtonState(false);
}

function startAIAnalysisInterval() {
    // Verificar periódicamente si hay suficiente texto para analizar
    const checkInterval = setInterval(() => {
        if (!voiceState.aiMode || !voiceState.isListening) {
            clearInterval(checkInterval);
            return;
        }

        const now = Date.now();
        const timeSinceLastAnalysis = now - (voiceState.aiLastAnalysis || 0);
        
        // Analizar cada 5 segundos si hay suficiente texto
        if (timeSinceLastAnalysis >= voiceState.aiAnalysisInterval && 
            voiceState.aiTranscriptBuffer.trim().length > 50) {
            
            console.log('🤖 Analyzing transcript with AI...');
            analyzeTranscriptWithAI(voiceState.aiTranscriptBuffer);
            voiceState.aiLastAnalysis = now;
            
            // Mantener solo las últimas palabras para contexto
            const words = voiceState.aiTranscriptBuffer.split(' ');
            if (words.length > 100) {
                voiceState.aiTranscriptBuffer = words.slice(-50).join(' ');
            }
        }
    }, 1000); // Verificar cada segundo
}

async function analyzeTranscriptWithAI(transcript) {
    try {
        console.log('📤 Sending to AI:', transcript.substring(0, 100) + '...');
        
        const response = await fetch(`${API_CONFIG.baseURL}/api/analyze-verse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                transcript: transcript,
                language: 'ro'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🤖 AI Full Response:', data);
        
        if (data.success && data.reference) {
            console.log('🤖 AI detected verse:', data.reference);
            handleDetectedReference(data.reference, 'ai', transcript);
            
            // ✅ REINICIAR el buffer después de detectar un versículo
            voiceState.aiTranscriptBuffer = '';
            console.log('🔄 Buffer reiniciado después de detectar versículo');
        } else if (data.error) {
            console.log('🤖 AI Error:', data.error);
        } else {
            console.log('🤖 AI: No verse detected in this segment');
        }
    } catch (error) {
        console.error('❌ Error calling AI:', error);
    }
}

function updateAutocitireButtonState(active) {
    const btn = document.getElementById('voice-unified-btn');
    if (!btn) return;

    if (active) {
        btn.classList.add('listening');
    } else {
        btn.classList.remove('listening');
    }
}

function loadCurrentVerseForAutocitire(ref) {
    if (!voiceState.bibleCacheComplete || !voiceState.bibleVerses) {
        console.warn('Bible not loaded yet for Autocitire');
        return;
    }

    // Buscar el versículo actual y el siguiente
    const currentVerse = voiceState.bibleVerses.find(v => 
        v.book === ref.book && v.chapter === ref.chapter && v.verse === ref.verse
    );
    
    if (currentVerse) {
        // Extraer últimas 5-10 palabras significativas del versículo actual
        const words = currentVerse.significantWords || [];
        voiceState.autocitireLastWords = words.slice(-10); // últimas 10 palabras
        console.log('📝 Loaded current verse last words:', voiceState.autocitireLastWords);
    }
}

// Procesar transcripción en modo Autocitire
function processAutocitireTranscript(transcript) {
    if (!voiceState.autocitireMode || !voiceState.autocitireCurrentVerse) return;

    const normalizedTranscript = normalizeText(transcript);
    const spokenWords = getSignificantWords(normalizedTranscript);
    
    console.log('🔍 Autocitire checking:', spokenWords.slice(-15)); // últimas 15 palabras habladas

    // Buscar el siguiente versículo en la Biblia
    const currentRef = voiceState.autocitireCurrentVerse;
    const nextVerseRef = {
        book: currentRef.book,
        chapter: currentRef.chapter,
        verse: currentRef.verse + 1
    };

    const nextVerse = voiceState.bibleVerses.find(v => 
        v.book === nextVerseRef.book && 
        v.chapter === nextVerseRef.chapter && 
        v.verse === nextVerseRef.verse
    );

    if (!nextVerse) {
        console.log('⚠️ No next verse found, trying next chapter');
        // Intentar siguiente capítulo
        nextVerseRef.chapter++;
        nextVerseRef.verse = 1;
        const nextChapterVerse = voiceState.bibleVerses.find(v => 
            v.book === nextVerseRef.book && 
            v.chapter === nextVerseRef.chapter && 
            v.verse === nextVerseRef.verse
        );
        if (nextChapterVerse) {
            checkVerseTransition(spokenWords, nextChapterVerse, nextVerseRef);
        }
        return;
    }

    checkVerseTransition(spokenWords, nextVerse, nextVerseRef);
}

function checkVerseTransition(spokenWords, nextVerse, nextVerseRef) {
    // Estrategia 1: Detectar últimas palabras del versículo actual
    if (voiceState.autocitireLastWords && voiceState.autocitireLastWords.length > 0) {
        const lastWords = voiceState.autocitireLastWords;
        const recentSpoken = spokenWords.slice(-20); // últimas 20 palabras habladas
        
        // Buscar coincidencia de las últimas 3-5 palabras del versículo actual
        for (let i = Math.min(5, lastWords.length); i >= 3; i--) {
            const targetSequence = lastWords.slice(-i);
            
            // Buscar esta secuencia en las palabras habladas con similitud parcial
            for (let j = 0; j <= recentSpoken.length - i; j++) {
                const spokenSequence = recentSpoken.slice(j, j + i);
                
                const similarity = calculateSequenceSimilarity(targetSequence, spokenSequence);
                // Permitir 60% de similitud (al menos 2 de cada 3 palabras o 3 de cada 5)
                if (similarity >= 0.6) {
                    console.log(`✅ End of verse detected! Sequence match (${Math.round(similarity*100)}%):`, targetSequence, '≈', spokenSequence);
                    advanceToNextVerse(nextVerseRef);
                    return;
                }
            }
        }
    }

    // Estrategia 2: Detectar primeras palabras del siguiente versículo
    if (nextVerse.significantWords && nextVerse.significantWords.length >= 3) {
        const firstWords = nextVerse.significantWords.slice(0, 5); // primeras 5 palabras
        const recentSpoken = spokenWords.slice(-15); // últimas 15 palabras habladas
        
        // Buscar coincidencia de las primeras 3-5 palabras del siguiente versículo
        for (let i = 3; i <= Math.min(5, firstWords.length); i++) {
            const targetSequence = firstWords.slice(0, i);
            
            for (let j = 0; j <= recentSpoken.length - i; j++) {
                const spokenSequence = recentSpoken.slice(j, j + i);
                
                const similarity = calculateSequenceSimilarity(targetSequence, spokenSequence);
                // Permitir 60% de similitud
                if (similarity >= 0.6) {
                    console.log(`✅ Start of next verse detected! Sequence match (${Math.round(similarity*100)}%):`, targetSequence, '≈', spokenSequence);
                    advanceToNextVerse(nextVerseRef);
                    return;
                }
            }
        }
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

// Calcular similitud entre dos secuencias de palabras (permite palabras faltantes)
function calculateSequenceSimilarity(target, spoken) {
    if (target.length !== spoken.length) return 0;
    if (target.length === 0) return 0;
    
    let matches = 0;
    for (let i = 0; i < target.length; i++) {
        // Considerar coincidencia exacta o palabras muy similares
        if (target[i] === spoken[i]) {
            matches++;
        } else if (wordsAreSimilar(target[i], spoken[i])) {
            matches += 0.7; // Coincidencia parcial por palabras similares
        }
    }
    
    return matches / target.length;
}

// Verificar si dos palabras son similares (maneja errores de reconocimiento)
function wordsAreSimilar(word1, word2) {
    // Si una palabra contiene la otra (ej: "dumnezeu" vs "dumneze")
    if (word1.includes(word2) || word2.includes(word1)) {
        return true;
    }
    
    // Distancia de Levenshtein simple (máximo 2 caracteres de diferencia)
    if (Math.abs(word1.length - word2.length) > 2) return false;
    
    let differences = 0;
    const maxLen = Math.max(word1.length, word2.length);
    
    for (let i = 0; i < maxLen; i++) {
        if (word1[i] !== word2[i]) {
            differences++;
            if (differences > 2) return false;
        }
    }
    
    return differences <= 2;
}

function advanceToNextVerse(nextVerseRef) {
    console.log('➡️ Advancing to next verse:', nextVerseRef);
    
    // Actualizar el versículo actual
    voiceState.autocitireCurrentVerse = { ...nextVerseRef };
    
    // Cargar las últimas palabras del nuevo versículo actual
    loadCurrentVerseForAutocitire(nextVerseRef);
    
    // Mostrar el versículo
    console.log('📖 Displaying verse:', nextVerseRef);
    
    if (typeof setReference === 'function') {
        setReference(nextVerseRef.book, nextVerseRef.chapter, nextVerseRef.verse, true);
    }
    
    // IMPORTANTE: Limpiar el buffer de reconocimiento para evitar detecciones duplicadas
    // Reiniciar el reconocimiento momentáneamente para limpiar el buffer
    if (voiceState.recognition && voiceState.isListening) {
        console.log('🔄 Resetting speech recognition buffer...');
        const wasListening = voiceState.isListening;
        
        // Detener y reiniciar el reconocimiento
        voiceState.recognition.stop();
        
        // Esperar un momento antes de reiniciar
        setTimeout(() => {
            if (wasListening && voiceState.autocitireMode) {
                try {
                    voiceState.recognition.start();
                    console.log('✅ Speech recognition restarted');
                } catch (error) {
                    console.log('Speech recognition already started or error:', error.message);
                }
            }
        }, 300); // 300ms de pausa para limpiar el buffer
    }
}

// ===== PROCESAMIENTO DE SPEECH =====
function handleSpeechResult(event) {
    let transcript = '';
    let isFinal = false;

    // Obtener transcripción
    for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            isFinal = true;
        }
    }

    // Mostrar últimas 5 palabras en tiempo real (incluso resultados parciales)
    if (transcript.trim()) {
        updateLiveTranscript(transcript);
        
        // MODO IA: Acumular transcript para análisis
        if (voiceState.aiMode) {
            if (isFinal) {
                voiceState.aiTranscriptBuffer += ' ' + transcript;
                console.log('🤖 Buffer updated:', voiceState.aiTranscriptBuffer.length, 'chars');
            }
        }
        // Si estamos en modo Autocitire, procesar de forma diferente
        else if (voiceState.autocitireMode) {
            // En modo Autocitire: detectar transición al siguiente versículo
            const now = Date.now();
            if (!voiceState.lastIncrementalSearch || now - voiceState.lastIncrementalSearch > 500) {
                voiceState.lastIncrementalSearch = now;
                processAutocitireTranscript(transcript);
            }
        } else {
            // Modo normal (literal): detectar CUALQUIER versículo mencionado
            // Reducido a 3 palabras para detectar referencias cortas como "Psalmul 52 cu 4"
            if (transcript.trim().split(' ').length >= 3) {
                // Buscar cada 1 segundo para mayor capacidad de respuesta
                const now = Date.now();
                if (!voiceState.lastIncrementalSearch || now - voiceState.lastIncrementalSearch > 1000) {
                    voiceState.lastIncrementalSearch = now;
                    // Llamar a la detección incremental INMEDIATAMENTE
                    processTranscriptIncremental(transcript, isFinal);
                }
            }
        }
    }

    // También procesar resultados finales (por si acaso la incremental no detectó)
    if (isFinal && transcript.trim()) {
        voiceState.lastTranscript = transcript;
        // NO llamar a processTranscript si ya se detectó incrementalmente
        // (la deduplicación se encarga de evitar duplicados)
    }
}

function processTranscript(transcript) {
    console.log('📝 Processing transcript:', transcript);
    console.log('🔍 Normalized:', normalizeText(transcript));
    console.log('💡 Significant words:', getSignificantWords(transcript));

    // PASO 1: Detectar referencias explícitas (ej: "Psalmul 58 cu 12")
    const explicitRef = detectExplicitReference(transcript);
    if (explicitRef) {
        console.log('✅ Explicit reference detected:', explicitRef);
        handleDetectedReference(explicitRef, 'explicit', transcript);
        return;
    }

    // PASO 2: Intentar detección rápida con RegEx
    const regexMatch = detectReferenceWithRegex(transcript);
    
    if (regexMatch) {
        console.log('⚡ Fast detection (RegEx):', regexMatch);
        handleDetectedReference(regexMatch, 'regex', transcript);
        return;
    }

    // Segundo: verificar si el contenido coincide con algún versículo
    const contentMatch = detectVerseByContent(transcript);
    if (contentMatch) {
        console.log('📖 Content match detected:', contentMatch);
        handleDetectedReference(contentMatch, 'content', transcript);
        return;
    }

    // Tercero: si está cargada la Biblia completa, buscar en todos los versículos
    if (voiceState.bibleCacheComplete) {
        const globalMatch = searchInCompleteBible(transcript);
        if (globalMatch) {
            console.log('🌍 Global search match:', globalMatch);
            handleDetectedReference(globalMatch, 'search', transcript);
            return;
        }
    }
    
    console.log('❌ No match found in any method');
}

// Procesamiento incremental (mientras se habla)
function processTranscriptIncremental(transcript, isFinal) {
    console.log('🔄🔄🔄 processTranscriptIncremental CALLED with:', transcript);
    
    // Solo buscar si la Biblia está cargada
    if (!voiceState.bibleCacheComplete) {
        console.log('⚠️ Bible not loaded yet, skipping incremental search');
        return;
    }
    
    console.log('✓ Bible is loaded, proceeding with detection...');
    
    // PASO 1: Intentar detectar referencias explícitas primero (más rápido y preciso)
    const explicitRef = detectExplicitReference(transcript);
    if (explicitRef) {
        console.log('⚡⚡⚡ INCREMENTAL EXPLICIT REFERENCE DETECTED!');
        console.log('   While speaking:', transcript);
        console.log('   Detected:', explicitRef);
        console.log('   Calling handleDetectedReference NOW...');
        handleDetectedReference(explicitRef, 'explicit-incremental', transcript);
        console.log('   handleDetectedReference returned');
        return; // Ya encontramos la referencia, no necesitamos buscar por contenido
    }
    
    console.log('   No explicit reference found, trying content search...');
    
    // PASO 2: Buscar por contenido (más lento pero funciona con texto del versículo)
    const globalMatch = searchInCompleteBible(transcript);
    
    if (globalMatch) {
        // Modo Autorecunoaște: SIEMPRE mostrar el mejor match, sin importar el porcentaje
        if (!voiceState.autocitireMode) {
            console.log(`🔄 Incremental match (${Math.round(globalMatch.similarity * 100)}%):`, globalMatch);
            console.log('   Calling handleDetectedReference NOW...');
            handleDetectedReference(globalMatch, 'content-incremental', transcript);
            return;
        }
        
        // Modo Autocitire: solo mostrar si la similitud es alta (>70%)
        if (globalMatch.similarity > 0.7) {
            console.log('🔄 Incremental match (Autocitire):', globalMatch);
            console.log('   Calling handleDetectedReference NOW...');
            handleDetectedReference(globalMatch, 'content-incremental', transcript);
            return;
        } else if (globalMatch.similarity > 0.5) {
            // Similitud moderada (50-70%): solo guardar en cache pero no mostrar aún
            console.log('🔄 Incremental match (waiting for better similarity):', globalMatch);
            voiceState.incrementalMatchCache = globalMatch;
        }
    }
}

// ===== CARGAR BIBLIA DESDE XML =====
async function loadBibleFromXML() {
    console.log('📖 LOADING BIBLE FROM XML...');
    
    voiceState.isLoadingBible = true;
    updateBibleLoadingProgress(5, 'Descărcarea fişierului XML...');
    
    try {
        // Descargar el archivo XML
        const response = await fetch('./ron-rccv.usfx.xml');
        if (!response.ok) throw new Error('XML file not found');
        
        const xmlText = await response.text();
        updateBibleLoadingProgress(15, 'Parsarea XML-ului...');
        
        // Parsear XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        updateBibleLoadingProgress(25, 'Extracția versetelor...');
        
        let totalVerses = 0;
        voiceState.bibleVerses = [];
        voiceState.ngramIndex = new Map();
        
        const books = xmlDoc.querySelectorAll('book');
        const totalBooks = books.length;
        
        console.log(`📚 Total books found: ${totalBooks}`);
        
        books.forEach((bookElement, bookIndex) => {
            const bookId = bookElement.getAttribute('id');
            
            // Obtener el nombre en rumano del libro
            const bookNameElement = bookElement.querySelector('h');
            const bookName = bookNameElement ? bookNameElement.textContent.trim() : bookId;
            
            // Obtener todos los párrafos que contienen capítulos
            const paragraphs = bookElement.querySelectorAll('p');
            
            paragraphs.forEach(paragraph => {
                const content = paragraph.innerHTML;
                
                // Extraer capítulos y versículos usando regex
                const chapterMatches = content.matchAll(/<c id="(\d+)"\s*\/>/g);
                const chapters = Array.from(chapterMatches).map(m => parseInt(m[1]));
                
                if (chapters.length > 0) {
                    // Dividir el contenido por capítulos
                    const parts = content.split(/<c id="\d+"\s*\/>/);
                    
                    for (let i = 1; i < parts.length; i++) {
                        const chapterNum = chapters[i - 1];
                        const chapterContent = parts[i];
                        
                        // Extraer versículos
                        const verses = chapterContent.split(/<v id="(\d+)"\s*\/>/);
                        
                        for (let j = 2; j < verses.length; j += 2) {
                            const verseNum = parseInt(verses[j - 1]);
                            let verseText = verses[j];
                            
                            // Limpiar tags HTML del texto
                            verseText = verseText
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            
                            if (verseText) {
                                const normalizedText = normalizeText(verseText);
                                const significantWords = getSignificantWords(verseText);
                                const ngrams3 = generateNGrams(significantWords, 3);
                                const ngrams4 = generateNGrams(significantWords, 4);
                                const ngrams5 = generateNGrams(significantWords, 5);
                                
                                const verseData = {
                                    book: bookName,
                                    chapter: chapterNum,
                                    verse: verseNum,
                                    text: verseText,
                                    normalizedText: normalizedText,
                                    significantWords: significantWords,
                                    ngrams: [...ngrams3, ...ngrams4, ...ngrams5]
                                };
                                
                                voiceState.bibleVerses.push(verseData);
                                
                                // Indexar n-gramas
                                verseData.ngrams.forEach(ngram => {
                                    if (!voiceState.ngramIndex.has(ngram)) {
                                        voiceState.ngramIndex.set(ngram, []);
                                    }
                                    voiceState.ngramIndex.get(ngram).push({
                                        book: bookName,
                                        chapter: chapterNum,
                                        verse: verseNum,
                                        verseIndex: voiceState.bibleVerses.length - 1
                                    });
                                });
                                
                                totalVerses++;
                            }
                        }
                    }
                }
            });
            
            // Actualizar progreso
            const progress = Math.floor(25 + ((bookIndex + 1) / totalBooks) * 70);
            updateBibleLoadingProgress(progress, `${bookName} • ${totalVerses} versete`);
        });
        
        voiceState.bibleCacheComplete = true;
        voiceState.isLoadingBible = false;
        
        console.log(`✅ BIBLE LOADED FROM XML!`);
        console.log(`   📖 ${totalVerses} verses indexed`);
        console.log(`   🔍 ${voiceState.ngramIndex.size} n-grams created`);
        
        updateBibleLoadingProgress(100, '✅ Biblie încărcată complet!');
        
        setTimeout(() => {
            const indicator = document.getElementById('bible-loading-indicator');
            if (indicator) {
                indicator.style.transition = 'opacity 0.5s ease';
                indicator.style.opacity = '0';
                setTimeout(() => indicator.style.display = 'none', 500);
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error loading Bible from XML:', error);
        voiceState.isLoadingBible = false;
        updateBibleLoadingProgress(0, '❌ Eroare la încărcare');
    }
}

// ===== CARGAR BIBLIA COMPLETA (API - DEPRECADO) =====
function loadCompleteBible() {
    console.log('📥 Loading complete Bible...');
    console.log('⚠️  Note: bible-api.com limits to 15 requests/30 seconds');
    console.log('📖 Alternative: Download from https://github.com/seven1m/open-bibles');
    
    // Mostrar indicador de carga
    updateBibleLoadingProgress(0, 'Începere încărcare...');
    
    const books = Object.keys(bibleStructure);
    let totalVerses = 0;
    let totalChapters = 0;
    let loadedChapters = 0;
    let failedChapters = 0;
    
    // Crear índice de n-gramas
    voiceState.ngramIndex = new Map();
    
    // Calcular total de capítulos
    books.forEach(book => {
        totalChapters += Object.keys(bibleStructure[book]).length;
    });
    
    console.log(`📊 Total chapters to load: ${totalChapters}`);
    console.log(`⏱️  Estimated time: ${Math.ceil(totalChapters / 15 * 30 / 60)} minutes (due to API rate limit)`);
    
    // Cola de requests con delay para respetar rate limit
    let requestQueue = [];
    
    // Cargar cada libro de la Biblia
    books.forEach(book => {
        const chapters = Object.keys(bibleStructure[book]);
        
        chapters.forEach(chapter => {
            requestQueue.push({ book, chapter });
        });
    });
    
    // Procesar cola con delay (15 requests cada 30 segundos = 2 segundos por request)
    let currentIndex = 0;
    const DELAY_BETWEEN_REQUESTS = 2100; // 2.1 segundos para estar seguros
    
    function processNextBatch() {
        const batchSize = Math.min(15, requestQueue.length - currentIndex);
        
        for (let i = 0; i < batchSize; i++) {
            const index = currentIndex + i;
            if (index >= requestQueue.length) break;
            
            const { book, chapter } = requestQueue[index];
            
            // Delay proporcional dentro del batch
            setTimeout(() => {
                fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=rccv`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data && data.verses) {
                            data.verses.forEach(verseObj => {
                                const normalizedText = normalizeText(verseObj.text);
                                const significantWords = getSignificantWords(verseObj.text);
                                
                                // Generar n-gramas de 3, 4 y 5 palabras
                                const ngrams3 = generateNGrams(significantWords, 3);
                                const ngrams4 = generateNGrams(significantWords, 4);
                                const ngrams5 = generateNGrams(significantWords, 5);
                                
                                const verseData = {
                                    book: book,
                                    chapter: parseInt(chapter),
                                    verse: verseObj.verse,
                                    text: verseObj.text,
                                    normalizedText: normalizedText,
                                    significantWords: significantWords,
                                    ngrams: [...ngrams3, ...ngrams4, ...ngrams5]
                                };
                                
                                voiceState.bibleVerses.push(verseData);
                                
                                // Indexar n-gramas para búsqueda rápida
                                verseData.ngrams.forEach(ngram => {
                                    if (!voiceState.ngramIndex.has(ngram)) {
                                        voiceState.ngramIndex.set(ngram, []);
                                    }
                                    voiceState.ngramIndex.get(ngram).push({
                                        book: book,
                                        chapter: parseInt(chapter),
                                        verse: verseObj.verse,
                                        verseIndex: voiceState.bibleVerses.length - 1
                                    });
                                });
                                
                                totalVerses++;
                            });
                        }
                        
                        loadedChapters++;
                        
                        // Calcular progreso
                        const progress = Math.floor((loadedChapters / totalChapters) * 100);
                        const details = `${book} ${chapter} • ${loadedChapters}/${totalChapters} capitole • ${totalVerses} versete`;
                        
                        // Actualizar UI
                        updateBibleLoadingProgress(progress, details);
                        
                        // Log cada 5%
                        if (loadedChapters % Math.ceil(totalChapters / 20) === 0) {
                            const timeElapsed = Math.floor(loadedChapters * DELAY_BETWEEN_REQUESTS / 1000);
                            const timeRemaining = Math.floor((totalChapters - loadedChapters) * DELAY_BETWEEN_REQUESTS / 1000);
                            console.log(`📥 ${progress}% • ${totalVerses} versete • ${Math.floor(timeElapsed/60)}m elapsed • ${Math.floor(timeRemaining/60)}m remaining`);
                        }
                        
                        // Cuando terminamos
                        if (loadedChapters + failedChapters >= totalChapters) {
                            voiceState.bibleCacheComplete = true;
                            console.log(`✅ BIBLE LOADED!`);
                            console.log(`   📖 ${totalVerses} verses indexed`);
                            console.log(`   🔍 ${voiceState.ngramIndex.size} n-grams created`);
                            console.log(`   ⚠️  ${failedChapters} chapters failed`);
                            
                            setTimeout(() => {
                                updateBibleLoadingProgress(100, '✅ Biblie încărcată complet!');
                                setTimeout(() => {
                                    const indicator = document.getElementById('bible-loading-indicator');
                                    if (indicator) {
                                        indicator.style.transition = 'opacity 0.5s ease';
                                        indicator.style.opacity = '0';
                                        setTimeout(() => indicator.style.display = 'none', 500);
                                    }
                                }, 1500);
                            }, 300);
                        }
                    })
                    .catch(error => {
                        console.error(`❌ Error loading ${book} ${chapter}:`, error.message);
                        loadedChapters++;
                        failedChapters++;
                        
                        const progress = Math.floor((loadedChapters / totalChapters) * 100);
                        updateBibleLoadingProgress(progress, `Eroare: ${book} ${chapter}`);
                    });
            }, i * 200); // 200ms entre requests del mismo batch
        }
        
        currentIndex += batchSize;
        
        // Continuar con el siguiente batch después de 30 segundos
        if (currentIndex < requestQueue.length) {
            setTimeout(processNextBatch, 30500); // 30.5 segundos entre batches
        }
    }
    
    // Iniciar procesamiento
    processNextBatch();
}

// Actualizar progreso de carga visual
function updateBibleLoadingProgress(percentage, details) {
    const progressFill = document.getElementById('bible-progress-fill');
    const progressText = document.getElementById('bible-progress-text');
    const loadingDetails = document.getElementById('bible-loading-details');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = percentage + '%';
    }
    if (loadingDetails && details) {
        loadingDetails.textContent = details;
    }
}

// ===== BUSCAR EN TODA LA BIBLIA =====
function searchInCompleteBible(spokenText) {
    if (!voiceState.bibleCacheComplete) return null;
    
    const significantWords = getSignificantWords(spokenText);
    
    if (significantWords.length < 3) return null; // Muy corto para buscar
    
    console.log(`🔍 Searching for: "${spokenText}"`);
    console.log(`📊 Significant words: ${significantWords.join(', ')}`);
    
    // ESTRATEGIA MEJORADA: Buscar por ventanas de palabras consecutivas
    // Esto permite detectar versículos incluso con mucho relleno alrededor
    let bestMatch = null;
    let bestScore = 0;
    
    // Generar ventanas de 3, 4, 5 palabras consecutivas del transcript
    const windows = [];
    for (let windowSize = 5; windowSize >= 3; windowSize--) {
        for (let i = 0; i <= significantWords.length - windowSize; i++) {
            windows.push({
                words: significantWords.slice(i, i + windowSize),
                size: windowSize
            });
        }
    }
    
    console.log(`🪟 Created ${windows.length} windows from transcript`);
    
    // Para cada ventana, buscar coincidencias
    for (const window of windows) {
        // Buscar candidatos por n-gramas de esta ventana
        const candidates = searchByNGrams(window.words);
        
        if (candidates.length === 0) continue;
        
        // Calcular similitud para cada candidato
        for (const candidate of candidates) {
            const verse = voiceState.bibleVerses[candidate.verseIndex];
            if (!verse) continue;
            
            // Buscar si esta ventana aparece en el versículo
            const windowScore = calculateWindowMatch(window.words, verse.significantWords);
            
            // Bonus por ventana más larga y por coincidencia exacta de n-grama
            const sizeBonus = window.size / 5 * 0.2; // Ventana de 5 palabras = 20% bonus
            const ngramBonus = candidate.exactMatch ? 0.15 : 0;
            const finalScore = windowScore + sizeBonus + ngramBonus;
            
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestMatch = {
                    book: verse.book,
                    chapter: verse.chapter,
                    verse: verse.verse,
                    similarity: finalScore,
                    matchedWindow: window.words.join(' ')
                };
            }
        }
    }
    
    if (bestMatch) {
        console.log(`🎯 Found match with ${(bestScore * 100).toFixed(1)}% similarity: ${bestMatch.book} ${bestMatch.chapter}:${bestMatch.verse}`);
        console.log(`   Matched window: "${bestMatch.matchedWindow}"`);
        return bestMatch;
    }
    
    console.log(`❌ No match found in any window`);
    return null;
}

// Calcular si una ventana de palabras aparece en un versículo
function calculateWindowMatch(windowWords, verseWords) {
    if (windowWords.length === 0 || verseWords.length === 0) return 0;
    
    let bestMatch = 0;
    
    // Buscar la ventana en todas las posiciones del versículo
    for (let i = 0; i <= verseWords.length - windowWords.length; i++) {
        const verseWindow = verseWords.slice(i, i + windowWords.length);
        
        // Contar coincidencias (permitir palabras similares)
        let matches = 0;
        for (let j = 0; j < windowWords.length; j++) {
            if (windowWords[j] === verseWindow[j]) {
                matches++;
            } else if (wordsAreSimilar(windowWords[j], verseWindow[j])) {
                matches += 0.7; // Coincidencia parcial
            }
        }
        
        const matchScore = matches / windowWords.length;
        if (matchScore > bestMatch) {
            bestMatch = matchScore;
        }
    }
    
    return bestMatch;
}

// Búsqueda rápida por n-gramas
function searchByNGrams(significantWords) {
    const candidates = new Map(); // verseIndex -> { count, exactMatch }
    
    // Generar n-gramas del texto hablado
    const spokenNgrams3 = generateNGrams(significantWords, 3);
    const spokenNgrams4 = generateNGrams(significantWords, 4);
    const spokenNgrams5 = generateNGrams(significantWords, 5);
    
    const allSpokenNgrams = [...spokenNgrams5, ...spokenNgrams4, ...spokenNgrams3];
    
    // Buscar cada n-grama en el índice
    for (const ngram of allSpokenNgrams) {
        const matches = voiceState.ngramIndex.get(ngram);
        if (matches) {
            const weight = ngram.split(' ').length; // n-gramas más largos pesan más
            const isLong = weight >= 4;
            
            matches.forEach(match => {
                if (!candidates.has(match.verseIndex)) {
                    candidates.set(match.verseIndex, { count: 0, exactMatch: false });
                }
                const candidate = candidates.get(match.verseIndex);
                candidate.count += weight;
                if (isLong) {
                    candidate.exactMatch = true;
                }
            });
        }
    }
    
    // Ordenar candidatos por conteo
    const sortedCandidates = Array.from(candidates.entries())
        .map(([verseIndex, data]) => ({
            verseIndex,
            count: data.count,
            exactMatch: data.exactMatch
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 candidatos
    
    return sortedCandidates;
}

// ===== DETECCIÓN POR CONTENIDO =====
// Detecta si el texto hablado coincide con el contenido de un versículo
function detectVerseByContent(spokenText) {
    const ctx = voiceState.currentContext;
    
    // Solo buscar si hay contexto reciente (últimos 15 segundos)
    if (!ctx.book || !ctx.chapter || !ctx.timestamp) {
        return null;
    }
    if (Date.now() - ctx.timestamp > 15000) {
        return null;
    }
    
    // Verificar si tenemos los versículos en cache
    const cacheKey = `${ctx.book}-${ctx.chapter}`;
    
    if (voiceState.chapterCacheKey !== cacheKey) {
        return null;
    }
    
    // Obtener el versículo actual
    const verses = voiceState.chapterVerses;
    const currentVerseText = verses[ctx.verse];
    
    if (!currentVerseText) return null;
    
    // Obtener las últimas 2 palabras del versículo actual
    const currentWords = normalizeText(currentVerseText).split(' ').filter(w => w.length > 2);
    if (currentWords.length < 2) return null;
    
    const lastTwoWords = currentWords.slice(-2);
    const normalizedSpoken = normalizeText(spokenText);
    
    console.log(`🔍 Looking for ending: "${lastTwoWords.join(' ')}" in "${normalizedSpoken}"`);
    
    // Verificar si el texto hablado contiene las últimas 2 palabras del versículo actual
    if (normalizedSpoken.includes(lastTwoWords[0]) && normalizedSpoken.includes(lastTwoWords[1])) {
        // Verificar que estén en orden
        const index1 = normalizedSpoken.indexOf(lastTwoWords[0]);
        const index2 = normalizedSpoken.indexOf(lastTwoWords[1], index1);
        
        if (index2 > index1) {
            const nextVerse = ctx.verse + 1;
            
            // Verificar que el siguiente versículo existe
            if (verses[nextVerse]) {
                console.log(`✅ Detected verse ending! Advancing to verse ${nextVerse}`);
                return {
                    book: ctx.book,
                    chapter: ctx.chapter,
                    verse: nextVerse
                };
            }
        }
    }
    
    return null;
}

// Palabras comunes rumanas a excluir (stopwords)
const ROMANIAN_STOPWORDS = new Set([
    'si', 'sau', 'dar', 'in', 'la', 'cu', 'pe', 'de', 'din', 'pentru',
    'ca', 'sa', 'cel', 'cea', 'cei', 'cele', 'un', 'o', 'a', 'ai', 'ale',
    'este', 'sunt', 'era', 'erau', 'fie', 'fost', 'fi', 'fiind',
    'am', 'ai', 'are', 'avem', 'aveti', 'au', 'avea', 'avut',
    'va', 'voi', 'vor', 'ar', 'nu', 'ne', 'el', 'ea', 'ei', 'ele',
    'acest', 'aceasta', 'acesti', 'aceste', 'acel', 'aceea', 'acei', 'acelea',
    'tot', 'toata', 'toti', 'toate', 'prin', 'mai', 'cum', 'cat', 'care',
    'ce', 'se', 'daca', 'atunci', 'asa', 'inca', 'foarte'
]);

// Normalizar texto para comparación
function normalizeText(text) {
    // Primero: convertir números rumanos escritos a dígitos
    text = convertRomanianNumbersToDigits(text);
    
    return text
        .toLowerCase()
        // Primero: eliminar toda la puntuación explícitamente
        .replace(/[.,;:!?"""''„"«»\-–—()[\]{}<>\/\\|@#$%^&*+=~`]/g, ' ')
        // Segundo: convertir caracteres rumanos a sus equivalentes sin diacríticos
        // Esto es CRÍTICO porque el micrófono no reconoce â, ă, î, ș, ț
        .replace(/[ăâ]/g, 'a')  // ă, â → a
        .replace(/[î]/g, 'i')    // î → i
        .replace(/[ș]/g, 's')    // ș → s (s con cedilla rumana)
        .replace(/[ț]/g, 't')    // ț → t (t con cedilla rumana)
        // Tercero: normalizar caracteres Unicode (descomponer otros acentos)
        .normalize('NFD')
        // Cuarto: eliminar marcas diacríticas restantes
        .replace(/[\u0300-\u036f]/g, '')
        // Quinto: eliminar cualquier carácter que no sea letra o número
        .replace(/[^a-z0-9\s]/g, '')
        // Sexto: normalizar espacios múltiples a uno solo
        .replace(/\s+/g, ' ')
        // Séptimo: eliminar espacios al inicio y final
        .trim();
}

// Convertir números escritos en rumano a dígitos
function convertRomanianNumbersToDigits(text) {
    const lowerText = text.toLowerCase();
    
    // Mapa de números rumanos (normalizado sin diacríticos)
    const numbers = {
        'zero': 0,
        'unu': 1, 'una': 1, 'un': 1, 'o': 1,
        'doi': 2, 'doua': 2, 'doua': 2,
        'trei': 3,
        'patru': 4,
        'cinci': 5,
        'sase': 6, 'sase': 6,
        'sapte': 7, 'sapte': 7,
        'opt': 8,
        'noua': 9, 'noua': 9,
        'zece': 10,
        'unsprezece': 11,
        'doisprezece': 12, 'douasprezece': 12,
        'treisprezece': 13,
        'paisprezece': 14, 'patrusprezece': 14,
        'cincisprezece': 15,
        'saisprezece': 16, 'saisprezece': 16,
        'saptesprezece': 17, 'saptesprezece': 17,
        'optsprezece': 18,
        'nouasprezece': 19, 'nouasprezece': 19,
        'douazeci': 20, 'douazeci': 20,
        'treizeci': 30,
        'patruzeci': 40,
        'cincizeci': 50,
        'saizeci': 60, 'saizeci': 60,
        'saptezeci': 70, 'saptezeci': 70,
        'optzeci': 80,
        'nouazeci': 90, 'nouazeci': 90
    };
    
    // Mapas de centenas y miles
    const hundreds = {
        'o suta': 100, 'o suta': 100, 'suta': 100, 'suta': 100,
        'doua sute': 200, 'doua sute': 200,
        'trei sute': 300,
        'patru sute': 400,
        'cinci sute': 500,
        'sase sute': 600, 'sase sute': 600,
        'sapte sute': 700, 'sapte sute': 700,
        'opt sute': 800,
        'noua sute': 900, 'noua sute': 900
    };
    
    const thousands = {
        'mie': 1000, 'o mie': 1000,
        'doua mii': 2000, 'doua mii': 2000,
        'trei mii': 3000,
        'patru mii': 4000,
        'cinci mii': 5000,
        'sase mii': 6000, 'sase mii': 6000,
        'sapte mii': 7000, 'sapte mii': 7000,
        'opt mii': 8000,
        'noua mii': 9000, 'noua mii': 9000,
        'zece mii': 10000
    };
    
    let result = lowerText;
    
    // Normalizar diacríticos para la conversión
    result = result
        .replace(/ă|â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/ș/g, 's')
        .replace(/ț/g, 't');
    
    // Patrón COMPLEJO 1: [decenas] si [unidades] de mii [centenas]
    // Ej: "cincizeci si noua de mii trei sute" → "59300"
    result = result.replace(/(\w+)\s+si\s+(\w+)\s+de\s+mii\s+(\w+)\s+sute/gi, (match, tens, units, hundredWord) => {
        const tensVal = numbers[tens] || 0;
        const unitsVal = numbers[units] || 0;
        const hundredVal = numbers[hundredWord] || 0;
        
        const total = (tensVal + unitsVal) * 1000 + (hundredVal * 100);
        console.log(`🔢 Converting: "${match}" → ${total} (${tensVal}+${unitsVal})*1000 + ${hundredVal}*100`);
        return total.toString();
    });
    
    // Patrón COMPLEJO 2: [número] de mii [centenas]
    // Ej: "patruzeci de mii cinci sute" → "40500"
    result = result.replace(/(\w+)\s+de\s+mii\s+(\w+)\s+sute/gi, (match, thousands, hundredWord) => {
        const thousandsVal = numbers[thousands] || 0;
        const hundredVal = numbers[hundredWord] || 0;
        
        const total = thousandsVal * 1000 + (hundredVal * 100);
        console.log(`🔢 Converting: "${match}" → ${total} (${thousandsVal}*1000 + ${hundredVal}*100)`);
        return total.toString();
    });
    
    // Patrón COMPLEJO 3: [decenas] si [unidades] de mii
    // Ej: "patruzeci si sase de mii" → "46000"
    result = result.replace(/(\w+)\s+si\s+(\w+)\s+de\s+mii/gi, (match, tens, units) => {
        const tensVal = numbers[tens] || 0;
        const unitsVal = numbers[units] || 0;
        
        const total = (tensVal + unitsVal) * 1000;
        console.log(`🔢 Converting: "${match}" → ${total} (${tensVal}+${unitsVal})*1000`);
        return total.toString();
    });
    
    // Patrón: [número] de mii (sin centenas)
    result = result.replace(/(\w+)\s+de\s+mii/gi, (match, thousands) => {
        const val = numbers[thousands] || 0;
        const total = val * 1000;
        console.log(`🔢 Converting: "${match}" → ${total}`);
        return total.toString();
    });
    
    // Patrón: [número] mii [centenas]
    result = result.replace(/(\w+)\s+mii\s+(\w+)\s+sute/gi, (match, thousands, hundredWord) => {
        const thousandsVal = numbers[thousands] || 0;
        const hundredVal = numbers[hundredWord] || 0;
        
        const total = thousandsVal * 1000 + (hundredVal * 100);
        console.log(`🔢 Converting: "${match}" → ${total}`);
        return total.toString();
    });
    
    // Centenas independientes: "trei sute" → "300"
    result = result.replace(/(\w+)\s+sute/gi, (match, hundredWord) => {
        const val = numbers[hundredWord] || 0;
        const total = val * 100;
        console.log(`🔢 Converting: "${match}" → ${total}`);
        return total.toString();
    });
    
    // "suta" sola → "100"
    result = result.replace(/\bsuta\b/gi, '100');
    
    // Patrón: [decenas] si [unidades] (ej: "douazeci si trei" → "23")
    result = result.replace(/(\w+)\s+si\s+(\w+)/gi, (match, tens, units) => {
        if (numbers[tens] !== undefined && numbers[units] !== undefined) {
            const total = numbers[tens] + numbers[units];
            console.log(`🔢 Converting: "${match}" → ${total}`);
            return total.toString();
        }
        return match;
    });
    
    // Números simples individuales (del más largo al más corto para evitar conflictos)
    const sortedNumbers = Object.entries(numbers).sort((a, b) => b[0].length - a[0].length);
    for (const [word, num] of sortedNumbers) {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        result = result.replace(regex, num.toString());
    }
    
    return result;
}

// Obtener palabras significativas (sin stopwords)
function getSignificantWords(text) {
    const normalized = normalizeText(text);
    return normalized.split(' ')
        .filter(w => w.length > 2 && !ROMANIAN_STOPWORDS.has(w));
}

// Generar n-gramas de un texto (secuencias de N palabras consecutivas)
function generateNGrams(words, n = 3) {
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
}

// Calcular similitud entre dos textos (legacy, mantener para compatibilidad)
function calculateTextSimilarity(text1, text2) {
    const words1 = text1.split(' ').filter(w => w.length > 2);
    const words2 = text2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    
    // Contar palabras en común
    for (const word1 of words1) {
        if (words2.includes(word1)) {
            matches++;
        }
    }
    
    return matches / words1.length;
}

// Algoritmo de similitud avanzado (Jaccard + Dice + Order)
function calculateAdvancedSimilarity(words1, words2) {
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    // Intersección y unión
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard similarity (intersección / unión)
    const jaccard = intersection.size / union.size;
    
    // Dice coefficient (2 * intersección / (|A| + |B|))
    const dice = (2 * intersection.size) / (set1.size + set2.size);
    
    // Bonus por orden secuencial
    let sequentialBonus = 0;
    if (words1.length >= 3) {
        const trigram1 = words1.slice(0, 3).join(' ');
        const trigram2 = words2.slice(0, 3).join(' ');
        if (trigram1 === trigram2) {
            sequentialBonus = 0.15; // 15% bonus si las primeras 3 palabras coinciden
        }
    }
    
    // Bonus por cobertura del texto hablado
    const coverage = intersection.size / words1.length;
    
    // Promedio ponderado
    const finalScore = (jaccard * 0.3) + (dice * 0.3) + (coverage * 0.4) + sequentialBonus;
    
    return Math.min(finalScore, 1.0); // Máximo 1.0
}

// ===== DETECCIÓN DE REFERENCIAS EXPLÍCITAS =====
// Detecta cuando alguien menciona directamente una referencia como "Psalmul 58 cu 12"
function detectExplicitReference(text) {
    console.log('🔍🔍🔍 DETECTING EXPLICIT REFERENCE IN:', text);
    
    // Patrones para detectar referencias explícitas con variaciones de nombres
    const patterns = [
        // "Psalmul 58 cu 12" o "Ioan 3 cu 16"
        {
            regex: /\b(\w+(?:\s+\w+)?)\s+(\d+)\s+cu\s+(\d+)\b/i,
            name: 'cu-pattern'
        },
        
        // "Psalmul 58:12" o "Ioan 3:16"
        {
            regex: /\b(\w+(?:\s+\w+)?)\s+(\d+):(\d+)\b/i,
            name: 'colon-pattern'
        },
        
        // "Psalmul 58 versetul 12"
        {
            regex: /\b(\w+(?:\s+\w+)?)\s+(\d+)\s+(?:versetul|versul|vers\.?)\s+(\d+)\b/i,
            name: 'versetul-pattern'
        },
        
        // "capitolul 58 din Psalmi" o "capitolul 3 din Ioan"
        {
            regex: /\bcapitolul?\s+(\d+)\s+din\s+(\w+(?:\s+\w+)?)\b/i,
            name: 'capitolul-din-pattern'
        },
        
        // "în Psalmul 58" o "la Ioan 3"
        {
            regex: /\b(?:în|la|din)\s+(\w+(?:\s+\w+)?)\s+(\d+)\b/i,
            name: 'in-pattern'
        }
    ];
    
    console.log('🎯 Testing', patterns.length, 'patterns...');
    
    for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match) {
            console.log(`✓ Pattern matched (${pattern.name}):`, match[0]);
            console.log('  Captured groups:', match.slice(1));
            
            let book, chapter, verse;
            
            // Diferentes grupos de captura según el patrón
            if (pattern.name === 'capitolul-din-pattern') {
                // "capitolul X din Libro"
                chapter = parseInt(match[1]);
                book = normalizeBookName(match[2]);
                verse = 1; // Por defecto primer versículo
            } else if (pattern.name === 'in-pattern') {
                // "en Libro X"
                book = normalizeBookName(match[1]);
                chapter = parseInt(match[2]);
                verse = 1;
            } else {
                // "Libro X cu Y" o "Libro X:Y"
                book = normalizeBookName(match[1]);
                chapter = parseInt(match[2]);
                verse = match[3] ? parseInt(match[3]) : 1;
            }
            
            console.log('  Raw book name:', match[1], '→ Normalized:', book);
            console.log('  Chapter:', chapter, 'Verse:', verse);
            
            if (book && chapter) {
                const ref = { book, chapter, verse: verse || 1 };
                
                // Validar que la referencia existe
                if (validateReference(ref)) {
                    console.log('✅ Valid reference:', ref);
                    return ref;
                } else {
                    console.log('❌ Invalid reference (does not exist in Bible):', ref);
                }
            } else {
                console.log('❌ Failed to normalize book name or extract chapter');
            }
        }
    }
    
    console.log('❌ No explicit reference pattern matched');
    return null;
}

// ===== BUSCAR VERSÍCULO POR REFERENCIA =====
// Busca un versículo específico en la caché cargada
function findVerseByReference(ref) {
    if (!voiceState.bibleCacheComplete) return null;
    
    return voiceState.bibleVerses.find(v => 
        v.book === ref.book && 
        v.chapter === ref.chapter && 
        v.verse === ref.verse
    );
}

// ===== DETECCIÓN CON REGEX =====
function detectReferenceWithRegex(text) {
    // Primero intentar patrones de alta prioridad (sin contexto)
    for (const pattern of romanianBiblePatterns) {
        if (pattern.lowPriority) continue;
        
        const match = text.match(pattern.regex);
        if (match) {
            const ref = pattern.needsContext 
                ? pattern.extract(match, voiceState.currentContext)
                : pattern.extract(match);
            
            if (ref && validateReference(ref)) {
                return ref;
            }
        }
    }
    
    // Si no hay coincidencia, intentar patrones de baja prioridad (con contexto)
    for (const pattern of romanianBiblePatterns) {
        if (!pattern.lowPriority) continue;
        
        const match = text.match(pattern.regex);
        if (match) {
            const ref = pattern.extract(match, voiceState.currentContext);
            
            if (ref && validateReference(ref)) {
                console.log('📌 Detected verse from context:', ref);
                return ref;
            }
        }
    }
    
    return null;
}

// ===== VALIDACIÓN DE REFERENCIAS =====
function validateReference(ref) {
    const bookData = bibleStructure[ref.book];
    if (!bookData) return false;
    
    const chapterData = bookData[ref.chapter];
    if (!chapterData) return false;
    
    if (ref.verse && ref.verse > chapterData) return false;
    
    return true;
}

// ===== COLA DE PROCESAMIENTO CON IA =====
function queueAIRequest(transcript) {
    // Evitar saturar con requests
    if (voiceState.activeRequests >= voiceState.maxConcurrentRequests) {
        console.log('⏸️ Queue full, skipping...');
        return;
    }

    voiceState.activeRequests++;

    // Llamar al backend para procesar con IA
    fetch(`${API_CONFIG.baseURL}/api/detect-reference`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: transcript })
    })
    .then(response => response.json())
    .then(data => {
        voiceState.activeRequests--;

        if (data.success && data.reference) {
            console.log('🤖 AI detection:', data.reference);
            handleDetectedReference(data.reference, 'ai', transcript);
        } else {
            console.log('❌ No reference detected by AI');
        }
    })
    .catch(error => {
        voiceState.activeRequests--;
        console.error('Error calling AI:', error);
    });
}

// ===== INICIALIZACIÓN AL CARGAR =====
// Inicializar cuando el documento esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initVoiceRecognition, 500);
    });
} else {
    setTimeout(initVoiceRecognition, 500);
}

// ===== MANEJO DE REFERENCIAS DETECTADAS =====
function handleDetectedReference(ref, method, transcript) {
    // Crear clave única para deduplicación
    const refKey = `${ref.book}-${ref.chapter}-${ref.verse}`;
    const now = Date.now();

    // Deduplicación con tiempo diferente según el método
    if (voiceState.recentReferences.has(refKey)) {
        const lastTime = voiceState.recentReferences.get(refKey);
        
        // Tiempos de deduplicación optimizados para respuesta rápida
        let dedupTime;
        if (method === 'explicit-incremental' || method === 'explicit') {
            dedupTime = 2000; // Solo 2 segundos para referencias explícitas (detectadas rápido)
        } else if (method === 'content') {
            dedupTime = 3000; // 3 segundos para búsqueda por contenido
        } else {
            dedupTime = 5000; // 5 segundos para otros métodos (regex/AI)
        }
        
        if (now - lastTime < dedupTime) {
            console.log(`⏭️ Duplicate reference ignored (${method}, ${Math.floor((now - lastTime) / 1000)}s ago):`, refKey);
            return;
        }
    }

    // ¡REFERENCIA DETECTADA! Mostrar inmediatamente
    console.log(`✅✅✅ REFERENCE DETECTED (${method}): ${ref.book} ${ref.chapter}:${ref.verse}`);
    console.log(`   Transcript: "${transcript}"`);

    // Guardar en cache
    voiceState.recentReferences.set(refKey, now);
    
    // Guardar contexto actual para detección secuencial
    voiceState.currentContext = {
        book: ref.book,
        chapter: ref.chapter,
        verse: ref.verse,
        timestamp: now
    };
    console.log('📍 Context updated:', voiceState.currentContext);
    
    // Cargar versículos del capítulo para comparación de contenido
    loadChapterVerses(ref.book, ref.chapter);

    // Limpiar cache antigua (más de 30 segundos)
    for (const [key, time] of voiceState.recentReferences.entries()) {
        if (now - time > 30000) {
            voiceState.recentReferences.delete(key);
        }
    }

    // Mostrar última búsqueda
    updateLastSearch(`${ref.book} ${ref.chapter}:${ref.verse}`);

    // Navegar directamente al versículo detectado
    console.log(`✅ Navigating to: ${ref.book} ${ref.chapter}:${ref.verse} (method: ${method})`);
    
    // Normalizar el nombre del libro para que coincida con bibleStructure
    let normalizedBook = ref.book;
    
    // Si el libro no existe en bibleStructure, intentar normalizarlo
    if (!bibleStructure[normalizedBook]) {
        // Intentar sin diacríticos
        const withoutDiacritics = ref.book
            .replace(/ă|â/g, 'a')
            .replace(/î/g, 'i')
            .replace(/ș/g, 's')
            .replace(/ț/g, 't');
        
        if (bibleStructure[withoutDiacritics]) {
            normalizedBook = withoutDiacritics;
        } else {
            // Buscar por similitud (case insensitive)
            const bookLower = ref.book.toLowerCase();
            const match = Object.keys(bibleStructure).find(b => 
                b.toLowerCase() === bookLower || 
                b.toLowerCase().includes(bookLower) ||
                bookLower.includes(b.toLowerCase())
            );
            if (match) {
                normalizedBook = match;
            }
        }
    }
    
    console.log(`📚 Book name: "${ref.book}" → "${normalizedBook}"`);
    
    // Asegurar que estamos en la pantalla de lectura
    const readingScreen = document.getElementById('screen-reading');
    const selectionScreen = document.getElementById('screen-selection');
    
    if (readingScreen && !readingScreen.classList.contains('active')) {
        if (selectionScreen) selectionScreen.classList.remove('active');
        readingScreen.classList.add('active');
    }
    
    // Usar setReference que es más directo
    if (typeof setReference === 'function') {
        setReference(normalizedBook, ref.chapter, ref.verse, true);
    } else if (typeof goToReadingScreen === 'function') {
        goToReadingScreen(normalizedBook, ref.chapter, ref.verse);
    }
}

// ===== CARGAR VERSÍCULOS DEL CAPÍTULO =====
function loadChapterVerses(book, chapter) {
    const cacheKey = `${book}-${chapter}`;
    
    // Si ya tenemos este capítulo en cache, no hacer nada
    if (voiceState.chapterCacheKey === cacheKey) {
        return;
    }
    
    console.log(`📥 Loading verses for ${book} ${chapter}...`);
    
    // Hacer request a la API
    fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=rccv`)
        .then(response => response.json())
        .then(data => {
            if (data && data.verses) {
                voiceState.chapterVerses = {};
                
                // Guardar cada versículo por número
                data.verses.forEach(verseObj => {
                    voiceState.chapterVerses[verseObj.verse] = verseObj.text;
                });
                
                voiceState.chapterCacheKey = cacheKey;
                console.log(`✅ Loaded ${data.verses.length} verses for comparison`);
            }
        })
        .catch(error => {
            console.error('Error loading chapter verses:', error);
        });
}

// ===== ACTUALIZACIÓN DE UI =====

// Actualizar transcripción en tiempo real (últimas 5 palabras)
function updateLiveTranscript(transcript) {
    const liveTranscriptDiv = document.getElementById('voice-live-transcript');
    const transcriptText = document.getElementById('voice-transcript-text');
    
    if (liveTranscriptDiv && transcriptText && voiceState.isListening) {
        // Obtener últimas 5 palabras
        const words = transcript.split(/\s+/).filter(w => w.length > 0);
        const lastFiveWords = words.slice(-5).join(' ');
        
        transcriptText.textContent = lastFiveWords;
        liveTranscriptDiv.style.display = 'block';
    }
}

// Mostrar resultado de búsqueda incremental (provisional)
function updateLiveSearchResult(match) {
    const container = document.getElementById('voice-last-search');
    const text = document.getElementById('voice-search-text');
    
    if (container && text) {
        const refText = `${match.book} ${match.chapter}:${match.verse}`;
        const confidence = Math.round(match.similarity * 100);
        text.textContent = `🔍 ${refText} (${confidence}%)`;
        text.style.opacity = '0.7'; // Indicar que es provisional
        container.style.display = 'flex';
    }
}

function updateLastSearch(reference) {
    const container = document.getElementById('voice-last-search');
    const text = document.getElementById('voice-search-text');
    
    if (container && text) {
        text.textContent = reference;
        text.style.opacity = '1'; // Resultado final
        container.style.display = 'flex';
        
        // Ocultar después de 5 segundos si no está escuchando
        if (!voiceState.isListening) {
            setTimeout(() => {
                if (!voiceState.isListening) {
                    container.style.display = 'none';
                }
            }, 5000);
        }
    }
}

// Actualizar referencia de Autocitire cuando cambia manualmente
function updateAutocitireReference(newRef) {
    // Solo actualizar si Autocitire está activo
    if (!voiceState.autocitireMode) return;
    
    console.log('[Autocitire] Actualizando referencia manualmente:', newRef);
    
    // Actualizar la referencia actual de autocitire
    voiceState.autocitireCurrentVerse = {
        book: newRef.book,
        chapter: newRef.chapter,
        verse: newRef.verse
    };
    
    // Recargar las palabras del versículo actual
    loadCurrentVerseForAutocitire(newRef);
    
    console.log('[Autocitire] Nuevas últimas palabras:', voiceState.autocitireLastWords);
}

console.log('✅ Voice recognition module loaded (integrated mode)');
