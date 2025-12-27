import { purchaseOrdersApi, type PurchaseOrder } from '@/lib/api-server';
import { PurchaseOrdersPageClient } from './purchase-orders-page-client';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage() {
  let initialPurchaseOrders: PurchaseOrder[] = [];
  try {
    initialPurchaseOrders = await purchaseOrdersApi.getAll();
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
  }

  return <PurchaseOrdersPageClient initialPurchaseOrders={initialPurchaseOrders} />;
}

