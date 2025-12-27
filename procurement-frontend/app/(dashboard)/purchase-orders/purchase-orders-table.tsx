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
import { PurchaseOrder } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye } from 'lucide-react';

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  onRefresh: () => void;
}

function statusLabel(status: PurchaseOrder['status']) {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'approved':
      return 'Aprobada';
    case 'sent':
      return 'Enviada';
    case 'received':
      return 'Recibida';
    case 'closed':
      return 'Cerrada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

function statusVariant(status: PurchaseOrder['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'closed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'draft':
      return 'secondary';
    case 'approved':
    case 'sent':
    case 'received':
      return 'outline';
    default:
      return 'outline';
  }
}

export function PurchaseOrdersTable({ purchaseOrders }: PurchaseOrdersTableProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden md:table-cell">Moneda</TableHead>
              <TableHead className="hidden md:table-cell">Creada</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron órdenes de compra. Crea una nueva para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">#{po.id}</TableCell>
                  <TableCell>{po.supplier?.name || `Proveedor ${po.supplierId}`}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(po.status)}>
                      {statusLabel(po.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: po.currency || 'MXN',
                    }).format(Number(po.total))}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{po.currency || 'MXN'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(po.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/purchase-orders/${po.id}`}>
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

