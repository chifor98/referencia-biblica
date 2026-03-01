// ============================================
// Header Menu Component - Robust Navigation Manager
// ============================================

const NavigationManager = (function () {
        let templatesReady = false;
        let pendingNav = null;

        function ensureTemplatesReady(timeout = 800) {
            if (templatesReady) return Promise.resolve();
            return new Promise((resolve) => {
                const onInjected = () => {
                    templatesReady = true;
                    document.removeEventListener('screens-injected', onInjected);
                    resolve();
                };
                document.addEventListener('screens-injected', onInjected);
                // fallback: resolve after timeout to avoid permanent hang
                setTimeout(() => {
                    templatesReady = templatesReady || false;
                    resolve();
                }, timeout);
            });
        }

        // Activate a screen element and the corresponding menu button
        function activateScreen(screenId, invokingButton) {
            try {
                console.log('NavigationManager: activating screen', screenId);
                // hide other screens
                document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));
                // unset active on buttons
                document.querySelectorAll('.menu-bar .menu-btn.active').forEach(b => {
                    b.classList.remove('active');
                    b.removeAttribute('aria-current');
                });

                // find target screen and show it
                const targetScreen = document.getElementById(screenId);
                if (targetScreen) targetScreen.classList.add('active');

                // mark invoking button active (if provided) else find button by data-screen
                let btn = invokingButton;
                if (!btn) btn = document.querySelector(`.menu-bar .menu-btn[data-screen="${screenId}"]`);
                if (btn) {
                    btn.classList.add('active');
                    btn.setAttribute('aria-current', 'page');
                    // keep focus for keyboard users
                    try { btn.focus(); } catch (e) { /* ignore */ }
                }

                // custom behavior hooks
                if (screenId === 'home-cover') {
                    if (typeof startVerseAutoRotation === 'function') setTimeout(() => startVerseAutoRotation(), 100);
                } else {
                    if (typeof stopVerseAutoRotation === 'function') stopVerseAutoRotation();
                }
            } catch (e) {
                console.warn('activateScreen error', e);
            }
        }

        async function navigate(screenId, invokingButton) {
            if (!screenId) return;
            // wait briefly for templates if needed
            console.log('NavigationManager: navigate requested', screenId);
            await ensureTemplatesReady();

            // If screen still not present, try to reapply templates once (best-effort)
            if (!document.getElementById(screenId) && typeof applyScreenTemplates === 'function') {
                try { applyScreenTemplates(); } catch (e) { /* ignore */ }
            }

            if (!document.getElementById(screenId)) {
                console.warn('Navigation failed: screen not found', screenId);
                return;
            }

            activateScreen(screenId, invokingButton);
        }

        function init() {
            // watch for screens-injected event to mark readiness
            document.addEventListener('screens-injected', () => { templatesReady = true; if (pendingNav) { const p = pendingNav; pendingNav = null; navigate(p.screenId, p.btn); } });

            // attach delegated click handler to the menu bar
            const menuBar = document.querySelector('.menu-bar');
            if (menuBar) {
                menuBar.addEventListener('click', (ev) => {
                    const btn = ev.target.closest && ev.target.closest('.menu-btn');
                    if (!btn) return;
                    console.log('NavigationManager: menu click', btn.getAttribute('data-screen'));
                    ev.preventDefault();
                    const screenId = btn.getAttribute('data-screen');
                    if (!screenId) return;
                    // if not ready, store pending navigation
                    if (!templatesReady) {
                        pendingNav = { screenId, btn };
                        // attempt to trigger templates application as a fallback
                        try { if (typeof applyScreenTemplates === 'function') applyScreenTemplates(); } catch (e) { /* ignore */ }
                        return;
                    }
                    navigate(screenId, btn);
                });

                // keyboard navigation: left/right arrow to move between menu buttons
                menuBar.addEventListener('keydown', (ev) => {
                    const btns = Array.from(menuBar.querySelectorAll('.menu-btn'));
                    const active = document.activeElement;
                    const idx = btns.indexOf(active);
                    if (ev.key === 'ArrowRight') {
                        ev.preventDefault(); const next = btns[Math.min(btns.length - 1, Math.max(0, idx + 1))]; if (next) next.focus();
                    } else if (ev.key === 'ArrowLeft') {
                        ev.preventDefault(); const prev = btns[Math.max(0, idx - 1)]; if (prev) prev.focus();
                    } else if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault(); const btn = active.closest && active.closest('.menu-btn'); if (btn) btn.click();
                    }
                });
            }

            // mark initial state if a button was already active in DOM
            const preActive = document.querySelector('.menu-bar .menu-btn.active');
            if (preActive) {
                const screenId = preActive.getAttribute('data-screen');
                // attempt to navigate to that screen after templates ready
                pendingNav = { screenId, btn: preActive };
                setTimeout(() => { if (templatesReady) { navigate(screenId, preActive); } }, 120);
            }
        }

        return { init, navigate };
    })();

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { NavigationManager.init(); });
    } else {
        NavigationManager.init();
    }

