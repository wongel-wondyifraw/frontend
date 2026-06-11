'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>{children}</ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
