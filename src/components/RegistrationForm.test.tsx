import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from './RegistrationForm';
import { isValidIranianNationalId } from '@/validation/registration';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function findValidNationalId() {
  for (let i = 0; i < 10000; i++) {
    const id = String(1111111111 + i);
    if (isValidIranianNationalId(id)) return id;
  }
  return '0000000000';
}

const VALID_ID = findValidNationalId();
const INVALID_ID = '1234567890';

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 with national ID input and check button', () => {
    render(<RegistrationForm />);
    expect(screen.getByPlaceholderText('شماره ملی')).toBeTruthy();
    expect(screen.getByText('بررسی')).toBeTruthy();
    expect(screen.queryByText('نام')).toBeNull();
    expect(screen.queryByText('نام خانوادگی')).toBeNull();
  });

  it('disables check button for non-10-digit input', async () => {
    render(<RegistrationForm />);
    const input = screen.getByPlaceholderText('شماره ملی');
    const button = screen.getByText('بررسی') as HTMLButtonElement;
    await userEvent.type(input, '123');
    expect(button.disabled).toBe(true);
  });

  it('shows validation error for invalid checksum', async () => {
    render(<RegistrationForm />);
    const input = screen.getByPlaceholderText('شماره ملی');
    await userEvent.type(input, INVALID_ID);
    await userEvent.click(screen.getByText('بررسی'));
    expect(await screen.findByText('شماره ملی نامعتبر است')).toBeTruthy();
  });

  it('advances to step 2 on successful check', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exists: false }),
    });
    render(<RegistrationForm />);
    const input = screen.getByPlaceholderText('شماره ملی');
    await userEvent.type(input, VALID_ID);
    await userEvent.click(screen.getByText('بررسی'));
    expect(await screen.findByText('ثبت اطلاعات (اختیاری)')).toBeTruthy();
    expect(screen.getByText('ثبت اطلاعات')).toBeTruthy();
  });

  it('shows duplicate modal when national ID already exists', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exists: true,
        registration: {
          nationalId: VALID_ID,
          firstName: 'علی',
          lastName: 'احمدی',
          operatorName: 'اپراتور نمونه',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    });
    render(<RegistrationForm />);
    const input = screen.getByPlaceholderText('شماره ملی');
    await userEvent.type(input, VALID_ID);
    await userEvent.click(screen.getByText('بررسی'));
    expect(await screen.findByText('این شماره ملی قبلاً ثبت شده است')).toBeTruthy();
    expect(screen.getByText('اپراتور نمونه')).toBeTruthy();
  });

  it('submits registration after successful check', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ exists: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'reg-1' }) });

    render(<RegistrationForm />);
    const input = screen.getByPlaceholderText('شماره ملی');
    await userEvent.type(input, VALID_ID);
    await userEvent.click(screen.getByText('بررسی'));
    expect(await screen.findByText('ثبت اطلاعات (اختیاری)')).toBeTruthy();

    const firstNameInput = screen.getByPlaceholderText('نام');
    const lastNameInput = screen.getByPlaceholderText('نام خانوادگی');
    await userEvent.type(firstNameInput, 'علی');
    await userEvent.type(lastNameInput, 'احمدی');
    await userEvent.click(screen.getByText('ثبت اطلاعات'));

    expect(mockFetch).toHaveBeenLastCalledWith('/api/registrations', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining(VALID_ID),
    }));
  });
});
