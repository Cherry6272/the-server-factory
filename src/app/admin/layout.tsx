import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = { title: 'Admin', robots: { index: false } };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/');

  return (
    <AdminShell user={{ email: session.user.email ?? '', name: session.user.name ?? null }}>
      {children}
    </AdminShell>
  );
}
