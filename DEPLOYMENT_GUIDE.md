# 🚀 Guía de Deployment - Backend en Render.com

## Paso 1: Preparar el Repositorio

1. Asegúrate de que todos los cambios estén commiteados en GitHub:
```bash
git add .
git commit -m "Preparar backend para Render deployment"
git push origin main
```

## Paso 2: Crear Cuenta en Render.com

1. Ve a https://render.com
2. Haz clic en "Get Started for Free"
3. Regístrate con tu cuenta de GitHub

## Paso 3: Crear Nuevo Web Service

1. En el dashboard de Render, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub:
   - Haz clic en "Connect Account" si es la primera vez
   - Busca tu repositorio `referencia-biblica`
   - Haz clic en **"Connect"**

## Paso 4: Configurar el Service

Completa el formulario con estos valores:

- **Name**: `referencia-biblica-api` (o el nombre que prefieras)
- **Region**: Selecciona la más cercana (ej: Frankfurt para Europa)
- **Branch**: `main`
- **Root Directory**: (déjalo vacío)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Selecciona **"Free"** ($0/mes)

## Paso 5: Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

1. Haz clic en **"Add Environment Variable"**
2. Agrega tu API key de Groq:
   - **Key**: `GROQ_API_KEY`
   - **Value**: (pega tu API key de https://console.groq.com/keys)

3. (Opcional) Si usas Gemini, agrega también:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: (tu API key de Gemini)

## Paso 6: Deploy

1. Haz clic en **"Create Web Service"** al final de la página
2. Render comenzará a desplegar tu aplicación (toma 2-3 minutos)
3. Verás los logs en tiempo real

## Paso 7: Obtener la URL del Backend

Una vez que el deployment esté completo:

1. En la parte superior verás la URL de tu servicio, algo como:
   ```
   https://referencia-biblica-api.onrender.com
   ```
2. **Copia esta URL completa**

## Paso 8: Actualizar el Frontend

1. Abre el archivo `config.js` en tu proyecto
2. Reemplaza la URL del backend:
   ```javascript
   baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
       ? 'http://localhost:8000'
       : 'https://TU-URL-DE-RENDER.onrender.com' // ⚠️ Pega aquí la URL
   ```

3. Guarda y sube los cambios a GitHub:
   ```bash
   git add config.js
   git commit -m "Actualizar URL del backend"
   git push origin main
   ```

## Paso 9: Verificar

1. Espera 1-2 minutos a que GitHub Pages se actualice
2. Abre tu app en GitHub Pages
3. Prueba la detección por voz
4. Ya no deberías ver el error 405

## 📝 Notas Importantes

- **Plan Free de Render**: El servicio se "duerme" después de 15 minutos de inactividad. La primera petición después puede tardar ~30 segundos en responder.
- **Límites**: 750 horas gratis al mes (suficiente si solo la usas tú)
- **Logs**: Puedes ver los logs en tiempo real desde el dashboard de Render
- **Updates**: Cada vez que hagas `git push`, Render automáticamente redesplegarᾠel backend

## 🔍 Troubleshooting

### El servicio dice "Deploy failed"
- Revisa los logs en Render
- Asegúrate de que `package.json` tiene el script `"start": "node server.js"`

### Error "GROQ_API_KEY is not defined"
- Ve a Settings → Environment en Render
- Verifica que agregaste la variable `GROQ_API_KEY`
- Haz un "Manual Deploy" para reiniciar con las nuevas variables

### El frontend sigue dando error 405
- Verifica que actualizaste `config.js` con la URL correcta de Render
- Haz `git push` para subir los cambios a GitHub
- Espera 1-2 minutos a que GitHub Pages se actualice

### La primera petición es muy lenta
- Es normal en el plan Free. El servicio se "despierta" automáticamente.
- Después de la primera petición, funciona rápido.

## 🎉 ¡Listo!

Tu backend está desplegado en Render y tu frontend en GitHub Pages puede comunicarse con él.
