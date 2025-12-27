'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { User, usersApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { UserForm } from './user-form';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { TableSearch } from '@/components/table-search';
import { TablePagination } from '@/components/table-pagination';
import { useState, useMemo, useEffect } from 'react';

interface UsersTableProps {
  users: User[];
  onRefresh: () => void;
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    onRefresh();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4">
        <TableSearch
          placeholder="Buscar usuarios por nombre o email..."
          onSearch={setSearchTerm}
        />
        <div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (open) {
            handleCreate();
          } else {
            setEditingUser(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>Crear Usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Modifica los datos del usuario.'
                  : 'Completa los datos para crear un nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSuccess={handleClose}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="border shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <UsersIcon className="h-4 w-4" />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  {searchTerm
                    ? 'No se encontraron usuarios que coincidan con la búsqueda'
                    : 'No hay usuarios disponibles'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={handleEdit}
                  onRefresh={onRefresh}
                />
              ))
            )}
          </TableBody>
        </Table>
        {filteredUsers.length > itemsPerPage && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </>
  );
}

function UserRow({
  user,
  onEdit,
  onRefresh
}: {
  user: User;
  onEdit: (user: User) => void;
  onRefresh: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromise = usersApi.delete(user.id);
      
      toast.promise(deletePromise, {
        loading: 'Eliminando usuario...',
        success: () => {
          onRefresh();
          return 'Usuario eliminado correctamente';
        },
        error: (error: any) => {
          console.error('Error al eliminar usuario:', error);
          return error.message || 'Error al eliminar el usuario';
        }
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TableRow>
      <TableCell>
        <UsersIcon className="h-4 w-4 text-muted-foreground" />
      </TableCell>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell className="hidden md:table-cell">{user.email}</TableCell>
      <TableCell className="hidden md:table-cell">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <DeleteConfirmDialog
            title="¿Eliminar usuario?"
            description={`¿Estás seguro de que deseas eliminar a "${user.name}"? Esta acción no se puede deshacer.`}
            onConfirm={handleDelete}
            itemName={user.name}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            }
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

