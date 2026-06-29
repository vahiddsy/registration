"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ForcePasswordChangePage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user) router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        toast.success('Password changed successfully');
        router.push('/dashboard');
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Change Your Password</h1>
        <p className="mb-6 text-sm text-slate-400">This is a temporary password. Please set a new one.</p>

        <label className="mb-4 block text-sm">
          New Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        <label className="mb-6 block text-sm">
          Confirm Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </main>
  );
}
