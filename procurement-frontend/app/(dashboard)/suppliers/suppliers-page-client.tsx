'use client';

import { useMemo, useState } from 'react';
import { Supplier, suppliersApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSearch } from '@/components/table-search';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { SupplierForm } from './supplier-form';

interface SuppliersPageClientProps {
  initialSuppliers: Supplier[];
}

export function SuppliersPageClient({ initialSuppliers }: SuppliersPageClientProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const term = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term) ||
        (s.phone || '').toLowerCase().includes(term)
    );
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSliceStart = (currentPage - 1) * pageSize;
  const pageSliceEnd = pageSliceStart + pageSize;
  const paginated = filtered.slice(pageSliceStart, pageSliceEnd);

  const handleRefresh = async () => {
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Error al refrescar proveedores:', error);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await suppliersApi.delete(id);
      toast.success('Proveedor eliminado', 'El proveedor se eliminó correctamente');
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      setPage(1);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      toast.error('Error al eliminar proveedor');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4">
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TableSearch
              placeholder="Buscar por nombre, email o teléfono..."
              initialValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>Nuevo proveedor</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
                  <DialogDescription>
                    {editingSupplier ? 'Actualiza la información del proveedor.' : 'Completa los datos para crear un proveedor.'}
                  </DialogDescription>
                </DialogHeader>
                <SupplierForm
                  supplier={editingSupplier}
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    handleRefresh();
                  }}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>
              Proveedores: <strong>{filtered.length}</strong>
            </span>
            <span>
              Página {currentPage} de {totalPages}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="w-[100px]">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron proveedores. Crea uno nuevo para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.email || <Badge variant="outline">Sin email</Badge>}</TableCell>
                    <TableCell>{supplier.phone || <Badge variant="outline">Sin teléfono</Badge>}</TableCell>
                    <TableCell>{supplier.address || <Badge variant="outline">Sin dirección</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                        Editar
                      </Button>
                      <DeleteConfirmDialog
                        title="¿Eliminar proveedor?"
                        description={`¿Seguro que deseas eliminar a "${supplier.name}"? Esta acción no se puede deshacer.`}
                        onConfirm={() => handleDelete(supplier.id)}
                        itemName={supplier.name}
                        isLoading={deletingId === supplier.id}
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Eliminar
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
              <div>
                Mostrando{' '}
                <strong>
                  {filtered.length === 0 ? 0 : pageSliceStart + 1}-{Math.min(pageSliceEnd, filtered.length)}
                </strong>{' '}
                de <strong>{filtered.length}</strong>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

