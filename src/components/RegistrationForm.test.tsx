import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from './RegistrationForm';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<RegistrationForm />);
    expect(screen.getByPlaceholderText('First Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Last Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('National ID (10 digits)')).toBeTruthy();
    expect(screen.getByText('Register')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    render(<RegistrationForm />);
    await userEvent.click(screen.getByText('Register'));
    expect(await screen.findByText('First name is required')).toBeTruthy();
  });

  it('calls onSubmit with form data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'reg-1' }),
    });
    render(<RegistrationForm />);
    await userEvent.type(screen.getByPlaceholderText('First Name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last Name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('National ID (10 digits)'), '1111111111');
    await userEvent.click(screen.getByText('Register'));
    expect(mockFetch).toHaveBeenCalledWith('/api/registrations', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"firstName":"John"'),
    }));
  });

  it('shows duplicate info on 409', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({
        error: 'Registration already exists.',
        details: { registration: { operator: { fullname: 'Jane Op' }, createdAt: '2026-01-01T00:00:00.000Z' } },
      }),
    });
    render(<RegistrationForm />);
    await userEvent.type(screen.getByPlaceholderText('First Name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last Name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('National ID (10 digits)'), '1111111111');
    await userEvent.click(screen.getByText('Register'));
    expect(await screen.findByText(/Registered by: Jane Op/)).toBeTruthy();
  });
});
