import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Test" message="Test message" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    render(
      <ConfirmDialog open={true} title="Delete User" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByText('Delete User')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open={true} title="Test" message="Test message" onConfirm={() => {}} onCancel={onCancel} />,
    );
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open={true} title="Test" message="Test message" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    await userEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(
      <ConfirmDialog open={true} title="Test" message="Test" onConfirm={() => {}} onCancel={() => {}} loading={true} />,
    );
    expect(screen.getByText('Processing...')).toBeTruthy();
  });

  it('uses danger variant styling', () => {
    render(
      <ConfirmDialog open={true} title="Delete" message="Sure?" variant="danger" onConfirm={() => {}} onCancel={() => {}} />,
    );
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toContain('bg-red');
  });

  it('uses custom button labels', () => {
    render(
      <ConfirmDialog open={true} title="Test" message="Test" confirmLabel="Yes" cancelLabel="No" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByText('Yes')).toBeTruthy();
    expect(screen.getByText('No')).toBeTruthy();
  });
});
