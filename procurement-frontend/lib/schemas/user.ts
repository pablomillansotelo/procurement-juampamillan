import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Debe ser un email válido'),
});

export type UserFormData = z.infer<typeof userSchema>;

