import { suppliersApi, type Supplier } from '@/lib/api-server';
import { SuppliersPageClient } from './suppliers-page-client';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  let initialSuppliers: Supplier[] = [];
  try {
    initialSuppliers = await suppliersApi.getAll();
  } catch (error) {
    console.error('Error fetching suppliers:', error);
  }

  return <SuppliersPageClient initialSuppliers={initialSuppliers} />;
}

