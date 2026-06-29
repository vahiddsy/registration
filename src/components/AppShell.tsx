"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface SessionUser {
  id: string;
  fullname: string;
  username: string;
  role: string;
  active: boolean;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
        else setUser(null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  if (pathname === '/login' || pathname === '/login/' || pathname === '/') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const isAdmin = user.role === 'ADMIN';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel' }] : []),
    { href: '/registrations', label: 'Registrations' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-800 bg-slate-900 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link href="/dashboard" className="text-lg font-semibold text-white">
            RMS
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
          <div className="mb-3 text-sm text-slate-400">
            <p className="font-medium text-white">{user.fullname}</p>
            <p className="text-xs">{user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-red-900 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-lg font-semibold text-white">RMS</span>
        </header>
        <main className="flex-1">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
