import { receiptsApi, type Receipt } from '@/lib/api-server';
import { ReceiptsPageClient } from './receipts-page-client';

export const dynamic = 'force-dynamic';

export default async function ReceiptsPage() {
  let initialReceipts: Receipt[] = [];
  try {
    initialReceipts = await receiptsApi.getAll();
  } catch (error) {
    console.error('Error fetching receipts:', error);
  }

  return <ReceiptsPageClient initialReceipts={initialReceipts} />;
}

