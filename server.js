// Simple HTTP server to serve the Bible app locally
require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml'
};

// Configuración de API (crea un archivo .env o define aquí tu API key)
// Para Groq: https://console.groq.com/keys
// Para Gemini: https://makersuite.google.com/app/apikey
const AI_CONFIG = {
    provider: 'groq', // 'groq' o 'gemini'
    groqApiKey: process.env.GROQ_API_KEY || 'TU_API_KEY_AQUI',
    geminiApiKey: process.env.GEMINI_API_KEY || ''
};

const server = http.createServer((req, res) => {
    // API endpoint para detección de referencias con IA
    if (req.url === '/api/detect-reference' && req.method === 'POST') {
        handleAIRequest(req, res);
        return;
    }

    // API endpoint para análisis contextual con IA
    if (req.url === '/api/analyze-verse' && req.method === 'POST') {
        handleAIAnalysis(req, res);
        return;
    }

    // Servir archivos estáticos
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// ===== MANEJO DE REQUESTS DE IA =====
function handleAIRequest(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const text = data.text;

            if (!text) {
                sendJSON(res, 400, { success: false, error: 'No text provided' });
                return;
            }

            // Llamar a la IA según el proveedor configurado
            if (AI_CONFIG.provider === 'groq') {
                detectWithGroq(text, res);
            } else if (AI_CONFIG.provider === 'gemini') {
                detectWithGemini(text, res);
            } else {
                sendJSON(res, 500, { success: false, error: 'Invalid AI provider' });
            }
        } catch (error) {
            console.error('Error parsing request:', error);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
        }
    });
}

// ===== DETECCIÓN CON GROQ (Llama 3.1) =====
function detectWithGroq(text, res) {
    const apiKey = AI_CONFIG.groqApiKey;

    if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
        console.warn('⚠️ Groq API key not configured. Set GROQ_API_KEY environment variable.');
        sendJSON(res, 200, { success: false, error: 'API key not configured' });
        return;
    }

    const prompt = `Analizează următorul text în limba română și identifică o referință biblică dacă există.
Returnează DOAR un JSON valid cu formatul: {"carte": "Geneza", "capitol": 1, "verset": 1}
Dacă nu există nicio referință biblică, returnează: {"carte": null}

FORMATE ACCEPTATE ÎN ROMÂNĂ:
- "Geneza 2:5" sau "Ioan 3:16" (cu două puncte)
- "Geneza 2 cu 5" (cu = cu/con, format popular românesc)
- "Geneza capitolul 2 versetul 5"
- "capitolul 2 din Geneza"

Cărți valide: Geneza, Exodul, Leviticul, Numeri, Deuteronomul, Iosua, Judecători, Rut, 1 Samuel, 2 Samuel, 1 Împărați, 2 Împărați, 1 Cronici, 2 Cronici, Ezra, Neemia, Estera, Iov, Psalmii, Proverbele, Eclesiastul, Cântarea Cântărilor, Isaia, Ieremia, Plângerile lui Ieremia, Ezechiel, Daniel, Osea, Ioel, Amos, Obadia, Iona, Mica, Naum, Habacuc, Țefania, Hagai, Zaharia, Maleahi, Matei, Marcu, Luca, Ioan, Faptele Apostolilor, Romani, 1 Corinteni, 2 Corinteni, Galateni, Efeseni, Filipeni, Coloseni, 1 Tesaloniceni, 2 Tesaloniceni, 1 Timotei, 2 Timotei, Tit, Filimon, Evrei, Iacov, 1 Petru, 2 Petru, 1 Ioan, 2 Ioan, 3 Ioan, Iuda, Apocalipsa

Text: "${text}"`;

    const requestData = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100
    });

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    makeHTTPSRequest(options, requestData, (error, response) => {
        if (error) {
            console.error('Groq API error:', error);
            sendJSON(res, 200, { success: false, error: error.message });
            return;
        }

        try {
            const content = response.choices[0].message.content.trim();
            const parsed = JSON.parse(content);

            if (parsed.carte && parsed.capitol && parsed.verset) {
                sendJSON(res, 200, {
                    success: true,
                    reference: {
                        book: parsed.carte,
                        chapter: parsed.capitol,
                        verse: parsed.verset
                    }
                });
            } else {
                sendJSON(res, 200, { success: false });
            }
        } catch (parseError) {
            console.error('Error parsing Groq response:', parseError);
            sendJSON(res, 200, { success: false });
        }
    });
}

// ===== DETECCIÓN CON GEMINI =====
function detectWithGemini(text, res) {
    const apiKey = AI_CONFIG.geminiApiKey;

    if (!apiKey) {
        console.warn('⚠️ Gemini API key not configured.');
        sendJSON(res, 200, { success: false, error: 'API key not configured' });
        return;
    }

    const prompt = `Analizează următorul text în limba română și identifică o referință biblică dacă există.
Returnează DOAR un JSON valid cu formatul: {"carte": "Geneza", "capitol": 1, "verset": 1}
Dacă nu există nicio referință biblică, returnează: {"carte": null}

FORMATE ACCEPTATE ÎN ROMÂNĂ:
- "Geneza 2:5" sau "Ioan 3:16" (cu două puncte)
- "Geneza 2 cu 5" (cu = cu/con, format popular românesc)
- "Geneza capitolul 2 versetul 5"
- "capitolul 2 din Geneza"

Text: "${text}"`;

    const requestData = JSON.stringify({
        contents: [{
            parts: [{ text: prompt }]
        }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    makeHTTPSRequest(options, requestData, (error, response) => {
        if (error) {
            console.error('Gemini API error:', error);
            sendJSON(res, 200, { success: false, error: error.message });
            return;
        }

        try {
            const content = response.candidates[0].content.parts[0].text.trim();
            const parsed = JSON.parse(content);

            if (parsed.carte && parsed.capitol && parsed.verset) {
                sendJSON(res, 200, {
                    success: true,
                    reference: {
                        book: parsed.carte,
                        chapter: parsed.capitol,
                        verse: parsed.verset
                    }
                });
            } else {
                sendJSON(res, 200, { success: false });
            }
        } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            sendJSON(res, 200, { success: false });
        }
    });
}

// ===== UTILIDADES =====
function makeHTTPSRequest(options, data, callback) {
    const req = https.request(options, (response) => {
        let body = '';

        response.on('data', chunk => {
            body += chunk;
        });

        response.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                callback(null, parsed);
            } catch (error) {
                callback(error);
            }
        });
    });

    req.on('error', callback);
    req.write(data);
    req.end();
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// ===== ANÁLISIS CONTEXTUAL CON IA =====
function handleAIAnalysis(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const transcript = data.transcript;

            if (!transcript) {
                sendJSON(res, 400, { success: false, error: 'No transcript provided' });
                return;
            }

            console.log('🤖 AI Analysis request for:', transcript.substring(0, 100) + '...');

            // Llamar a la IA según el proveedor configurado
            if (AI_CONFIG.provider === 'groq') {
                analyzeWithGroq(transcript, res);
            } else if (AI_CONFIG.provider === 'gemini') {
                analyzeWithGemini(transcript, res);
            } else {
                sendJSON(res, 500, { success: false, error: 'Invalid AI provider' });
            }
        } catch (error) {
            console.error('Error parsing request:', error);
            sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
        }
    });
}

// Analizar transcript con Groq para identificar versículo por contexto
function analyzeWithGroq(transcript, res) {
    const apiKey = AI_CONFIG.groqApiKey;

    if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
        console.warn('⚠️ Groq API key not configured');
        sendJSON(res, 200, { success: false, error: 'API key not configured' });
        return;
    }

    const prompt = `Ești expert în Biblie și recunoști versete din context sau fragmente citate în limba română.

Text:
"${transcript}"

EXEMPLE DE RECUNOAȘTERE:
- "atât de mult a iubit Dumnezeu lumea" → Ioan 3:16
- "la început a creat Dumnezeu cerurile și pământul" → Geneza 1:1
- "Domnul este păstorul meu" → Psalmi 23:1
- "cerurile spun slava lui Dumnezeu" → Psalmi 19:1
- "nu cu putere, ci cu Duhul Meu" → Zaharia 4:6
- "dragostea este răbdătoare" → 1 Corinteni 13:4

SARCINA TA:
1. Caută fragmente din textul biblic (chiar dacă sunt incomplete)
2. Recunoaște teme biblice famose
3. Identifică referințe explicite la versete

RĂSPUNDE DOAR CU JSON:
- Dacă recunoști versul: {"book": "Ioan", "chapter": 3, "verse": 16}
- Dacă nu ești sigur: {"book": null}

CĂRȚI BIBLICE ÎN ROMÂNĂ:
Vechiul Testament: Geneza, Exodul, Leviticul, Numeri, Deuteronomul, Iosua, Judecători, Rut, 1 Samuel, 2 Samuel, 1 Împărați, 2 Împărați, 1 Cronici, 2 Cronici, Ezra, Neemia, Estera, Iov, Psalmi, Proverbele, Eclesiastul, Cântarea cântărilor, Isaia, Ieremia, Plângerile, Ezechiel, Daniel, Osea, Ioel, Amos, Obadia, Iona, Mica, Naum, Habacuc, Țefania, Hagai, Zaharia, Maleahi
Noul Testament: Matei, Marcu, Luca, Ioan, Faptele Apostolilor, Romani, 1 Corinteni, 2 Corinteni, Galateni, Efeseni, Filipeni, Coloseni, 1 Tesaloniceni, 2 Tesaloniceni, 1 Timotei, 2 Timotei, Tit, Filimon, Evrei, Iacov, 1 Petru, 2 Petru, 1 Ioan, 2 Ioan, 3 Ioan, Iuda, Apocalipsa

Analizează textul și returnează JSON:`;

    const requestData = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: 'json_object' }
    });

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    makeHTTPSRequest(options, requestData, (error, data) => {
        if (error) {
            console.error('Groq API error:', error);
            sendJSON(res, 500, { success: false, error: error.message });
            return;
        }

        try {
            console.log('🤖 Raw AI response:', JSON.stringify(data, null, 2));
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response structure');
            }
            const content = data.choices[0].message.content;
            console.log('🤖 AI content:', content);
            const parsed = JSON.parse(content);
            console.log('🤖 Parsed:', parsed);

            if (parsed.book && parsed.chapter && parsed.verse) {
                console.log('✅ Verse detected:', parsed);
                sendJSON(res, 200, {
                    success: true,
                    reference: {
                        book: parsed.book,
                        chapter: parseInt(parsed.chapter),
                        verse: parseInt(parsed.verse)
                    }
                });
            } else {
                console.log('❌ No verse in parsed response');
                sendJSON(res, 200, { success: false, raw: parsed });
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            sendJSON(res, 200, { success: false });
        }
    });
}

// Analizar con Gemini (implementación similar)
function analyzeWithGemini(transcript, res) {
    // Similar a analyzeWithGroq pero usando Gemini API
    sendJSON(res, 200, { success: false, error: 'Gemini analysis not implemented yet' });
}

server.listen(PORT, () => {
    console.log(`\n✅ Server running at http://localhost:${PORT}\n`);
    console.log('Open your browser and go to: http://localhost:8000\n');
    console.log('Press Ctrl+C to stop the server.\n');
});
