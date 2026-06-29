"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await signIn('credentials', { username, password, redirect: false });
    if (result?.ok) {
      toast.success('Logged in');
      router.push('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
        <label className="mb-4 block text-sm">Username
          <input className="mt-1 w-full rounded border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="mb-4 block text-sm">Password
          <input type="password" className="mt-1 w-full rounded border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white">Login</button>
      </form>
    </main>
  );
}
