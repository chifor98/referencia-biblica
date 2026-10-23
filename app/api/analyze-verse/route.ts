import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveBookName, searchTopMatches, validateReference, type BibleSearchIndex, type ContentMatch } from '@/lib/voice-search';

// Modo IA: dos formas de encontrar un versículo, en una sola llamada al modelo.
//
// 1. Cita (exacta o con errores de micrófono): se buscan candidatos reales
//    en el índice de la Biblia (misma búsqueda difusa del modo Literal) y se
//    le muestran al modelo como referencia de qué texto existe de verdad.
// 2. Concepto/tema (p. ej. "fiul risipitor", "arca lui Noe" — palabras que
//    NUNCA aparecen en el texto del versículo, así que ningún candidato por
//    texto puede encontrarlas): se le pide al modelo que use su propio
//    conocimiento de la Biblia para identificar el pasaje.
//
// El riesgo de (2) es que el modelo "alucine" capítulo/versículo — a
// diferencia de (1), aquí no hay forma de anclarlo a texto real de
// antemano. La red de seguridad es validateReference(): se descarta
// cualquier respuesta cuyo libro/capítulo/versículo no exista de verdad en
// la estructura de la Biblia (no evita que se equivoque de pasaje, pero sí
// evita referencias inventadas que ni siquiera existen).
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
// Groq retiró los modelos Llama 3.x; este es el modelo de uso general vigente
// en su catálogo (ver GET /openai/v1/models) con soporte de json_mode.
const GROQ_MODEL = 'openai/gpt-oss-120b';
const MAX_CANDIDATES = 5;

let indexPromise: Promise<BibleSearchIndex> | null = null;

// Cacheado en memoria del proceso (el JSON pesa ~40MB) — se lee una sola vez
// y se reutiliza entre requests, igual que useBibleSearchIndex en el cliente.
function loadIndex(): Promise<BibleSearchIndex> {
  if (!indexPromise) {
    const filePath = path.join(process.cwd(), 'public', 'bible-index', 'bible-index.json');
    indexPromise = readFile(filePath, 'utf-8')
      .then((raw) => JSON.parse(raw) as BibleSearchIndex)
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

function buildPrompt(transcript: string, candidates: ContentMatch[]): string {
  const candidateBlock =
    candidates.length > 0
      ? `Candidați găsiți prin asemănare de text cu transcrierea (utili dacă vorbitorul citează, exact sau cu erori de microfon):\n${candidates
          .map((c, i) => `${i + 1}. ${c.book} ${c.chapter}:${c.verse} — "${c.text}"`)
          .join('\n')}`
      : 'Nu s-a găsit niciun candidat prin asemănare directă de text.';

  return `Ești expert în Biblie și ajuți la navigare prin voce într-o aplicație românească.

Transcriere (poate conține erori de recunoaștere, microfonul poate fi departe): "${transcript}"

${candidateBlock}

Vorbitorul poate face UNA din două lucruri — decide tu care:
1. CITEAZĂ un verset (exact sau cu erori de microfon) — în acest caz alege candidatul de mai sus care se potrivește, tolerând cuvinte schimbate/omise.
2. NUMEȘTE EXPLICIT o poveste, pildă, personaj sau eveniment biblic CUNOSCUT și SPECIFIC, fără să citeze text (ex: "fiul risipitor" → Luca 15, "arca lui Noe" → Geneza 6, "cei 10 porunci" → Exodul 20, "nașterea lui Isus" → Luca 2, "David și Goliat" → 1 Samuel 17) — în acest caz identifică TU, din propria ta cunoaștere a Bibliei, cartea, capitolul și (dacă știi) versetul unde începe acel pasaj.

IMPORTANT — ce NU trebuie să faci: nu asocia afirmații despre viața de zi cu zi (cumpărături, mâncare, familie, muncă, etc.) cu un verset doar pentru că există o legătură tematică vagă sau îndepărtată. "Mă duc să cumpăr pâine și lapte" NU este despre Biblie, chiar dacă un verset oarecare menționează și el pâine — în acest caz răspunsul corect e {"book": null}. Folosește opțiunea 2 DOAR când vorbitorul chiar numește o poveste/personaj/eveniment biblic recognoscibil, nu pentru orice propoziție care ar putea suna a temă morală sau religioasă.

Dacă nu poți identifica nimic rezonabil în niciunul din cele două moduri, spune că nu știi.

Răspunde DOAR cu JSON:
- {"book": "<nume carte în română>", "chapter": <număr>, "verse": <număr, sau 1 dacă nu ești sigur de versetul exact>}
- {"book": null} dacă nu poți identifica nimic`;
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
}

export async function POST(request: Request) {
  let transcript: string | undefined;
  try {
    const body = await request.json();
    transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : undefined;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!transcript) {
    return NextResponse.json({ success: false, error: 'No transcript provided' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'API key not configured' });
  }

  let candidates: ContentMatch[];
  try {
    const index = await loadIndex();
    candidates = searchTopMatches(transcript, index, MAX_CANDIDATES);
  } catch {
    return NextResponse.json({ success: false, error: 'No se pudo cargar el índice de la Biblia' }, { status: 500 });
  }

  try {
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: buildPrompt(transcript, candidates) }],
        temperature: 0.2,
        // gpt-oss es un modelo "reasoning": gasta tokens de razonamiento interno
        // antes del JSON final — con el prompt más largo (candidatos + reglas
        // de qué NO interpretar) se vieron casos de 300+ tokens solo de
        // razonamiento; con un max_tokens bajo se corta antes de responder.
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      return NextResponse.json({ success: false, error: `HTTP ${groqRes.status}` }, { status: 500 });
    }

    const data: GroqResponse = await groqRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ success: false });
    }

    const parsed = JSON.parse(content);
    if (!parsed.book || typeof parsed.chapter !== 'number') {
      return NextResponse.json({ success: false });
    }

    const book = resolveBookName(String(parsed.book));
    const chapter = Math.trunc(parsed.chapter);
    const verse = Math.max(1, Math.trunc(typeof parsed.verse === 'number' ? parsed.verse : 1));
    const reference = { book, chapter, verse };

    if (validateReference(reference)) {
      return NextResponse.json({ success: true, reference });
    }
    return NextResponse.json({ success: false });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
