import { receiptsApi, type Receipt } from '@/lib/api-server';
import { ReceiptDetailPageClient } from './receipt-detail-page-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ReceiptDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receiptId = Number(id);

  if (isNaN(receiptId)) {
    notFound();
  }

  let receipt: Receipt | null = null;
  try {
    receipt = await receiptsApi.getById(receiptId);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    notFound();
  }

  if (!receipt) {
    notFound();
  }

  return <ReceiptDetailPageClient receipt={receipt} />;
}

