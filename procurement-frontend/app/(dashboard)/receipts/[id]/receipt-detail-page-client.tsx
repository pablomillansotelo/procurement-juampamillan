'use client';

import { useState } from 'react';
import { Receipt } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Package, Receipt as ReceiptIcon } from 'lucide-react';
import Link from 'next/link';
import { CreateApInvoiceDialog } from '../create-ap-invoice-dialog';

interface ReceiptDetailPageClientProps {
  receipt: Receipt;
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className || ''}`}>{children}</label>;
}

export function ReceiptDetailPageClient({ receipt }: ReceiptDetailPageClientProps) {
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/receipts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Recepción #{receipt.id}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(receipt.receivedAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Proveedor</Label>
              <p className="font-medium">{receipt.supplier?.name || `Proveedor ${receipt.supplierId}`}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Orden de Compra</Label>
              {receipt.purchaseOrderId ? (
                <Link
                  href={`/purchase-orders/${receipt.purchaseOrderId}`}
                  className="text-primary hover:underline font-medium"
                >
                  PO #{receipt.purchaseOrderId}
                </Link>
              ) : (
                <Badge variant="outline">Sin orden de compra</Badge>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Warehouse ID</Label>
              <p className="font-medium">{receipt.warehouseId}</p>
            </div>
            {receipt.reference && (
              <div>
                <Label className="text-sm text-muted-foreground">Referencia</Label>
                <p className="text-sm">{receipt.reference}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Actualizado</CardTitle>
            <CardDescription>
              El stock se actualizó automáticamente en Inventory al crear esta recepción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Package className="h-5 w-5" />
              <p className="text-sm font-medium">Stock sincronizado con Inventory</p>
            </div>
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsCreateInvoiceDialogOpen(true)}
              >
                <ReceiptIcon className="h-4 w-4 mr-2" />
                Crear factura AP en Finance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items Recibidos</CardTitle>
          <CardDescription>
            {receipt.items?.length || 0} item(s) recibido(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Cantidad Recibida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!receipt.items || receipt.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No hay items en esta recepción
                  </TableCell>
                </TableRow>
              ) : (
                receipt.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nameSnapshot || `Producto ${item.externalProductId}`}
                    </TableCell>
                    <TableCell>{item.skuSnapshot || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{item.quantityReceived}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateApInvoiceDialog
        open={isCreateInvoiceDialogOpen}
        onOpenChange={setIsCreateInvoiceDialogOpen}
        receiptId={receipt.id}
        supplierId={receipt.supplierId}
        onSuccess={() => {
          // Opcional: refrescar datos o mostrar mensaje
        }}
      />
    </div>
  );
}

