'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppSkeleton from '@/Components/common/skeletons/AppSkeleton';
import { useUser } from '@/context/UserContext';
import type { ReactNode } from 'react';

const PROGRESSIVE_SHELL_ROUTES = ['/members/add'];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const allowProgressiveShell = PROGRESSIVE_SHELL_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (!user) {
    if (loading && allowProgressiveShell) {
      return children;
    }
    return <AppSkeleton />;
  }

  return children;
}
