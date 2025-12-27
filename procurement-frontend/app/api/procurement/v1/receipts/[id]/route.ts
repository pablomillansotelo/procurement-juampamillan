import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

const PROCUREMENT_API_URL = process.env.PROCUREMENT_API_URL || 'http://localhost:8000';
const PROCUREMENT_API_KEY = process.env.PROCUREMENT_API_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { response: rateLimitResponse, rateLimitResult } = await applyRateLimit(request, 'get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const response = await fetch(`${PROCUREMENT_API_URL}/v1/receipts/${params.id}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PROCUREMENT_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener recepción' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return addRateLimitHeaders(nextResponse, rateLimitResult);
  } catch (error: any) {
    console.error('Error en GET /api/procurement/v1/receipts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener recepción' },
      { status: 500 }
    );
  }
}

