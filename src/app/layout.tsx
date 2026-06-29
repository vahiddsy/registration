import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Registration Management System',
  description: 'Secure registration management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
