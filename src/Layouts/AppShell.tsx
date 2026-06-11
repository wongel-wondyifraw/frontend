'use client';

import AuthGuard from '@/Components/auth/AuthGuard';
import DashboardLayout from './DashboardLayout';
import { NotificationsProvider } from '@/context/NotificationsContext';
import type { ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <NotificationsProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </NotificationsProvider>
    </AuthGuard>
  );
}
