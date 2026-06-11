'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  dismissNotification,
  subscribeNotificationStream,
} from '@/services/api';
import { useUser } from '@/context/UserContext';
import { hasPermission } from '@/types';

export interface AppNotification {
  id: string;
  kind: string;
  severity: string;
  title: string;
  message: string;
  href?: string | null;
  read_at?: string | null;
  created_at: string;
}

interface NotificationsContextValue {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !hasPermission(user, 'notifications.read')) return;
    try {
      setLoading(true);
      const data = await getNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !hasPermission(user, 'notifications.read')) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    refresh();

    cleanupRef.current?.();
    cleanupRef.current = subscribeNotificationStream((event) => {
      if (event.type === 'notification' && event.notification) {
        const n = event.notification as AppNotification;
        setItems((prev) => [n, ...prev.filter((i) => i.id !== n.id)].slice(0, 20));
        setUnreadCount((c) => c + 1);
      }
    });

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [user, refresh]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  };

  const dismiss = async (id: string) => {
    await dismissNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, loading, refresh, markRead, markAllRead, dismiss }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
