# Sistema de Detección Vocálă de Referințe Biblice

## 🎤 Caracteristici

Sistema de reconocimiento de voz continuo que detecta referencias bíblicas en rumano en tiempo real:

- **Escucha Continua**: El sistema nunca para de escuchar, permitiendo detección fluida durante predicaciones o estudios
- **Detección Híbrida**:
  - **RegEx rápido** (~1-2s): Para patrones comunes como "Ioan 3:16" o "Geneza capitolul 1"
  - **IA inteligente** (~5-7s): Para lenguaje natural complejo mediante Groq/Gemini
- **Procesamiento Paralelo**: Múltiples detecciones simultáneas sin bloquear la escucha
- **Deduplicación Inteligente**: Evita mostrar la misma referencia múltiples veces en 10 segundos
- **Historial Persistente**: Guarda las últimas 20 referencias detectadas con timestamps

## 🚀 Configuración

### 1. Instalar Dependencias

El proyecto usa Node.js para el servidor. Asegúrate de tener Node.js instalado.

### 2. Configurar API Key

El sistema necesita una API key de Groq o Gemini para la detección inteligente:

**Opción A: Groq (Recomendado - Ultra Rápido)**
1. Ve a https://console.groq.com/keys
2. Crea una cuenta gratuita
3. Genera una API key
4. Copia `.env.example` a `.env`
5. Agrega tu API key en `.env`:
   ```
   GROQ_API_KEY=gsk_tu_api_key_aqui
   ```

**Opción B: Google Gemini (Gratis con límites)**
1. Ve a https://makersuite.google.com/app/apikey
2. Genera una API key
3. Configura en `.env`:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=tu_api_key_aqui
   ```

### 3. Iniciar el Servidor

```bash
node server.js
```

El servidor correrá en http://localhost:8000

### 4. Permisos del Navegador

Al hacer clic en "Pornește Ascultarea", el navegador pedirá permiso para acceder al micrófono. Acepta el permiso.

## 📝 Uso

### Patrones Soportados

El sistema reconoce múltiples formas de mencionar referencias:

**Patrones Rápidos (RegEx - instantáneo):**
- "Ioan 3:16"
- "Geneza 1:1"
- "Geneza capitolul 1 versetul 1"
- "capitolul 3 din Ioan"

**Patrones con IA (5-7 segundos):**
- "evangelio după Ioan capitolul trei verso șaisprezece"
- "primul verset din cartea Geneza"
- "în cartea lui Iacov capitolul doi"

### Flujo de Trabajo

1. Haz clic en **"🎤 Detectare Vocală"** desde la pantalla principal
2. Haz clic en **"Pornește Ascultarea"**
3. Habla naturalmente mencionando referencias bíblicas
4. Las referencias detectadas aparecerán automáticamente
5. Haz clic en cualquier referencia del historial para ver el texto completo

### Indicadores Visuales

- 🎤 **Gris**: Micrófono inactivo
- 🎤 **Animado**: Escuchando activamente
- ⏳ **Procesare...**: Analizando con IA
- ✅ **Referencia mostrada**: Detección exitosa

## 🔧 Configuración Avanzada

### Ajustar Límites de Concurrencia

En `components/screen-voice.js`, línea 11:

```javascript
maxConcurrentRequests: 3,  // Máximo 3 requests de IA simultáneos
```

Aumenta si tienes una conexión rápida y quieres procesar más en paralelo.

### Ajustar Cache de Deduplicación

En `components/screen-voice.js`, función `handleDetectedReference`:

```javascript
if (now - lastTime < 10000) {  // 10 segundos
```

Cambia `10000` (milisegundos) al tiempo que prefieras.

### Cambiar Idioma de Reconocimiento

En `components/screen-voice.js`, función `initVoiceScreen`:

```javascript
voiceState.recognition.lang = 'ro-RO';  // Rumano
```

Opciones:
- `'ro-RO'`: Rumano de Rumanía
- `'ro-MD'`: Rumano de Moldavia
- `'es-ES'`: Español
- `'en-US'`: Inglés

## 🐛 Solución de Problemas

### "Browserul nu suportă recunoașterea vocală"

- **Solución**: Usa Chrome o Edge (versión actualizada)
- Safari tiene soporte limitado en iOS

### "Eroare la pornirea microfonului"

- **Causa**: Permisos denegados
- **Solución**: Ve a configuración del navegador → Permisos → Micrófono → Permitir para localhost

### La IA no detecta referencias

1. **Verifica la API key**:
   - Asegúrate de que tu API key esté correctamente configurada en `server.js`
   - Mira la consola del servidor para errores

2. **Revisa el límite de requests**:
   - Groq: 30 req/min en plan gratuito
   - Gemini: 15 req/min gratis

3. **Verifica la conexión**:
   - Abre la consola del navegador (F12) para ver errores de red

### Referencias duplicadas

- El sistema tiene un cache de 10 segundos
- Si mencionas la misma referencia muy seguido, se ignorarán las duplicadas
- Esto es intencional para evitar saturar la UI

## 📊 Rendimiento

### Tiempos Esperados

| Escenario | Tiempo | Método |
|-----------|--------|--------|
| "Ioan 3:16" | 1-2s | RegEx |
| "Geneza capitolul 1" | 1-3s | RegEx |
| "evangelio după Ioan trei" | 5-7s | IA (Groq) |
| "primul capitol din Geneza" | 6-8s | IA (Gemini) |

### Costos de API

**Groq:**
- $0.10 por 1M tokens de entrada
- Una detección usa ~100-200 tokens
- ~5,000-10,000 detecciones por $1

**Gemini:**
- Gratis hasta 15 requests/minuto
- Suficiente para uso personal/pequeñas congregaciones

## 🎯 Casos de Uso

### 1. Predicación en Vivo
- El pastor predica y menciona versículos
- La congregación ve las referencias en pantalla en tiempo real
- Pueden seguir en sus Biblias o en la app

### 2. Estudio Bíblico Grupal
- Alguien lee en voz alta
- Las referencias se detectan automáticamente
- El grupo puede ver el texto completo

### 3. Grabaciones
- Reproduce un sermón grabado
- El sistema detecta las referencias mencionadas
- Útil para revisar o tomar notas

## 🔒 Privacidad y Seguridad

- **Audio**: Procesado localmente en el navegador (Web Speech API)
- **Transcripción**: Solo texto se envía al servidor
- **API Keys**: Guardadas en el servidor, nunca expuestas al cliente
- **Sin almacenamiento**: Las transcripciones no se guardan en ningún lado

## 📄 Estructura de Archivos

```
components/
  ├── screen-voice.html      # UI de la pantalla de voz
  ├── screen-voice.css       # Estilos
  └── screen-voice.js        # Lógica de reconocimiento
server.js                    # Backend con endpoints de IA
.env                         # Configuración de API keys (no incluido)
.env.example                 # Plantilla de configuración
```

## 🤝 Contribuir

Si encuentras bugs o tienes sugerencias, por favor:
1. Abre un issue describiendo el problema
2. Incluye logs de la consola si es posible
3. Menciona el navegador y sistema operativo

## 📜 Licencia

Este proyecto es parte de la aplicación de Referencia Bíblica de Biserica Betel Bilbao.
