import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Debe ser un email válido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

