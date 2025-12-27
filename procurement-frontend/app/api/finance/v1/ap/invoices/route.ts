import { NextRequest, NextResponse } from 'next/server';
import { fetchApi } from '@/lib/api-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fetchApi('/v1/ap/invoices', {
      method: 'POST',
      body: JSON.stringify(body),
    }, 'finance');
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error creating AP invoice:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear factura AP' },
      { status: error.status || 500 }
    );
  }
}

