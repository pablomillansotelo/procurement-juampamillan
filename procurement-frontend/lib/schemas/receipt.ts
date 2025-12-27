import { z } from 'zod';

export const receiptItemSchema = z.object({
  externalProductId: z.number().min(1, 'Selecciona un producto'),
  quantityReceived: z.number().min(1, 'La cantidad recibida debe ser mayor a 0'),
});

export const receiptSchema = z.object({
  supplierId: z.number().min(1, 'Selecciona un proveedor'),
  purchaseOrderId: z.number().optional(),
  warehouseId: z.number().min(1, 'Selecciona un warehouse'),
  reference: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, 'Agrega al menos un item'),
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;
export type ReceiptItemFormData = z.infer<typeof receiptItemSchema>;

