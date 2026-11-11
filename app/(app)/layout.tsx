import AppShell from '@/Layouts/AppShell';
import type { ReactNode } from 'react';
import AdminFontWrapper from '@/Components/common/AdminFontWrapper';
import { ADMIN_FONT_STACK, adminFontClassName } from '@/lib/admin-fonts';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminFontWrapper
      className={adminFontClassName}
      fontFamily={ADMIN_FONT_STACK}
    >
      <AppShell>{children}</AppShell>
    </AdminFontWrapper>
  );
}
