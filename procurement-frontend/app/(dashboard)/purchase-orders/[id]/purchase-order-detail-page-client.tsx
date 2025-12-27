'use client';

import { useState } from 'react';
import { PurchaseOrder, purchaseOrdersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/lib/toast';
import { ArrowLeft, CheckCircle, XCircle, Send, Package, FileX } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PurchaseOrderDetailPageClientProps {
  purchaseOrder: PurchaseOrder;
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

export function PurchaseOrderDetailPageClient({ purchaseOrder: initialPO }: PurchaseOrderDetailPageClientProps) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder>(initialPO);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: PurchaseOrder['status']) => {
    setIsUpdating(true);
    try {
      const updated = await purchaseOrdersApi.updateStatus(purchaseOrder.id, newStatus);
      setPurchaseOrder(updated);
      toast.success('Estado actualizado', `La orden ahora está ${statusLabel(newStatus).toLowerCase()}`);
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar estado', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const canChangeStatus = (targetStatus: PurchaseOrder['status']) => {
    const current = purchaseOrder.status;
    const transitions: Record<PurchaseOrder['status'], PurchaseOrder['status'][]> = {
      draft: ['approved', 'cancelled'],
      approved: ['sent', 'cancelled'],
      sent: ['received', 'cancelled'],
      received: ['closed', 'cancelled'],
      closed: [],
      cancelled: [],
    };
    return transitions[current]?.includes(targetStatus) ?? false;
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Orden de Compra #{purchaseOrder.id}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(purchaseOrder.createdAt).toLocaleDateString('es-ES', {
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
              <p className="font-medium">{purchaseOrder.supplier?.name || `Proveedor ${purchaseOrder.supplierId}`}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Estado</Label>
              <div className="mt-1">
                <Badge variant={statusVariant(purchaseOrder.status)}>
                  {statusLabel(purchaseOrder.status)}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Warehouse ID</Label>
              <p className="font-medium">{purchaseOrder.warehouseId}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Moneda</Label>
              <p className="font-medium">{purchaseOrder.currency || 'MXN'}</p>
            </div>
            {purchaseOrder.notes && (
              <div>
                <Label className="text-sm text-muted-foreground">Notas</Label>
                <p className="text-sm">{purchaseOrder.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: purchaseOrder.currency || 'MXN',
                  }).format(Number(purchaseOrder.total))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {purchaseOrder.items?.length || 0} item(s) en esta orden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!purchaseOrder.items || purchaseOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay items en esta orden
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrder.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nameSnapshot || `Producto ${item.externalProductId}`}
                    </TableCell>
                    <TableCell>{item.skuSnapshot || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: purchaseOrder.currency || 'MXN',
                      }).format(Number(item.unitCost))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: purchaseOrder.currency || 'MXN',
                      }).format(Number(item.lineTotal))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar Estado</CardTitle>
          <CardDescription>
            Actualiza el estado de la orden de compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={purchaseOrder.status}
              onValueChange={(value) => {
                const newStatus = value as PurchaseOrder['status'];
                if (canChangeStatus(newStatus)) {
                  handleStatusChange(newStatus);
                } else {
                  toast.error('Transición de estado no permitida');
                }
              }}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['draft', 'approved', 'sent', 'received', 'closed', 'cancelled'] as const).map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={!canChangeStatus(status) && status !== purchaseOrder.status}
                  >
                    {statusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              {canChangeStatus('approved') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('approved')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              )}
              {canChangeStatus('sent') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('sent')}
                  disabled={isUpdating}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              )}
              {canChangeStatus('received') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('received')}
                  disabled={isUpdating}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Marcar Recibida
                </Button>
              )}
              {canChangeStatus('cancelled') && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className || ''}`}>{children}</label>;
}

