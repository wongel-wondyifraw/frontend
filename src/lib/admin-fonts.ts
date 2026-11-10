import { Poppins, Noto_Sans_Ethiopic } from 'next/font/google';

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
});

export const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-ethiopic',
  display: 'swap',
  preload: false,
});

export const adminFontClassName = `${poppins.variable} ${notoSansEthiopic.variable} ${poppins.className}`;

export const ADMIN_FONT_STACK = `${poppins.style.fontFamily}, ${notoSansEthiopic.style.fontFamily}, system-ui, sans-serif`;

