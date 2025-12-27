'use client';

import { useState } from 'react';
import { User, usersApi } from '@/lib/api';
import { UsersTable } from './users-table';
import { TableSkeleton } from '@/components/table-skeleton';

interface UsersPageClientProps {
  initialUsers: User[];
}

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const updatedUsers = await usersApi.getAll();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error al actualizar usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton columns={5} rows={5} />;
  }

  return <UsersTable users={users} onRefresh={handleRefresh} />;
}

