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

function initializeMicSettings() {
    const settingsBtn = document.querySelector('.settings-btn');
    const micSettingsModal = document.getElementById('micSettingsModal');
    const closeMicBtn = document.querySelector('.mic-settings-close');
    
    if (!settingsBtn || !micSettingsModal) return;

    // Abrir modal al hacer clic en el engranaje
    settingsBtn.addEventListener('click', () => {
        micSettingsModal.classList.add('active');
        // Cargar valores actuales
        loadMicSettingsValues();
    });

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
    // Autocite
    document.querySelector('#autocite-speed').value = window.microphoneConfig.autocite.speed;
    document.querySelector('#autocite-speed-val').value = window.microphoneConfig.autocite.speed;
    document.querySelector('#autocite-delay').value = window.microphoneConfig.autocite.delay;
    document.querySelector('#autocite-delay-val').value = window.microphoneConfig.autocite.delay;
    document.querySelector('#autocite-highlight').checked = window.microphoneConfig.autocite.highlight;
    document.querySelector('#autocite-loop').checked = window.microphoneConfig.autocite.loop;

    // Literal
    document.querySelector('#literal-sameChapter').value = window.microphoneConfig.literal.sameChapter;
    document.querySelector('#literal-sameChapter-val').value = window.microphoneConfig.literal.sameChapter;
    document.querySelector('#literal-sameBook').value = window.microphoneConfig.literal.sameBook;
    document.querySelector('#literal-sameBook-val').value = window.microphoneConfig.literal.sameBook;
    document.querySelector('#literal-otherBook').value = window.microphoneConfig.literal.otherBook;
    document.querySelector('#literal-otherBook-val').value = window.microphoneConfig.literal.otherBook;
    document.querySelector('#literal-caseSensitive').checked = window.microphoneConfig.literal.caseSensitive;

    // IA
    document.querySelector('#ia-confidence').value = window.microphoneConfig.ia.confidence;
    document.querySelector('#ia-confidence-val').value = window.microphoneConfig.ia.confidence;
    document.querySelector('#ia-model').value = window.microphoneConfig.ia.model;
    document.querySelector('#ia-timeout').value = window.microphoneConfig.ia.timeout;
    document.querySelector('#ia-timeout-val').value = window.microphoneConfig.ia.timeout;
    document.querySelector('#ia-contextual').checked = window.microphoneConfig.ia.contextual;
    document.querySelector('#ia-suggestions').checked = window.microphoneConfig.ia.suggestions;
}

function resetMicSettingsToDefaults() {
    // Autocite defaults
    document.querySelector('#autocite-speed').value = 1;
    document.querySelector('#autocite-speed-val').value = 1;
    document.querySelector('#autocite-delay').value = 500;
    document.querySelector('#autocite-delay-val').value = 500;
    document.querySelector('#autocite-highlight').checked = true;
    document.querySelector('#autocite-loop').checked = true;

    // Literal defaults
    document.querySelector('#literal-sameChapter').value = 5;
    document.querySelector('#literal-sameChapter-val').value = 5;
    document.querySelector('#literal-sameBook').value = 35;
    document.querySelector('#literal-sameBook-val').value = 35;
    document.querySelector('#literal-otherBook').value = 89;
    document.querySelector('#literal-otherBook-val').value = 89;
    document.querySelector('#literal-caseSensitive').checked = false;

    // IA defaults
    document.querySelector('#ia-confidence').value = 70;
    document.querySelector('#ia-confidence-val').value = 70;
    document.querySelector('#ia-model').value = 'groq';
    document.querySelector('#ia-timeout').value = 30;
    document.querySelector('#ia-timeout-val').value = 30;
    document.querySelector('#ia-contextual').checked = true;
    document.querySelector('#ia-suggestions').checked = true;

    showMicNotification('Configurația a fost restituită la valorile implicite');
}

function saveMicSettings() {
    // Guardar Autocite
    window.microphoneConfig.autocite.speed = parseFloat(document.querySelector('#autocite-speed-val').value);
    window.microphoneConfig.autocite.delay = parseInt(document.querySelector('#autocite-delay-val').value);
    window.microphoneConfig.autocite.highlight = document.querySelector('#autocite-highlight').checked;
    window.microphoneConfig.autocite.loop = document.querySelector('#autocite-loop').checked;

    localStorage.setItem('mic_autocite_speed', window.microphoneConfig.autocite.speed);
    localStorage.setItem('mic_autocite_delay', window.microphoneConfig.autocite.delay);
    localStorage.setItem('mic_autocite_highlight', window.microphoneConfig.autocite.highlight);
    localStorage.setItem('mic_autocite_loop', window.microphoneConfig.autocite.loop);

    // Guardar Literal
    window.microphoneConfig.literal.sameChapter = parseInt(document.querySelector('#literal-sameChapter-val').value);
    window.microphoneConfig.literal.sameBook = parseInt(document.querySelector('#literal-sameBook-val').value);
    window.microphoneConfig.literal.otherBook = parseInt(document.querySelector('#literal-otherBook-val').value);
    window.microphoneConfig.literal.caseSensitive = document.querySelector('#literal-caseSensitive').checked;

    localStorage.setItem('mic_literal_sameChapter', window.microphoneConfig.literal.sameChapter);
    localStorage.setItem('mic_literal_sameBook', window.microphoneConfig.literal.sameBook);
    localStorage.setItem('mic_literal_otherBook', window.microphoneConfig.literal.otherBook);
    localStorage.setItem('mic_literal_caseSensitive', window.microphoneConfig.literal.caseSensitive);

    // Guardar IA
    window.microphoneConfig.ia.confidence = parseInt(document.querySelector('#ia-confidence-val').value);
    window.microphoneConfig.ia.model = document.querySelector('#ia-model').value;
    window.microphoneConfig.ia.timeout = parseInt(document.querySelector('#ia-timeout-val').value);
    window.microphoneConfig.ia.contextual = document.querySelector('#ia-contextual').checked;
    window.microphoneConfig.ia.suggestions = document.querySelector('#ia-suggestions').checked;

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
