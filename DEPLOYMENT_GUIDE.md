# 🚀 Guía de Deployment — Render.com

La app es ahora un único servicio Next.js (frontend + API routes juntos) — ya no hay un frontend estático separado (GitHub Pages) ni un `config.js` con la URL del backend: todo se sirve desde el mismo dominio.

## Paso 1: Preparar el repositorio

```bash
git add .
git commit -m "Deploy a Render"
git push origin main
```

## Paso 2: Crear el Web Service en Render

1. En https://render.com → **"New +"** → **"Web Service"**.
2. Conecta el repositorio `referencia-biblica`.
3. Render detecta `render.yaml` automáticamente (Blueprint) — o configura a mano:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

`npm run build` genera primero los índices de búsqueda (Biblia + cânturi) a partir de `data/`, y luego compila la app Next.js — no hace falta ningún paso manual adicional.

## Paso 3: Variables de entorno

En **"Environment Variables"**:

- `GROQ_API_KEY` — clave de [console.groq.com/keys](https://console.groq.com/keys), habilita el modo de voz "Autorecunoaște cu IA". Sin ella, ese modo responde "API key not configured" (igual que en desarrollo local).
- `CANTARI_TOKEN` — opcional, token de la API de cantaricrestine.ro para refrescar el catálogo de cânturi en vivo. Sin él se usa el token público por defecto.

Render asigna `PORT` automáticamente; `next start` lo respeta sin configuración adicional.

## Paso 4: Deploy

Al hacer clic en **"Create Web Service"**, Render construye y despliega. Cada `git push` a la rama configurada vuelve a desplegar automáticamente.

## 🔍 Troubleshooting

### "Deploy failed" durante el build
- Revisa los logs: si falla `build:bible-index` o `build:songs-index`, confirma que `data/ron-rccv.usfx.xml` y `data/Pe-Drumul-Credintei.json` están commiteados en el repositorio (no están en `.gitignore`).

### El modo de voz con IA responde "API key not configured"
- Ve a Settings → Environment y confirma que `GROQ_API_KEY` está definida, luego haz "Manual Deploy" para reiniciar con la variable nueva.

### Las cânturi no cargan datos en vivo
- `/api/cantari` cae automáticamente al snapshot estático (`lib/generated/songs.json`) si `cantaricrestine.ro` no responde — la app sigue funcionando, solo sin datos frescos. Revisa `CANTARI_TOKEN` si necesitas la fuente en vivo.

### Primera petición lenta
- Normal en el plan Free: el servicio se "duerme" tras 15 min de inactividad y tarda ~30s en la primera respuesta.
