'use client';

import React, { createContext, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { App } from 'antd';
import { bindAppMessage } from '@/lib/app-message';

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
      if (title) {
        notification[type]({ title, description: content });
      } else {
        message[type](content);
      }
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
