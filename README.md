# Referință Biblică

Aplicație Next.js (App Router, TypeScript) pentru lectura Bibliei în română, cu recunoaștere vocală a referințelor (literal / IA / Autocitire) și un catalog de cântări "Pe Drumul Credinței" — Biserica Betel Bilbao.

## Funcționalități

- **Acasă** (`/`) — pagină de întâmpinare cu un verset aleatoriu.
- **Referință** (`/biblia`) — selectare Carte/Capitol/Verset.
- **Lectură** (`/biblia/leer/[book]/[chapter]/[verse]`) — text din [bible-api.com](https://bible-api.com), navigare cu tastatura, referință editabilă direct pe ecran, și widget-ul de microfon (3 moduri: recunoaștere literală, cu IA, Autocitire).
- **Cântări** (`/cantari`) — căutare și citire a celor ~440 de cântări.

## Dezvoltare locală

```powershell
npm install

# Generează indexul de căutare al Bibliei (din data/ron-rccv.usfx.xml) și al
# cântărilor (din data/Pe-Drumul-Credintei.json) — o singură dată, sau după
# ce actualizezi datele sursă:
npm run build:indexes

npm run dev
# deschide http://localhost:3000
```

Pentru modul de detectare vocală cu IA, copiază `.env.local.example` ca `.env.local` și completează `GROQ_API_KEY` ([console.groq.com/keys](https://console.groq.com/keys)).

## Structură

```
app/            rute (App Router)
components/     componente React, organizate pe funcționalitate
hooks/          logică cu stare (motorul de voce, ajustările de microfon, indexul Bibliei)
lib/            date/utilitare fără stare (structura Bibliei, căutare, parsare text românesc)
scripts/        generatoare de index (rulează la build, ieșirea e ignorată de git)
data/           surse brute (XML-ul Bibliei, JSON-ul de cântări)
```

## Build de producție

```powershell
npm run build
npm start
```

Vezi [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) pentru desfășurare pe Render.
