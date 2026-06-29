"use client";

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import RegistrationForm from '@/components/RegistrationForm';

interface RegistrationItem {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  createdAt: string;
  operator: { fullname: string } | null;
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRegistrations = useCallback(async () => {
    try {
      const res = await fetch('/api/registrations');
      if (res.ok) setRegistrations(await res.json());
    } catch {
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/registrations/search?q=${encodeURIComponent(search)}`);
      if (res.ok) setRegistrations(await res.json());
    } catch {
      toast.error('خطا در جستجو');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-semibold">ثبت نام</h1>

        <RegistrationForm onSuccess={loadRegistrations} />

        <form onSubmit={onSearch} className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-6">
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              placeholder="جستجو با شماره ملی، نام یا نام خانوادگی"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="rounded-lg bg-slate-600 dark:bg-slate-700 px-4 py-2 text-white hover:bg-slate-500 dark:hover:bg-slate-600">
              جستجو
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {search ? 'نتایج جستجو' : 'همه ثبت نام‌ها'}
            <span className="mr-2 text-sm font-normal text-slate-400 dark:text-slate-500">({registrations.length})</span>
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : registrations.length === 0 ? (
            <p className="py-8 text-center text-slate-400 dark:text-slate-500">هیچ ثبت نامی یافت نشد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">نام</th>
                    <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">نام خانوادگی</th>
                    <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">شماره ملی</th>
                    <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">اپراتور</th>
                    <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {registrations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-100/50 dark:hover:bg-slate-900/50">
                      <td className="px-3 py-2">{r.firstName}</td>
                      <td className="px-3 py-2">{r.lastName}</td>
                      <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{r.nationalId}</td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.operator?.fullname ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-400 dark:text-slate-500">{new Date(r.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
