'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table,
  TableCell
} from '@/components/ui/table';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Receipt } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface ReceiptsTableProps {
  receipts: Receipt[];
  onRefresh: () => void;
}

export function ReceiptsTable({ receipts }: ReceiptsTableProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Orden de Compra</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="hidden md:table-cell">Referencia</TableHead>
              <TableHead className="hidden md:table-cell">Recibida</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron recepciones. Crea una nueva para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">#{receipt.id}</TableCell>
                  <TableCell>{receipt.supplier?.name || `Proveedor ${receipt.supplierId}`}</TableCell>
                  <TableCell>
                    {receipt.purchaseOrderId ? (
                      <Link
                        href={`/purchase-orders/${receipt.purchaseOrderId}`}
                        className="text-primary hover:underline"
                      >
                        PO #{receipt.purchaseOrderId}
                      </Link>
                    ) : (
                      <Badge variant="outline">Sin PO</Badge>
                    )}
                  </TableCell>
                  <TableCell>Warehouse {receipt.warehouseId}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {receipt.reference || <Badge variant="outline">Sin referencia</Badge>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(receipt.receivedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/receipts/${receipt.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

