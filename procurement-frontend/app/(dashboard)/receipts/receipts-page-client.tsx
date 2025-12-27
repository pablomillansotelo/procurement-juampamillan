'use client';

import { useState } from 'react';
import { Receipt, receiptsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ReceiptsTable } from './receipts-table';
import { TableSkeleton } from '@/components/table-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ReceiptForm } from './receipt-form';

interface ReceiptsPageClientProps {
  initialReceipts: Receipt[];
}

export function ReceiptsPageClient({ initialReceipts }: ReceiptsPageClientProps) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await receiptsApi.getAll();
      setReceipts(data);
    } catch (e) {
      console.error('Error refrescando recepciones:', e);
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
          Gestiona recepciones de productos. Al crear una recepción, el stock se actualiza automáticamente en Inventory.
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Crear Recepción</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Crear recepción</DialogTitle>
                <DialogDescription>
                  Selecciona una orden de compra y registra los items recibidos. El stock se actualizará automáticamente.
                </DialogDescription>
              </DialogHeader>
              <ReceiptForm
                onCreated={async () => {
                  setIsDialogOpen(false);
                  await refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ReceiptsTable receipts={receipts} onRefresh={refresh} />
    </div>
  );
}

