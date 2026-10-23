import { NextResponse } from 'next/server';
import { getSongsData } from '../route';

// Puerto de forceRefreshCantari (server.js): antes vaciaba CANTARI_CACHE y delegaba
// en handleCantariProxy; aquí llamamos a getSongsData(true) para saltarnos el TTL
// del caché en memoria y forzar un fetch remoto fresco (con el mismo fallback a
// disco/estático si el remoto falla).
export const runtime = 'nodejs';

export async function GET() {
  const result = await getSongsData(true);
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
