import { purchaseOrdersApi, type PurchaseOrder } from '@/lib/api-server';
import { PurchaseOrderDetailPageClient } from './purchase-order-detail-page-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchaseOrderId = Number(id);

  if (isNaN(purchaseOrderId)) {
    notFound();
  }

  let purchaseOrder: PurchaseOrder | null = null;
  try {
    purchaseOrder = await purchaseOrdersApi.getById(purchaseOrderId);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    notFound();
  }

  if (!purchaseOrder) {
    notFound();
  }

  return <PurchaseOrderDetailPageClient purchaseOrder={purchaseOrder} />;
}

