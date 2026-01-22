// Configuración de la API del backend
// Cambia esta URL después de desplegar en Render.com
const API_CONFIG = {
    // Para desarrollo local, usa: 'http://localhost:8000'
    // Para producción en Render, usa: 'https://tu-app.onrender.com'
    baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://referencia-biblica-api.onrender.com' // ⚠️ CAMBIAR ESTA URL después del deployment
};

console.log('🔧 API Configuration loaded:', API_CONFIG.baseURL);
