'use client';

import { App, ConfigProvider } from 'antd';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import { NetworkProvider } from '@/context/NetworkContext';
import type { ReactNode } from 'react';

import AntdStyleRegistry from '@/Components/common/AntdStyleRegistry';
import { AntdAppExtractor } from '@/Components/common/AntdAppExtractor';
import NetworkStatusBanner from '@/Components/common/NetworkStatusBanner';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdStyleRegistry>
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
                fontFamily: "var(--font-poppins), var(--font-noto-ethiopic), system-ui, sans-serif",
                zIndexPopupBase: 2000,
              },
            }}
          >
            <App>
              <AntdAppExtractor />
              <ToastProvider>
                <NetworkProvider>
                  <NetworkStatusBanner />
                  {children}
                </NetworkProvider>
              </ToastProvider>
            </App>
          </ConfigProvider>
        </UserProvider>
      </ThemeProvider>
    </AntdStyleRegistry>
  );
}
