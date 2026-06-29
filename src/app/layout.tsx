import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Registration Management System',
  description: 'Secure registration management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
