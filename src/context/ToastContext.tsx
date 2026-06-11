'use client';

import React, { createContext, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { message, notification } from 'antd';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextValue {
  showToast: (type: ToastType, content: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((type: ToastType, content: string, title?: string) => {
    if (title) {
      notification[type]({ title, description: content });
    } else {
      message[type](content);
    }
  }, []);

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
