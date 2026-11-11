'use client';

import React, { createContext, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { App } from 'antd';
import {
  bindAppMessage,
  message as deduplicatedMessage,
} from '@/lib/app-message';
import {
  NETWORK_RESTORED_MESSAGE,
  NETWORK_UNAVAILABLE_MESSAGE,
} from '@/lib/errors';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextValue {
  showToast: (type: ToastType, content: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** Must render under antd <App> so message/notification consume theme context. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { message, notification } = App.useApp();

  // Bind during render so early effects in children can toast safely
  bindAppMessage(message);

  useEffect(() => {
    bindAppMessage(message);
  }, [message]);

  const showToast = useCallback(
    (type: ToastType, content: string, title?: string) => {
      const trimmed = content.trim();
      const key =
        trimmed === NETWORK_UNAVAILABLE_MESSAGE
          ? 'cms-network-unavailable'
          : trimmed === NETWORK_RESTORED_MESSAGE
            ? 'cms-network-restored'
            : undefined;

      if (title) {
        notification[type]({ key, title, description: content });
        return;
      }

      if (key === 'cms-network-unavailable' || key === 'cms-network-restored') {
        if (type === 'success') {
          deduplicatedMessage.success(content);
        } else if (type === 'error') {
          deduplicatedMessage.error(content);
        } else {
          message[type](content);
        }
        return;
      }

      message[type](content);
    },
    [message, notification],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
