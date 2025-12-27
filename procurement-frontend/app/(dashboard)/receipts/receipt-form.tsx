'use client';

import { useEffect, useMemo, useState } from 'react';
import { suppliersApi, purchaseOrdersApi, inventoryApi, receiptsApi, type Supplier, type PurchaseOrder, type Warehouse, type ExternalProduct } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/toast';
import { Trash2, CheckCircle } from 'lucide-react';

type ReceiptItemDraft = {
  externalProductId: number | null;
  quantityReceived: number;
};

export function ReceiptForm(props: { onCreated: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [reference, setReference] = useState('');
  const [items, setItems] = useState<ReceiptItemDraft[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, w] = await Promise.all([
          suppliersApi.getAll(),
          inventoryApi.getWarehouses(),
        ]);
        setSuppliers(s);
        setWarehouses(w);
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar datos');
      }
    })();
  }, []);

  useEffect(() => {
    if (supplierId) {
      (async () => {
        try {
          const pos = await purchaseOrdersApi.getAll({ supplierId });
          setPurchaseOrders(pos);
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setPurchaseOrders([]);
      setSelectedPO(null);
      setPurchaseOrderId(null);
    }
  }, [supplierId]);

  useEffect(() => {
    if (purchaseOrderId) {
      (async () => {
        try {
          const po = await purchaseOrdersApi.getById(purchaseOrderId);
          setSelectedPO(po);
          // Pre-llenar items con los items de la PO
          if (po.items && po.items.length > 0) {
            setItems(
              po.items.map((item) => ({
                externalProductId: item.externalProductId,
                quantityReceived: item.quantity, // Por defecto, cantidad ordenada
              }))
            );
            setWarehouseId(po.warehouseId);
          }
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setSelectedPO(null);
      setItems([]);
    }
  }, [purchaseOrderId]);

  const addItem = () => {
    setItems((prev) => [...prev, { externalProductId: null, quantityReceived: 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<ReceiptItemDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const submit = async () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }

    if (!warehouseId) {
      toast.error('Selecciona un warehouse');
      return;
    }

    const normalized = items
      .filter((item) => item.externalProductId && item.quantityReceived > 0)
      .map((item) => {
        const poItem = selectedPO?.items?.find((i) => i.externalProductId === item.externalProductId);
        return {
          externalProductId: item.externalProductId!,
          skuSnapshot: poItem?.skuSnapshot,
          nameSnapshot: poItem?.nameSnapshot,
          quantityReceived: Number(item.quantityReceived),
        };
      });

    if (normalized.length === 0) {
      toast.error('Agrega al menos un item');
      return;
    }

    // Validar que no se exceda la cantidad ordenada
    if (selectedPO) {
      for (const item of normalized) {
        const poItem = selectedPO.items?.find((i) => i.externalProductId === item.externalProductId);
        if (poItem && item.quantityReceived > poItem.quantity) {
          toast.error(`La cantidad recibida no puede exceder la cantidad ordenada (${poItem.quantity})`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await receiptsApi.create({
        supplierId,
        purchaseOrderId: purchaseOrderId || undefined,
        warehouseId,
        reference: reference || undefined,
        items: normalized,
      });
      toast.success('Recepción creada', 'El stock se actualizó automáticamente en Inventory');
      props.onCreated();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Error al crear recepción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Proveedor *</Label>
          <Select
            value={supplierId ? String(supplierId) : undefined}
            onValueChange={(v) => {
              setSupplierId(Number(v));
              setPurchaseOrderId(null);
              setSelectedPO(null);
              setItems([]);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} {s.email ? `(${s.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Orden de Compra (opcional)</Label>
          <Select
            value={purchaseOrderId ? String(purchaseOrderId) : undefined}
            onValueChange={(v) => setPurchaseOrderId(Number(v))}
            disabled={!supplierId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una PO (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin orden de compra</SelectItem>
              {purchaseOrders.map((po) => (
                <SelectItem key={po.id} value={String(po.id)}>
                  PO #{po.id} - {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: po.currency || 'MXN',
                  }).format(Number(po.total))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Warehouse *</Label>
          <Select
            value={warehouseId ? String(warehouseId) : undefined}
            onValueChange={(v) => setWarehouseId(Number(v))}
            disabled={!!selectedPO}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPO && (
            <p className="text-xs text-muted-foreground">
              Warehouse pre-seleccionado desde la orden de compra
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Referencia</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Número de referencia, guía, etc."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Items Recibidos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Agregar item
          </Button>
        </div>

        {selectedPO && selectedPO.items && selectedPO.items.length > 0 && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Items de la orden de compra:</p>
            <ul className="list-disc list-inside space-y-1">
              {selectedPO.items.map((item) => (
                <li key={item.id}>
                  {item.nameSnapshot || `Producto ${item.externalProductId}`}: {item.quantity} unidades
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item, idx) => {
            const poItem = selectedPO?.items?.find((i) => i.externalProductId === item.externalProductId);
            const maxQuantity = poItem ? poItem.quantity : undefined;

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                <div className="md:col-span-6 space-y-1">
                  <Label>Producto</Label>
                  <Select
                    value={item.externalProductId ? String(item.externalProductId) : undefined}
                    onValueChange={(v) => {
                      const productId = Number(v);
                      const poItem = selectedPO?.items?.find((i) => i.externalProductId === productId);
                      updateItem(idx, {
                        externalProductId: productId,
                        quantityReceived: poItem ? poItem.quantity : item.quantityReceived,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPO?.items?.map((poItem) => (
                        <SelectItem key={poItem.externalProductId} value={String(poItem.externalProductId)}>
                          {poItem.nameSnapshot || `Producto ${poItem.externalProductId}`} (Ordenado: {poItem.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 space-y-1">
                  <Label>
                    Cantidad Recibida
                    {maxQuantity && ` (máx: ${maxQuantity})`}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxQuantity}
                    value={item.quantityReceived}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      if (!maxQuantity || qty <= maxQuantity) {
                        updateItem(idx, { quantityReceived: qty });
                      }
                    }}
                  />
                  {maxQuantity && item.quantityReceived > maxQuantity && (
                    <p className="text-xs text-destructive">
                      Excede la cantidad ordenada ({maxQuantity})
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-primary" />
        <p className="text-sm">
          Al crear esta recepción, el stock se actualizará automáticamente en Inventory.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear recepción'}
        </Button>
      </div>
    </div>
  );
}

