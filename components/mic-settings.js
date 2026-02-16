// ============================================
// Mic Settings Component - Gestión de Configuración
// ============================================

// Configuración global del micrófono
window.microphoneConfig = {
    autocite: {
        speed: parseFloat(localStorage.getItem('mic_autocite_speed') || '1'),
        delay: parseInt(localStorage.getItem('mic_autocite_delay') || '500'),
        highlight: JSON.parse(localStorage.getItem('mic_autocite_highlight') || 'true'),
        loop: JSON.parse(localStorage.getItem('mic_autocite_loop') || 'true')
    },
    literal: {
        sameChapter: parseInt(localStorage.getItem('mic_literal_sameChapter') || '5'),
        sameBook: parseInt(localStorage.getItem('mic_literal_sameBook') || '35'),
        otherBook: parseInt(localStorage.getItem('mic_literal_otherBook') || '89'),
        caseSensitive: JSON.parse(localStorage.getItem('mic_literal_caseSensitive') || 'false')
    },
    ia: {
        confidence: parseInt(localStorage.getItem('mic_ia_confidence') || '70'),
        model: localStorage.getItem('mic_ia_model') || 'groq',
        timeout: parseInt(localStorage.getItem('mic_ia_timeout') || '30'),
        contextual: JSON.parse(localStorage.getItem('mic_ia_contextual') || 'true'),
        suggestions: JSON.parse(localStorage.getItem('mic_ia_suggestions') || 'true')
    }
};
// Notify other modules about the loaded configuration on startup
try {
    window.dispatchEvent(new CustomEvent('microphoneConfigChanged', { detail: window.microphoneConfig }));
} catch (e) {
    console.warn('Could not dispatch initial microphoneConfigChanged event', e);
}

function initializeMicSettings() {
    // Make initialization resilient to templates injected later.
    const tryBind = () => {
        const settingsBtn = document.querySelector('.settings-btn');
        const micSettingsModal = document.getElementById('micSettingsModal');
        const closeMicBtn = document.querySelector('.mic-settings-close');

        if (!micSettingsModal) return false;

        // If button not present yet, return false so caller can retry later
        if (!settingsBtn) return false;

        // Avoid double-binding: check marker
        if (settingsBtn.__micSettingsBound) return true;

        // Abrir modal al hacer clic en el engranaje
        settingsBtn.addEventListener('click', () => {
            micSettingsModal.classList.add('active');
            // Cargar valores actuales
            loadMicSettingsValues();
        });
        settingsBtn.__micSettingsBound = true;

        // Cerrar modal
        if (closeMicBtn) {
            closeMicBtn.addEventListener('click', () => {
                micSettingsModal.classList.remove('active');
            });
        }

        // Cerrar al hacer clic fuera
        micSettingsModal.addEventListener('click', (e) => {
            if (e.target === micSettingsModal) {
                micSettingsModal.classList.remove('active');
            }
        });

        // Inicializar pestañas
        setupMicTabs();

        // Sincronizar sliders y inputs
        syncMicSliderInputs();

        // Botones de acción
        setupMicActionButtons();

    // Populate inputs immediately from saved config so UI reflects stored values
    try { loadMicSettingsValues(); } catch (e) { /* ignore */ }

        return true;
    };

    // Try immediately; if components/templates not yet injected, wait for the event
    if (tryBind()) return;

    // Listen once for templates injection and try again
    const onInjected = () => {
        tryBind();
        document.removeEventListener('screens-injected', onInjected);
    };
    document.addEventListener('screens-injected', onInjected);
}

function setupMicTabs() {
    const tabBtns = document.querySelectorAll('.mic-tab-btn');
    const tabContents = document.querySelectorAll('.mic-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remover active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Agregar active al seleccionado
            btn.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabId}`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

function syncMicSliderInputs() {
    const pairs = [
        // Autocite
        { slider: '#autocite-speed', input: '#autocite-speed-val', type: 'float' },
        { slider: '#autocite-delay', input: '#autocite-delay-val', type: 'int' },
        // Literal
        { slider: '#literal-sameChapter', input: '#literal-sameChapter-val', type: 'int' },
        { slider: '#literal-sameBook', input: '#literal-sameBook-val', type: 'int' },
        { slider: '#literal-otherBook', input: '#literal-otherBook-val', type: 'int' },
        // IA
        { slider: '#ia-confidence', input: '#ia-confidence-val', type: 'int' },
        { slider: '#ia-timeout', input: '#ia-timeout-val', type: 'int' }
    ];

    pairs.forEach(pair => {
        const slider = document.querySelector(pair.slider);
        const input = document.querySelector(pair.input);

        if (slider && input) {
            // Slider cambia input
            slider.addEventListener('input', () => {
                input.value = slider.value;
            });

            // Input cambia slider
            input.addEventListener('input', () => {
                let value = pair.type === 'float' ? parseFloat(input.value) : parseInt(input.value);
                
                // Validación
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                
                if (isNaN(value) || value < min) value = min;
                if (value > max) value = max;
                
                slider.value = value;
                input.value = value;
            });
        }
    });
}

function setupMicActionButtons() {
    const resetBtn = document.querySelector('.btn-reset-mic');
    const saveBtn = document.querySelector('.btn-save-mic');

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetMicSettingsToDefaults();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveMicSettings();
        });
    }
}

function loadMicSettingsValues() {
    // Set values only if the corresponding elements exist in the DOM.
    // Autocite
    const el = id => document.querySelector(id);
    const setIf = (sel, fn) => { const e = el(sel); if (!e) return; try { fn(e); } catch (e) { /* ignore */ } };

    setIf('#autocite-speed', (e) => e.value = window.microphoneConfig.autocite.speed);
    setIf('#autocite-speed-val', (e) => e.value = window.microphoneConfig.autocite.speed);
    setIf('#autocite-delay', (e) => e.value = window.microphoneConfig.autocite.delay);
    setIf('#autocite-delay-val', (e) => e.value = window.microphoneConfig.autocite.delay);
    setIf('#autocite-highlight', (e) => e.checked = !!window.microphoneConfig.autocite.highlight);
    setIf('#autocite-loop', (e) => e.checked = !!window.microphoneConfig.autocite.loop);

    // Literal
    setIf('#literal-sameChapter', (e) => e.value = window.microphoneConfig.literal.sameChapter);
    setIf('#literal-sameChapter-val', (e) => e.value = window.microphoneConfig.literal.sameChapter);
    setIf('#literal-sameBook', (e) => e.value = window.microphoneConfig.literal.sameBook);
    setIf('#literal-sameBook-val', (e) => e.value = window.microphoneConfig.literal.sameBook);
    setIf('#literal-otherBook', (e) => e.value = window.microphoneConfig.literal.otherBook);
    setIf('#literal-otherBook-val', (e) => e.value = window.microphoneConfig.literal.otherBook);
    setIf('#literal-caseSensitive', (e) => e.checked = !!window.microphoneConfig.literal.caseSensitive);

    // IA
    setIf('#ia-confidence', (e) => e.value = window.microphoneConfig.ia.confidence);
    setIf('#ia-confidence-val', (e) => e.value = window.microphoneConfig.ia.confidence);
    setIf('#ia-model', (e) => e.value = window.microphoneConfig.ia.model);
    setIf('#ia-timeout', (e) => e.value = window.microphoneConfig.ia.timeout);
    setIf('#ia-timeout-val', (e) => e.value = window.microphoneConfig.ia.timeout);
    setIf('#ia-contextual', (e) => e.checked = !!window.microphoneConfig.ia.contextual);
    setIf('#ia-suggestions', (e) => e.checked = !!window.microphoneConfig.ia.suggestions);
}

function resetMicSettingsToDefaults() {
    // Autocite defaults
    const setIf = (sel, fn) => { const e = document.querySelector(sel); if (!e) return; try { fn(e); } catch (e) {} };
    setIf('#autocite-speed', (e) => e.value = 1);
    setIf('#autocite-speed-val', (e) => e.value = 1);
    setIf('#autocite-delay', (e) => e.value = 500);
    setIf('#autocite-delay-val', (e) => e.value = 500);
    setIf('#autocite-highlight', (e) => e.checked = true);
    setIf('#autocite-loop', (e) => e.checked = true);

    // Literal defaults
    setIf('#literal-sameChapter', (e) => e.value = 5);
    setIf('#literal-sameChapter-val', (e) => e.value = 5);
    setIf('#literal-sameBook', (e) => e.value = 35);
    setIf('#literal-sameBook-val', (e) => e.value = 35);
    setIf('#literal-otherBook', (e) => e.value = 89);
    setIf('#literal-otherBook-val', (e) => e.value = 89);
    setIf('#literal-caseSensitive', (e) => e.checked = false);

    // IA defaults
    setIf('#ia-confidence', (e) => e.value = 70);
    setIf('#ia-confidence-val', (e) => e.value = 70);
    setIf('#ia-model', (e) => e.value = 'groq');
    setIf('#ia-timeout', (e) => e.value = 30);
    setIf('#ia-timeout-val', (e) => e.value = 30);
    setIf('#ia-contextual', (e) => e.checked = true);
    setIf('#ia-suggestions', (e) => e.checked = true);

    showMicNotification('Configurația a fost restituită la valorile implicite');
}

function saveMicSettings() {
    // Guardar Autocite
    const q = sel => document.querySelector(sel);
    window.microphoneConfig.autocite.speed = parseFloat((q('#autocite-speed-val') && q('#autocite-speed-val').value) || window.microphoneConfig.autocite.speed);
    window.microphoneConfig.autocite.delay = parseInt((q('#autocite-delay-val') && q('#autocite-delay-val').value) || window.microphoneConfig.autocite.delay);
    window.microphoneConfig.autocite.highlight = !!(q('#autocite-highlight') && q('#autocite-highlight').checked);
    window.microphoneConfig.autocite.loop = !!(q('#autocite-loop') && q('#autocite-loop').checked);

    localStorage.setItem('mic_autocite_speed', window.microphoneConfig.autocite.speed);
    localStorage.setItem('mic_autocite_delay', window.microphoneConfig.autocite.delay);
    localStorage.setItem('mic_autocite_highlight', window.microphoneConfig.autocite.highlight);
    localStorage.setItem('mic_autocite_loop', window.microphoneConfig.autocite.loop);

    // Guardar Literal
    window.microphoneConfig.literal.sameChapter = parseInt((q('#literal-sameChapter-val') && q('#literal-sameChapter-val').value) || window.microphoneConfig.literal.sameChapter);
    window.microphoneConfig.literal.sameBook = parseInt((q('#literal-sameBook-val') && q('#literal-sameBook-val').value) || window.microphoneConfig.literal.sameBook);
    window.microphoneConfig.literal.otherBook = parseInt((q('#literal-otherBook-val') && q('#literal-otherBook-val').value) || window.microphoneConfig.literal.otherBook);
    window.microphoneConfig.literal.caseSensitive = !!(q('#literal-caseSensitive') && q('#literal-caseSensitive').checked);

    localStorage.setItem('mic_literal_sameChapter', window.microphoneConfig.literal.sameChapter);
    localStorage.setItem('mic_literal_sameBook', window.microphoneConfig.literal.sameBook);
    localStorage.setItem('mic_literal_otherBook', window.microphoneConfig.literal.otherBook);
    localStorage.setItem('mic_literal_caseSensitive', window.microphoneConfig.literal.caseSensitive);

    // Guardar IA
    window.microphoneConfig.ia.confidence = parseInt((q('#ia-confidence-val') && q('#ia-confidence-val').value) || window.microphoneConfig.ia.confidence);
    window.microphoneConfig.ia.model = (q('#ia-model') && q('#ia-model').value) || window.microphoneConfig.ia.model;
    window.microphoneConfig.ia.timeout = parseInt((q('#ia-timeout-val') && q('#ia-timeout-val').value) || window.microphoneConfig.ia.timeout);
    window.microphoneConfig.ia.contextual = !!(q('#ia-contextual') && q('#ia-contextual').checked);
    window.microphoneConfig.ia.suggestions = !!(q('#ia-suggestions') && q('#ia-suggestions').checked);

    localStorage.setItem('mic_ia_confidence', window.microphoneConfig.ia.confidence);
    localStorage.setItem('mic_ia_model', window.microphoneConfig.ia.model);
    localStorage.setItem('mic_ia_timeout', window.microphoneConfig.ia.timeout);
    localStorage.setItem('mic_ia_contextual', window.microphoneConfig.ia.contextual);
    localStorage.setItem('mic_ia_suggestions', window.microphoneConfig.ia.suggestions);

    // Cerrar modal
    document.getElementById('micSettingsModal').classList.remove('active');
    
    // Notificación
    showMicNotification('Configurația a fost salvată cu succes');

    // Disparar evento personalizado para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent('microphoneConfigChanged', {
        detail: window.microphoneConfig
    }));
}

function showMicNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'mic-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(200, 160, 110, 0.95);
        color: #ffffff;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: serif;
        font-size: 14px;
        z-index: 3000;
        animation: slideInUpMic 0.3s ease;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        border-left: 4px solid rgba(255, 255, 255, 0.6);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutDownMic 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar animaciones
const micSettingsStyle = document.createElement('style');
micSettingsStyle.textContent = `
    @keyframes slideInUpMic {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes slideOutDownMic {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }
`;
document.head.appendChild(micSettingsStyle);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeMicSettings, 150);
    });
} else {
    // DOM ya está listo
    setTimeout(initializeMicSettings, 150);
}
