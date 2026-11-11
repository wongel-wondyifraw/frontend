'use client';

import React, { useEffect, useRef, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';

interface AdminFontWrapperProps {
  className: string;
  fontFamily: string;
  children: ReactNode;
}

export default function AdminFontWrapper({
  className,
  fontFamily,
  children,
}: AdminFontWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const computed = getComputedStyle(el);
    const rootStyle = document.documentElement.style;
    const poppinsVar = computed.getPropertyValue('--font-poppins').trim();
    const ethiopicVar = computed.getPropertyValue('--font-noto-ethiopic').trim();
    if (poppinsVar) rootStyle.setProperty('--font-poppins', poppinsVar);
    if (ethiopicVar) rootStyle.setProperty('--font-noto-ethiopic', ethiopicVar);
    return () => {
      rootStyle.removeProperty('--font-poppins');
      rootStyle.removeProperty('--font-noto-ethiopic');
    };
  }, [className]);

  return (
    <div
      ref={containerRef}
      className={`admin-font-scope ${className}`.trim()}
      style={{ minHeight: '100%' }}
    >
      <ConfigProvider
        theme={{
          token: {
            fontFamily,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </div>
  );
}

