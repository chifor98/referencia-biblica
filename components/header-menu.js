// ============================================
// Header Menu Component - Gestión de Navegación
// ============================================

function initializeHeaderMenu() {
    // Use event delegation and live queries so this remains correct after templates are injected/replaced
    const menuBar = document.querySelector('.menu-bar');
    if (!menuBar) return;

    menuBar.addEventListener('click', (ev) => {
        const btn = ev.target.closest && ev.target.closest('.menu-btn');
        if (!btn) return;

        const screenId = btn.getAttribute('data-screen');

        // Remove active from all buttons (live query) and any visible screens
        document.querySelectorAll('.menu-bar .menu-btn.active').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));

        // Activate the clicked button
        btn.classList.add('active');

        // Find target screen by id at click time (in case templates were replaced)
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');

            // Reanudar o parar rotación de versículos según corresponda
            if (screenId === 'home-cover') {
                if (typeof startVerseAutoRotation === 'function') {
                    setTimeout(() => startVerseAutoRotation(), 100);
                }
            } else if (screenId === 'screen-selection') {
                if (typeof stopVerseAutoRotation === 'function') {
                    stopVerseAutoRotation();
                }
            }
        } else {
            // If the target screen does not exist, keep current state and log for debugging
            console.warn('Target screen not found for', screenId);
        }
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar a que las plantillas estén cargadas
        setTimeout(initializeHeaderMenu, 150);
    });
} else {
    // DOM ya está listo
    setTimeout(initializeHeaderMenu, 150);
}

