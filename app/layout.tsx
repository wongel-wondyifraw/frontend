import './globals.css';
import Providers from './providers';
import type { ReactNode } from 'react';
import { Inter, Poppins, Noto_Sans_Ethiopic } from 'next/font/google';

/* Variable Inter is critical for landing LCP; keep preload on. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/* Admin UI fonts — available after first paint, not render-blocking. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: false,
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-ethiopic',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: 'Goro Full Gospel Church',
  description: 'Church management for Goro Full Gospel Church — powered by Shepherd.One',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${notoSansEthiopic.variable}`}
    >
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
