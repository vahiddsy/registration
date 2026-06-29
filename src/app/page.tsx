import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

export default async function HomePage() {
  const session = (await getServerSession(authConfig as never)) as { user?: unknown } | null;
  if (!session?.user) redirect('/login');
  redirect('/dashboard');
}
