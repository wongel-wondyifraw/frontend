'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { DashboardStats } from '@/types';
import type { ReactNode } from 'react';
import { getDashboardStats } from '@/services/api';

const DashboardStatsContext = createContext<DashboardStats | null>(null);

interface DashboardStatsProviderProps {
  initialStats?: DashboardStats | null;
  children: ReactNode;
}

export function DashboardStatsProvider({ initialStats = null, children }: DashboardStatsProviderProps) {
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((next) => {
        if (!cancelled) setStats(next);
      })
      .catch(() => {
        /* keep SSR / previous values */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardStatsContext.Provider value={stats}>
      {children}
    </DashboardStatsContext.Provider>
  );
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext);
}
