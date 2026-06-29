import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface OperatorStats {
  id: string;
  fullname: string;
  username: string;
  _count: { registrations: number };
}

export default async function DashboardPage() {
  const session = (await getServerSession(authConfig as never)) as { user?: { id?: string; role?: string } } | null;
  if (!session?.user) redirect('/login');

  const [totalRegistrations, todayRegistrations, operatorsCount, latestRegistrations, operatorStats] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.user.count({ where: { role: 'OPERATOR' } }),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { operator: true },
    }),
    prisma.user.findMany({
      where: { role: 'OPERATOR' },
      include: { _count: { select: { registrations: true } } },
      orderBy: { registrations: { _count: 'desc' } },
    }) as unknown as OperatorStats[],
  ]);

  const isAdmin = session.user.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          {isAdmin && (
            <Link
              href="/api/export"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Export Excel
            </Link>
          )}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Registrations</p>
            <p className="mt-1 text-3xl font-semibold">{totalRegistrations}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s Registrations</p>
            <p className="mt-1 text-3xl font-semibold">{todayRegistrations}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Operators</p>
            <p className="mt-1 text-3xl font-semibold">{operatorsCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Registrations / Operator</p>
            <p className="mt-1 text-3xl font-semibold">
              {operatorsCount > 0 ? (totalRegistrations / operatorsCount).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
            <h2 className="mb-4 text-lg font-semibold">Registrations per Operator</h2>
            {operatorStats.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No operators yet</p>
            ) : (
              <div className="space-y-3">
                {operatorStats.map((op) => (
                  <div key={op.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{op.fullname}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800 sm:w-48">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: `${Math.min(100, (op._count.registrations / Math.max(...operatorStats.map((o) => o._count.registrations), 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{op._count.registrations}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-4">
            <h2 className="mb-4 text-lg font-semibold">Latest Registrations</h2>
            {latestRegistrations.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No registrations yet</p>
            ) : (
              <ul className="space-y-2">
                {latestRegistrations.map((r) => (
                  <li key={r.id} className="rounded-lg border border-gray-200 dark:border-slate-800 p-3 text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">{r.firstName} {r.lastName}</span>
                    <span className="ml-2 font-mono text-slate-400 dark:text-slate-500">{r.nationalId}</span>
                    <span className="ml-2 text-slate-400 dark:text-slate-500">— {r.operator.fullname}</span>
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
