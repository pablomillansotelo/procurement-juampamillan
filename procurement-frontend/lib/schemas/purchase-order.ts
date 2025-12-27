import { z } from 'zod';

export const purchaseOrderItemSchema = z.object({
  externalProductId: z.number().min(1, 'Selecciona un producto'),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  unitCost: z.number().min(0, 'El costo unitario debe ser mayor o igual a 0'),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.number().min(1, 'Selecciona un proveedor'),
  warehouseId: z.number().min(1, 'Selecciona un warehouse'),
  currency: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Agrega al menos un item'),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>;

