import { usersApi, type User } from '@/lib/api-server';
import { UsersPageClient } from './users-page-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  let initialUsers: User[] = [];
  try {
    initialUsers = await usersApi.getAll();
  } catch (error) {
    console.error('Error fetching users:', error);
  }

  return <UsersPageClient initialUsers={initialUsers} />;
}

