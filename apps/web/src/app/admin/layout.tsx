import React from 'react';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server-auth';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    redirect('/dashboard');
  }

  return (
    <AdminLayoutClient user={{ email: user.email, role: user.role }}>
      {children}
    </AdminLayoutClient>
  );
}
