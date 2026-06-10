'use client';

import React, { createContext, useContext } from 'react';
import type { DashboardStats } from '@/types';
import type { ReactNode } from 'react';

const DashboardStatsContext = createContext<DashboardStats | null>(null);

interface DashboardStatsProviderProps {
  initialStats?: DashboardStats | null;
  children: ReactNode;
}

export function DashboardStatsProvider({ initialStats = null, children }: DashboardStatsProviderProps) {
  return (
    <DashboardStatsContext.Provider value={initialStats}>
      {children}
    </DashboardStatsContext.Provider>
  );
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext);
}
