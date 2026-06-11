'use client';

import type { ReactNode } from 'react';
import { hasPermission, type User } from '@/types';
import { useUser } from '@/context/UserContext';

export function canDo(
  user: User | null | undefined,
  rule: {
    permission?: string;
    anyOf?: readonly string[];
    allOf?: readonly string[];
  },
): boolean {
  if (rule.permission && !hasPermission(user, rule.permission)) return false;
  if (rule.allOf && !rule.allOf.every((s) => hasPermission(user, s))) return false;
  if (rule.anyOf && !rule.anyOf.some((s) => hasPermission(user, s))) return false;
  return true;
}

interface CanProps {
  permission?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: CanProps): ReactNode {
  const { user } = useUser();
  return canDo(user, { permission, anyOf, allOf }) ? children : fallback;
}

export function useCan(permission: string | readonly string[]): boolean {
  const { user } = useUser();
  if (Array.isArray(permission)) {
    return canDo(user, { allOf: permission });
  }
  return canDo(user, { permission: permission as string });
}
