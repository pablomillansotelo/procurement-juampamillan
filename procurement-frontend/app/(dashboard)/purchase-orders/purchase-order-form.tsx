'use client';

import { useEffect, useMemo, useState } from 'react';
import { suppliersApi, inventoryApi, purchaseOrdersApi, type Supplier, type ExternalProduct, type Warehouse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/toast';
import { Trash2 } from 'lucide-react';

type PurchaseOrderItemDraft = {
  externalProductId: number | null;
  quantity: number;
  unitCost: number;
};

export function PurchaseOrderForm(props: { onCreated: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [externalProducts, setExternalProducts] = useState<ExternalProduct[]>([]);

  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [currency, setCurrency] = useState('MXN');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItemDraft[]>([
    { externalProductId: null, quantity: 1, unitCost: 0 },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const [s, w, p] = await Promise.all([
          suppliersApi.getAll(),
          inventoryApi.getWarehouses(),
          inventoryApi.getExternalProducts(),
        ]);
        setSuppliers(s);
        setWarehouses(w);
        setExternalProducts(p);
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar datos');
      }
    })();
  }, []);

  const totals = useMemo(() => {
    let total = 0;
    for (const item of items) {
      if (!item.externalProductId || item.quantity <= 0) continue;
      const lineTotal = Number(item.quantity) * Number(item.unitCost || 0);
      total += lineTotal;
    }
    return { total };
  }, [items]);

  const addItem = () => {
    setItems((prev) => [...prev, { externalProductId: null, quantity: 1, unitCost: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<PurchaseOrderItemDraft>) => {
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
      .filter((item) => item.externalProductId && item.quantity > 0 && item.unitCost >= 0)
      .map((item) => {
        const product = externalProducts.find((p) => p.id === item.externalProductId);
        return {
          externalProductId: item.externalProductId!,
          skuSnapshot: product?.sku,
          nameSnapshot: product?.name,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        };
      });

    if (normalized.length === 0) {
      toast.error('Agrega al menos un item');
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseOrdersApi.create({
        supplierId,
        warehouseId,
        currency: currency || undefined,
        notes: notes || undefined,
        items: normalized,
      });
      toast.success('Orden de compra creada');
      props.onCreated();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Error al crear orden de compra');
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
            onValueChange={(v) => setSupplierId(Number(v))}
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
          <Label>Warehouse *</Label>
          <Select
            value={warehouseId ? String(warehouseId) : undefined}
            onValueChange={(v) => setWarehouseId(Number(v))}
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Moneda</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MXN">MXN</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notas</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales..."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Agregar item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const selectedProduct = item.externalProductId
              ? externalProducts.find((p) => p.id === item.externalProductId)
              : null;

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                <div className="md:col-span-5 space-y-1">
                  <Label>Producto</Label>
                  <Select
                    value={item.externalProductId ? String(item.externalProductId) : undefined}
                    onValueChange={(v) => {
                      const product = externalProducts.find((p) => p.id === Number(v));
                      updateItem(idx, {
                        externalProductId: Number(v),
                        unitCost: product ? Number(product.basePrice) : item.unitCost,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalProducts.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} ({p.sku}) - {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          }).format(Number(p.basePrice))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <Label>Costo unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitCost}
                    onChange={(e) => updateItem(idx, { unitCost: Number(e.target.value) })}
                  />
                </div>

                <div className="md:col-span-1 space-y-1">
                  <Label>Subtotal</Label>
                  <div className="text-sm font-medium p-2 bg-muted rounded">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: currency || 'MXN',
                    }).format(Number(item.quantity) * Number(item.unitCost))}
                  </div>
                </div>

                <div className="md:col-span-1 flex justify-end">
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="text-lg font-semibold">
          {new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency || 'MXN',
          }).format(totals.total)}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={submit} disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear orden de compra'}
        </Button>
      </div>
    </div>
  );
}

