'use client';

import { App, ConfigProvider } from 'antd';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1E40AF',
              controlHeight: 42,
              controlHeightLG: 48,
              controlHeightSM: 36,
              fontSize: 14,
              borderRadius: 8,
            },
          }}
        >
          <App>
            <ToastProvider>{children}</ToastProvider>
          </App>
        </ConfigProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
