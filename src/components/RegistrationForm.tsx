"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { isValidIranianNationalId } from '@/validation/registration';

interface CheckResult {
  exists: boolean;
  registration?: {
    nationalId: string;
    firstName: string;
    lastName: string;
    operatorName: string;
    createdAt: string;
  };
}

interface Props {
  onSuccess?: () => void;
}

export default function RegistrationForm({ onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [nationalId, setNationalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<CheckResult['registration'] | null>(null);
  const [animateStep2, setAnimateStep2] = useState(false);

  const nationalIdRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);

  const focusNationalId = useCallback(() => {
    setTimeout(() => nationalIdRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    focusNationalId();
  }, [focusNationalId]);

  async function handleCheck() {
    setCheckError('');

    if (!/^\d{10}$/.test(nationalId)) {
      setCheckError('شماره ملی باید ۱۰ رقم باشد');
      return;
    }

    if (!isValidIranianNationalId(nationalId)) {
      setCheckError('شماره ملی نامعتبر است');
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/registrations/check?nationalId=${encodeURIComponent(nationalId)}`);
      const data: CheckResult = await res.json();

      if (data.exists && data.registration) {
        setModalData(data.registration);
        setShowModal(true);
        return;
      }

      setStep(2);
      setAnimateStep2(true);
      setTimeout(() => firstNameRef.current?.focus(), 300);
    } catch {
      setCheckError('خطا در بررسی شماره ملی');
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, nationalId }),
      });

      if (res.ok) {
        toast.success('اطلاعات با موفقیت ثبت شد');
        setNationalId('');
        setFirstName('');
        setLastName('');
        setStep(1);
        setAnimateStep2(false);
        focusNationalId();
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'خطا در ثبت اطلاعات');
      }
    } catch {
      toast.error('خطا در ثبت اطلاعات');
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && step === 1) {
      e.preventDefault();
      handleCheck();
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-6">
        <div className="mb-4 flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm text-white">۱</span>
          <span>بررسی شماره ملی</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <input
              ref={nationalIdRef}
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={nationalId}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setNationalId(v);
                if (step === 2 && v !== nationalId) {
                  setStep(1);
                  setAnimateStep2(false);
                  setFirstName('');
                  setLastName('');
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="شماره ملی"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-right text-white placeholder-gray-400 dark:placeholder-slate-500"
              dir="rtl"
            />
            {checkError && (
              <p className="mt-1 text-xs text-red-400">{checkError}</p>
            )}
          </div>
          <button
            onClick={handleCheck}
            disabled={checking || nationalId.length !== 10}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto w-full"
          >
            {checking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                در حال بررسی
              </span>
            ) : (
              'بررسی'
            )}
          </button>
        </div>
      </div>

      {step === 2 && (
        <div
          className={`rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-6 transition-all duration-300 ${
            animateStep2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="mb-4 flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-sm text-slate-300">۲</span>
            <span>ثبت اطلاعات (اختیاری)</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-400">نام</label>
                <input
                  ref={firstNameRef}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="نام"
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-right text-white placeholder-gray-400 dark:placeholder-slate-500"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">نام خانوادگی</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-2 text-right text-white placeholder-gray-400 dark:placeholder-slate-500"
                  dir="rtl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto w-full"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  در حال ثبت
                </span>
              ) : (
                'ثبت اطلاعات'
              )}
            </button>
          </form>
        </div>
      )}

      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-6 shadow-2xl"
            dir="rtl"
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white text-center">
              این شماره ملی قبلاً ثبت شده است
            </h3>
            <div className="mb-6 space-y-3 text-sm">
              <div className="flex justify-between rounded-lg bg-gray-100 dark:bg-slate-800 p-3">
                <span className="text-slate-400">شماره ملی</span>
                <span className="font-mono text-slate-900 dark:text-white" dir="ltr">{modalData.nationalId}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-gray-100 dark:bg-slate-800 p-3">
                <span className="text-slate-400">نام</span>
                <span className="text-slate-900 dark:text-white">{modalData.firstName || '—'}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-gray-100 dark:bg-slate-800 p-3">
                <span className="text-slate-400">نام خانوادگی</span>
                <span className="text-slate-900 dark:text-white">{modalData.lastName || '—'}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-gray-100 dark:bg-slate-800 p-3">
                <span className="text-slate-400">اپراتور ثبت‌کننده</span>
                <span className="text-slate-900 dark:text-white">{modalData.operatorName}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-gray-100 dark:bg-slate-800 p-3">
                <span className="text-slate-400">تاریخ ثبت</span>
                <span className="text-slate-900 dark:text-white">{new Date(modalData.createdAt).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                setModalData(null);
                focusNationalId();
              }}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
