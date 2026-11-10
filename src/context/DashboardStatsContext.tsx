'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { DashboardStats } from '@/types';
import type { ReactNode } from 'react';
import { getDashboardStats } from '@/services/api';
import { NETWORK_EVENT } from '@/lib/errors';

const DashboardStatsContext = createContext<DashboardStats | null>(null);

interface DashboardStatsProviderProps {
  initialStats?: DashboardStats | null;
  children: ReactNode;
}

export function DashboardStatsProvider({ initialStats = null, children }: DashboardStatsProviderProps) {
  const [clientStats, setClientStats] = useState<DashboardStats | null>(null);
  const clientStatsRef = useRef<DashboardStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadStats = () => {
      getDashboardStats()
        .then((next) => {
          if (!cancelled) {
            clientStatsRef.current = next;
            setClientStats(next);
          }
        })
        .catch(() => {
          /* keep SSR / previous values */
        });
    };

    loadStats();

    const handleNetworkRestored = () => {
      if (!cancelled && !clientStatsRef.current) {
        loadStats();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(NETWORK_EVENT.RESTORED, handleNetworkRestored);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(NETWORK_EVENT.RESTORED, handleNetworkRestored);
      }
    };
  }, []);

  const stats = clientStats ?? initialStats;

  return (
    <DashboardStatsContext.Provider value={stats}>
      {children}
    </DashboardStatsContext.Provider>
  );
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext);
}
