'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Spin } from 'antd';
import { useUser } from '@/context/UserContext';
import { hasPermission } from '@/types';

export function PermissionGate({
  permission,
  children,
  pageLabel,
}: {
  permission: string | string[];
  children: ReactNode;
  pageLabel?: string;
}) {
  const { user, loading } = useUser();
  const required = Array.isArray(permission) ? permission : [permission];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const allowed = required.some((slug) => hasPermission(user, slug));
  if (!allowed) {
    return <AccessDenied permission={required.join(' or ')} pageLabel={pageLabel} />;
  }

  return <>{children}</>;
}

function AccessDenied({
  permission,
  pageLabel,
}: {
  permission: string;
  pageLabel?: string;
}) {
  return (
    <div style={{
      margin: '0 auto',
      display: 'flex',
      minHeight: '60vh',
      maxWidth: 480,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      textAlign: 'center',
      padding: 24,
    }}>
      <div style={{
        display: 'flex',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'rgba(255, 77, 79, 0.1)',
        color: '#ff4d4f',
      }}>
        <ShieldAlert size={28} aria-hidden />
      </div>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          You don&apos;t have access{pageLabel ? ` to ${pageLabel}` : ''}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Your role is missing the{' '}
          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
            {permission}
          </code>{' '}
          permission. Ask an administrator to grant it.
        </p>
      </div>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'var(--primary-blue, #1677ff)',
          color: '#fff',
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
