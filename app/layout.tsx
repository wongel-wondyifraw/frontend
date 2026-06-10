import './globals.css';
import Providers from './providers';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'CMS',
  description: 'Church Management System',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
