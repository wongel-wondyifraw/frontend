'use client';

import { App, ConfigProvider } from 'antd';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import type { ReactNode } from 'react';

import { AntdAppExtractor } from '@/Components/common/AntdAppExtractor';

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
              fontFamily: "'Poppins', 'Noto Sans Ethiopic', system-ui, sans-serif",
            },
          }}
        >
          <App>
            <AntdAppExtractor />
            <ToastProvider>{children}</ToastProvider>
          </App>
        </ConfigProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
