'use client';

import { useState } from 'react';
import { PurchaseOrder, purchaseOrdersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { File, PlusCircle } from 'lucide-react';
import { PurchaseOrdersTable } from './purchase-orders-table';
import { TableSkeleton } from '@/components/table-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { PurchaseOrderForm } from './purchase-order-form';

interface PurchaseOrdersPageClientProps {
  initialPurchaseOrders: PurchaseOrder[];
}

export function PurchaseOrdersPageClient({ initialPurchaseOrders }: PurchaseOrdersPageClientProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await purchaseOrdersApi.getAll();
      setPurchaseOrders(data);
    } catch (e) {
      console.error('Error refrescando órdenes de compra:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton columns={6} rows={8} />;
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Gestiona órdenes de compra, items y estados.
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => {}}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Exportar</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Crear Orden de Compra</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Crear orden de compra</DialogTitle>
                <DialogDescription>
                  Selecciona un proveedor, warehouse y agrega items (producto, cantidad, costo unitario).
                </DialogDescription>
              </DialogHeader>
              <PurchaseOrderForm
                onCreated={async () => {
                  setIsDialogOpen(false);
                  await refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <PurchaseOrdersTable purchaseOrders={purchaseOrders} onRefresh={refresh} />
    </div>
  );
}

