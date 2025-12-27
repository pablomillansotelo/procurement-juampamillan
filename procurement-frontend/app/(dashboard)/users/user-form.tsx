'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormError } from '@/components/ui/form';
import {
  User,
  usersApi,
  CreateUserInput,
  UpdateUserInput
} from '@/lib/api';
import { toast } from '@/lib/toast';
import { userSchema, type UserFormData } from '@/lib/schemas/user';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      if (user) {
        const updateData: UpdateUserInput = {
          name: data.name,
          email: data.email,
        };
        await usersApi.update(user.id, updateData);
        toast.success('Usuario actualizado', 'Los cambios se guardaron correctamente');
      } else {
        const createData: CreateUserInput = {
          name: data.name,
          email: data.email,
        };
        await usersApi.create(createData);
        toast.success('Usuario creado', 'El usuario se creó correctamente');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      toast.error('Error al guardar usuario', error.message || 'No se pudo guardar el usuario');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Nombre completo"
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && <FormError>{errors.name.message}</FormError>}
      </FormField>

      <FormField>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="usuario@ejemplo.com"
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && <FormError>{errors.email.message}</FormError>}
      </FormField>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

