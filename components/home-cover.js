// ============================================
// Home Cover Component - Portada Principal
// ============================================

// Lista de versículos conocidos en rumano
const knownVerses = [
    {
        text: "Cu Dumnezeu sunt toți în pace, iar fără El nu este nici o pace.",
        reference: "Ioan 14:27"
    },
    {
        text: "Iubirea nu țintește rău; iubirea nu-și caută interesul, ci al celorlalți.",
        reference: "1 Corinteni 13:4-5"
    },
    {
        text: "Cred, deci înțeleg. Căci dacă nu cred, nici nu voi înțelege.",
        reference: "Psalmi 27:10"
    },
    {
        text: "Domnul este pastorul meu, nu mă va lipsi de nimic.",
        reference: "Psalmi 23:1"
    },
    {
        text: "Ies din lume, vin înspre Dumnezeu și-I cad în genunchi.",
        reference: "Psalmul 42:5"
    },
    {
        text: "Noi trăim prin credință, nu prin vedere.",
        reference: "2 Corinteni 5:7"
    },
    {
        text: "Dragostea apei nu-și găsește locul în ființa celui ce teme pe Domnul.",
        reference: "Proverbe 21:21"
    },
    {
        text: "Domnul este lumina mea și mântuirea mea.",
        reference: "Psalmi 27:1"
    },
    {
        text: "Fii puternic și nădăjduiește în Domnul.",
        reference: "Psalmi 27:14"
    },
    {
        text: "Cu cât mai mult ne apropiem de Dumnezeu, cu atât mai puțin ne teme.",
        reference: "1 Ioan 4:18"
    },
    {
        text: "Binecuvântat fie Domnul, că m-a ascultat pe mine.",
        reference: "Psalmi 118:21"
    },
    {
        text: "Cine crede în Fiul are viața veșnică.",
        reference: "Ioan 3:36"
    },
    {
        text: "Sărutări pline de iubire pe toți voi în Hristos Isus.",
        reference: "1 Petru 5:14"
    },
    {
        text: "Iertarea vine din iubire, iar iubirea vine din Dumnezeu.",
        reference: "1 Ioan 4:7"
    },
    {
        text: "Nu voi fi niciodată singur, pentru că Dumnezeu este cu mine.",
        reference: "Matei 28:20"
    }
];

function initializeHomeCover() {
    const startBtn = document.getElementById('start-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            navigateToReference();
        });
    }

    // Mostrar versículo aleatorio
    displayRandomVerse();

    // Cambiar versículo cada 10 segundos
    window.verseAutoRotateInterval = setInterval(displayRandomVerse, 10000);

    // También permitir click en el botón Referință del menú
    const refBtn = document.querySelector('[data-screen="screen-selection"]');
    if (refBtn) {
        refBtn.addEventListener('click', () => {
            // El menú se encarga de esto
        });
    }
}

function displayRandomVerse() {
    const randomIndex = Math.floor(Math.random() * knownVerses.length);
    const verse = knownVerses[randomIndex];

    const verseText = document.getElementById('random-verse');
    const verseRef = document.getElementById('verse-reference');

    if (verseText && verseRef) {
        // Agregar animación de fade out
        verseText.style.opacity = '0';
        verseRef.style.opacity = '0';

        setTimeout(() => {
            verseText.textContent = `"${verse.text}"`;
            verseRef.textContent = verse.reference;

            // Fade in
            verseText.style.opacity = '1';
            verseRef.style.opacity = '1';
        }, 300);
    }
}

function navigateToReference() {
    // Obtener el botón de Referință y simular click
    const referenceBtn = document.querySelector('[data-screen="screen-selection"]');
    if (referenceBtn) {
        referenceBtn.click();
    }
}

function stopVerseAutoRotation() {
    if (window.verseAutoRotateInterval) {
        clearInterval(window.verseAutoRotateInterval);
        window.verseAutoRotateInterval = null;
    }
}

function startVerseAutoRotation() {
    if (window.verseAutoRotateInterval) return;
    displayRandomVerse();
    window.verseAutoRotateInterval = setInterval(displayRandomVerse, 10000);
}

// Agregar transición de opacidad
const verseStyle = document.createElement('style');
verseStyle.textContent = `
    #random-verse,
    #verse-reference {
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(verseStyle);

// Cargar HTML del componente (fallback si no se cargó via template)
async function loadHomeCoverHTML() {
    // Verificar si el template ya fue inyectado
    const container = document.getElementById('home-cover');
    if (container && container.innerHTML.trim() !== '') {
        // Ya fue inyectado via template
        return;
    }
    
    // Fallback: cargar si no está presente
    try {
        const response = await fetch('components/home-cover.html');
        const html = await response.text();
        
        // Extraer el contenido dentro del template
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const template = wrapper.querySelector('template');
        if (template) {
            const content = template.innerHTML;
            if (container) {
                container.innerHTML = content;
            }
        }
    } catch (error) {
        console.error('Error loading home-cover.html:', error);
    }
}

// Inicializar cuando el componente esté visible
async function initializeHomeCoverComponent() {
    await loadHomeCoverHTML();
    setTimeout(initializeHomeCover, 200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeHomeCoverComponent();
    });
} else {
    // DOM ya está listo
    initializeHomeCoverComponent();
}
