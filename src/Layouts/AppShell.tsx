'use client';

import AuthGuard from '@/Components/auth/AuthGuard';
import DashboardLayout from './DashboardLayout';
import type { ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
