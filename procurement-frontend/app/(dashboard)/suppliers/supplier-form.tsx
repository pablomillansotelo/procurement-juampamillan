'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormError } from '@/components/ui/form';
import { toast } from '@/lib/toast';
import { supplierSchema, type SupplierFormData } from '@/lib/schemas/supplier';
import { suppliersApi, type Supplier, type CreateSupplierInput, type UpdateSupplierInput } from '@/lib/api';

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      address: supplier?.address || '',
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (supplier) {
        const payload: UpdateSupplierInput = {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        };
        await suppliersApi.update(supplier.id, payload);
        toast.success('Proveedor actualizado', 'Los cambios se guardaron correctamente');
      } else {
        const payload: CreateSupplierInput = {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        };
        await suppliersApi.create(payload);
        toast.success('Proveedor creado', 'El proveedor se creó correctamente');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar proveedor:', error);
      toast.error('Error al guardar proveedor', error.message || 'No se pudo guardar el proveedor');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register('name')} placeholder="Nombre del proveedor" aria-invalid={errors.name ? 'true' : 'false'} />
        {errors.name && <FormError>{errors.name.message}</FormError>}
      </FormField>

      <FormField>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} placeholder="proveedor@ejemplo.com" aria-invalid={errors.email ? 'true' : 'false'} />
        {errors.email && <FormError>{errors.email.message}</FormError>}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register('phone')} placeholder="555-123-4567" />
          {errors.phone && <FormError>{errors.phone.message}</FormError>}
        </FormField>

        <FormField>
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" {...register('address')} placeholder="Calle, número, ciudad" />
          {errors.address && <FormError>{errors.address.message}</FormError>}
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : supplier ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

