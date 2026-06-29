"use client";

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';

interface RegistrationItem {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  operator: { fullname: string } | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  fullname: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
  forcePasswordChange: boolean;
}

interface UserForm {
  fullname: string;
  username: string;
  password: string;
  role: string;
  active: boolean;
}

const emptyForm: UserForm = { fullname: '', username: '', password: '', role: 'OPERATOR', active: true };

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<AdminUser | null>(null);
  const [confirmResetPassword, setConfirmResetPassword] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [confirmDeleteReg, setConfirmDeleteReg] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    try {
      const res = await fetch('/api/registrations');
      if (res.ok) setRegistrations(await res.json());
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setRegistrationsLoading(false);
    }
  }, []);

  async function handleDeleteRegistration(id: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Registration deleted');
        loadRegistrations();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to delete registration');
      }
    } catch {
      toast.error('Failed to delete registration');
    }
    setSubmitting(false);
    setConfirmDeleteReg(null);
  }

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadRegistrations();
  }, [loadUsers, loadRegistrations]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(user: AdminUser) {
    setEditingId(user.id);
    setForm({ fullname: user.fullname, username: user.username, password: '', role: user.role, active: user.active });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const body: Record<string, unknown> = {};
    if (editingId) {
      body.fullname = form.fullname;
      body.username = form.username;
      body.role = form.role;
      body.active = form.active;
      if (form.password) body.password = form.password;

      try {
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('User updated');
          setShowModal(false);
          loadUsers();
        } else {
          const data = await res.json();
          toast.error(data.error ?? 'Failed to update user');
        }
      } catch {
        toast.error('Failed to update user');
      }
    } else {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, active: true }),
        });
        if (res.ok) {
          toast.success('User created');
          setShowModal(false);
          loadUsers();
        } else {
          const data = await res.json();
          toast.error(data.error ?? 'Failed to create user');
        }
      } catch {
        toast.error('Failed to create user');
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted');
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    }
    setSubmitting(false);
    setConfirmDelete(null);
  }

  async function handleToggleActive(user: AdminUser) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      if (res.ok) {
        toast.success(user.active ? 'User disabled' : 'User enabled');
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to update user');
      }
    } catch {
      toast.error('Failed to update user');
    }
    setSubmitting(false);
    setConfirmToggle(null);
  }

  async function handleResetPassword(id: string) {
    if (!resetPasswordValue || resetPasswordValue.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPasswordValue, forcePasswordChange: true }),
      });
      if (res.ok) {
        toast.success('Password reset');
        setResetPasswordValue('');
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to reset password');
      }
    } catch {
      toast.error('Failed to reset password');
    }
    setSubmitting(false);
    setConfirmResetPassword(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Admin Panel</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Operator
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Full Name</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Username</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Role</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Created</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Last Login</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-100/50 dark:hover:bg-slate-900/50">
                <td className="px-4 py-3">{user.fullname}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${user.role === 'ADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${user.active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                    {user.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(user)} className="rounded bg-gray-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700">
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmToggle(user)}
                      className={`rounded px-2 py-1 text-xs ${user.active ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' : 'bg-green-900 text-green-200 hover:bg-green-800'}`}
                    >
                      {user.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => { setConfirmResetPassword(user.id); setResetPasswordValue(''); }}
                      className="rounded bg-gray-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      disabled={user.role === 'ADMIN'}
                      className="rounded bg-red-900 px-2 py-1 text-xs text-red-200 hover:bg-red-800 disabled:opacity-30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">First Name</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Last Name</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">National ID</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Operator</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {registrationsLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Loading...</td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No registrations</td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-100/50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3">{r.firstName || '—'}</td>
                  <td className="px-4 py-3">{r.lastName || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{r.nationalId}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.operator?.fullname ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmDeleteReg(r.id)}
                      className="rounded bg-red-900 px-2 py-1 text-xs text-red-200 hover:bg-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDeleteReg !== null}
        title="Delete Registration"
        message="Are you sure you want to delete this registration? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        loading={submitting}
        onConfirm={() => confirmDeleteReg && handleDeleteRegistration(confirmDeleteReg)}
        onCancel={() => setConfirmDeleteReg(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit Operator' : 'Add Operator'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">Full Name</label>
                <input
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  value={form.fullname}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">Username</label>
                <input
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">
                  Password {editingId && <span className="text-slate-500">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  minLength={editingId ? 0 : 8}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">Role</label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {editingId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeToggle"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800"
                  />
                  <label htmlFor="activeToggle" className="text-sm text-slate-500 dark:text-slate-400">Active</label>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        loading={submitting}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={confirmToggle !== null}
        title={confirmToggle?.active ? 'Disable User' : 'Enable User'}
        message={`Are you sure you want to ${confirmToggle?.active ? 'disable' : 'enable'} ${confirmToggle?.fullname}?`}
        variant={confirmToggle?.active ? 'danger' : 'default'}
        confirmLabel={confirmToggle?.active ? 'Disable' : 'Enable'}
        loading={submitting}
        onConfirm={() => confirmToggle && handleToggleActive(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />

      <ConfirmDialog
        open={confirmResetPassword !== null}
        title="Reset Password"
        message={
          <div>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Enter a new password for this user.</p>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
              placeholder="New password (min 8 chars)"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              minLength={8}
              autoFocus
            />
          </div>
        }
        confirmLabel="Reset"
        loading={submitting}
        onConfirm={() => confirmResetPassword && handleResetPassword(confirmResetPassword)}
        onCancel={() => setConfirmResetPassword(null)}
      />
    </div>
  );
}
