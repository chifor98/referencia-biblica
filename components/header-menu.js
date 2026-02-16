// ============================================
// Header Menu Component - Gestión de Navegación
// ============================================

function initializeHeaderMenu() {
    const menuBtns = document.querySelectorAll('.menu-btn');
    const screens = document.querySelectorAll('.screen');

    // Navegación de menú
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.getAttribute('data-screen');
            
            // Remover clase active de todos los botones y pantallas
            menuBtns.forEach(b => b.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));
            
            // Agregar clase active al botón y pantalla seleccionados
            btn.classList.add('active');
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active');
                
                // Reanudar la rotación de versículos si volvemos a home-cover
                if (screenId === 'home-cover') {
                    if (typeof startVerseAutoRotation === 'function') {
                        setTimeout(() => startVerseAutoRotation(), 100);
                    }
                } else if (screenId === 'screen-selection') {
                    // Parar la rotación de versículos
                    if (typeof stopVerseAutoRotation === 'function') {
                        stopVerseAutoRotation();
                    }
                }
            }
        });
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

