"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { isValidIranianNationalId } from '@/validation/registration';

const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  nationalId: z.string().trim().regex(/^\d{10}$/, 'National ID must be 10 digits'),
}).superRefine((data, ctx) => {
  if (!isValidIranianNationalId(data.nationalId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nationalId'], message: 'Invalid Iranian National ID checksum' });
  }
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface DuplicateInfo {
  registeredBy: string;
  createdAt: string;
}

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { firstName: '', lastName: '', nationalId: '' },
  });

  async function onSubmit(data: RegistrationFormData) {
    setSubmitting(true);
    setDuplicate(null);

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.status === 409) {
        setDuplicate({
          registeredBy: result.details?.registration?.operator?.fullname ?? 'Unknown',
          createdAt: result.details?.registration?.createdAt ?? new Date().toISOString(),
        });
        toast.error('Registration already exists');
        return;
      }

      if (res.ok) {
        toast.success('Registration saved');
        reset();
        setDuplicate(null);
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Unable to register');
      }
    } catch {
      toast.error('Unable to register');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">New Registration</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <input
            {...register('firstName', { required: 'First name is required' })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white placeholder-slate-500"
            placeholder="First Name"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
        </div>
        <div>
          <input
            {...register('lastName', { required: 'Last name is required' })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white placeholder-slate-500"
            placeholder="Last Name"
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
        </div>
        <div>
          <input
            {...register('nationalId')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white placeholder-slate-500"
            placeholder="National ID (10 digits)"
            maxLength={10}
          />
          {errors.nationalId && <p className="mt-1 text-xs text-red-400">{errors.nationalId.message}</p>}
        </div>
      </div>

      {duplicate && (
        <div className="mt-4 rounded-lg border border-yellow-700 bg-yellow-900/30 p-3 text-sm">
          <p className="font-medium text-yellow-200">Registration already exists.</p>
          <p className="text-yellow-300/80">Registered by: {duplicate.registeredBy}</p>
          <p className="text-yellow-300/60">Date: {new Date(duplicate.createdAt).toLocaleDateString()}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </span>
        ) : (
          'Register'
        )}
      </button>
    </form>
  );
}
