'use client';

import Image from 'next/image';
import Link from 'next/link';
import './AppLogo.css';

const LOGO_SIZES = {
  full: { src: '/Logo.svg', width: 160, height: 40, className: 'brand-logo' },
  navbar: { src: '/Logo.svg', width: 140, height: 36, className: 'logo-icon' },
  topbar: { src: '/Logo-Half-Dark.svg', width: 120, height: 32, className: 'topbar-logo' },
} as const;

type LogoVariant = keyof typeof LOGO_SIZES;

interface AppLogoProps {
  variant?: LogoVariant;
  href?: string;
  priority?: boolean;
  onClick?: () => void;
}

export default function AppLogo({ variant = 'full', href, priority = false, onClick }: AppLogoProps) {
  const config = LOGO_SIZES[variant] || LOGO_SIZES.full;

  const image = (
    <Image
      src={config.src}
      alt="Shepherd.One"
      width={config.width}
      height={config.height}
      className={config.className}
      priority={priority}
      unoptimized
    />
  );

  if (href) {
    return (
      <Link href={href} className="app-logo-link" aria-label="Shepherd.One home">
        {image}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className="app-logo-link" onClick={onClick} aria-label="Shepherd.One home">
        {image}
      </button>
    );
  }

  return image;
}
