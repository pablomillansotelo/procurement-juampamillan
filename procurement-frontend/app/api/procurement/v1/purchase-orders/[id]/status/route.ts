import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/rate-limit-helper';

const PROCUREMENT_API_URL = process.env.PROCUREMENT_API_URL || 'http://localhost:8000';
const PROCUREMENT_API_KEY = process.env.PROCUREMENT_API_KEY || '';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { response: rateLimitResponse, rateLimitResult } = await applyRateLimit(request, 'mutation');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    const response = await fetch(`${PROCUREMENT_API_URL}/v1/purchase-orders/${params.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PROCUREMENT_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al actualizar estado de orden de compra' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return addRateLimitHeaders(NextResponse.json(data), rateLimitResult);
  } catch (error: any) {
    console.error('Error en PUT /api/procurement/v1/purchase-orders/[id]/status:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar estado de orden de compra' },
      { status: 500 }
    );
  }
}

