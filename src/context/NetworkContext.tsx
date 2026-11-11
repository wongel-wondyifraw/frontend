'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { API_BASE_URL } from '@/services/api';
import {
  NETWORK_EVENT,
  NETWORK_RESTORED_MESSAGE,
  NETWORK_UNAVAILABLE_MESSAGE,
  emitNetworkSignal,
} from '@/lib/errors';
import { useToast } from '@/context/ToastContext';

export type ConnectivityStatus = 'online' | 'offline' | 'restored';

interface NetworkContextValue {
  status: ConnectivityStatus;
  isOnline: boolean;
  checking: boolean;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

const INITIAL_BACKOFF_MS = 5000;
const MAX_BACKOFF_MS = 30000;
const RESTORED_DISPLAY_MS = 3500;

export function NetworkProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ConnectivityStatus>('online');
  const [checking, setChecking] = useState(false);

  const statusRef = useRef<ConnectivityStatus>('online');
  const probeInFlightRef = useRef<Promise<boolean> | null>(null);
  const probeTimerRef = useRef<number | undefined>(undefined);
  const restoredTimerRef = useRef<number | undefined>(undefined);
  const backoffMsRef = useRef<number>(INITIAL_BACKOFF_MS);
  const mountedRef = useRef(true);

  const clearProbeTimer = useCallback(() => {
    if (probeTimerRef.current !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(probeTimerRef.current);
      probeTimerRef.current = undefined;
    }
  }, []);

  const clearRestoredTimer = useCallback(() => {
    if (restoredTimerRef.current !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(restoredTimerRef.current);
      restoredTimerRef.current = undefined;
    }
  }, []);

  const probeHealth = useCallback(async (timeoutMs = 3000): Promise<boolean> => {
    if (typeof window === 'undefined') return true;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return false;
    }
    if (probeInFlightRef.current) {
      return probeInFlightRef.current;
    }

    const promise = (async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        window.clearTimeout(timeoutId);
        probeInFlightRef.current = null;
      }
    })();

    probeInFlightRef.current = promise;
    return promise;
  }, []);

  const scheduleOfflineProbeRef = useRef<(delayMs?: number) => void>(() => {});

  const enterOffline = useCallback(() => {
    if (!mountedRef.current) return;
    clearRestoredTimer();
    const prevStatus = statusRef.current;
    statusRef.current = 'offline';
    setStatus('offline');

    if (prevStatus !== 'offline') {
      backoffMsRef.current = INITIAL_BACKOFF_MS;
      showToast('error', NETWORK_UNAVAILABLE_MESSAGE);
    }

    scheduleOfflineProbeRef.current(backoffMsRef.current);
  }, [clearRestoredTimer, showToast]);

  const markRestored = useCallback(() => {
    if (!mountedRef.current) return;
    if (statusRef.current !== 'offline') return;

    clearProbeTimer();
    clearRestoredTimer();
    backoffMsRef.current = INITIAL_BACKOFF_MS;
    statusRef.current = 'restored';
    setStatus('restored');
    showToast('success', NETWORK_RESTORED_MESSAGE);
    emitNetworkSignal(NETWORK_EVENT.RESTORED);

    if (typeof window !== 'undefined') {
      restoredTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        if (statusRef.current === 'restored') {
          statusRef.current = 'online';
          setStatus('online');
        }
      }, RESTORED_DISPLAY_MS);
    }
  }, [clearProbeTimer, clearRestoredTimer, showToast]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!mountedRef.current) return false;
    setChecking(true);
    try {
      const ok = await probeHealth(4000);
      if (!mountedRef.current) return ok;
      if (ok) {
        if (statusRef.current === 'offline') {
          markRestored();
        }
        return true;
      }
      enterOffline();
      return false;
    } finally {
      if (mountedRef.current) {
        setChecking(false);
      }
    }
  }, [enterOffline, markRestored, probeHealth]);

  useEffect(() => {
    scheduleOfflineProbeRef.current = (delayMs = backoffMsRef.current) => {
      clearProbeTimer();
      if (typeof window === 'undefined' || !mountedRef.current) return;
      if (statusRef.current !== 'offline') return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      probeTimerRef.current = window.setTimeout(async () => {
        if (!mountedRef.current || statusRef.current !== 'offline') return;
        const ok = await probeHealth(3000);
        if (!mountedRef.current || statusRef.current !== 'offline') return;
        if (ok) {
          markRestored();
          return;
        }
        backoffMsRef.current = Math.min(
          backoffMsRef.current * 2,
          MAX_BACKOFF_MS,
        );
        scheduleOfflineProbeRef.current(backoffMsRef.current);
      }, delayMs);
    };
  }, [clearProbeTimer, markRestored, probeHealth]);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === 'undefined') return undefined;

    const handleBrowserOffline = () => {
      enterOffline();
    };

    const handleBrowserOnline = () => {
      if (statusRef.current === 'offline') {
        void checkConnection();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        statusRef.current === 'offline'
      ) {
        void checkConnection();
      }
    };

    const handleUnavailableSignal = () => {
      if (statusRef.current === 'offline') {
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        enterOffline();
        return;
      }
      void probeHealth(2500).then((ok) => {
        if (!mountedRef.current) return;
        if (!ok) {
          enterOffline();
        }
      });
    };

    const handleReachableSignal = () => {
      if (statusRef.current === 'offline') {
        markRestored();
      }
    };

    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('online', handleBrowserOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener(NETWORK_EVENT.UNAVAILABLE, handleUnavailableSignal);
    window.addEventListener(NETWORK_EVENT.REACHABLE, handleReachableSignal);

    let initTimer: number | undefined;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      initTimer = window.setTimeout(() => {
        if (mountedRef.current && navigator.onLine === false) {
          enterOffline();
        }
      }, 0);
    }

    return () => {
      mountedRef.current = false;
      if (initTimer !== undefined) {
        window.clearTimeout(initTimer);
      }
      clearProbeTimer();
      clearRestoredTimer();
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('online', handleBrowserOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(
        NETWORK_EVENT.UNAVAILABLE,
        handleUnavailableSignal,
      );
      window.removeEventListener(NETWORK_EVENT.REACHABLE, handleReachableSignal);
    };
  }, [
    checkConnection,
    clearProbeTimer,
    clearRestoredTimer,
    enterOffline,
    markRestored,
    probeHealth,
  ]);

  const value = useMemo<NetworkContextValue>(
    () => ({
      status,
      isOnline: status !== 'offline',
      checking,
      checkConnection,
    }),
    [status, checking, checkConnection],
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return ctx;
}
