'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TENANT } from '@/lib/tenant';
import PoweredByShepherd from './PoweredByShepherd';
import './AppLogo.css';

const LOGO_SIZES = {
  full: { width: 160, height: 40, className: 'brand-logo' },
  navbar: { width: 140, height: 36, className: 'logo-icon' },
  topbar: { width: 120, height: 32, className: 'topbar-logo' },
} as const;

type LogoVariant = keyof typeof LOGO_SIZES;

interface AppLogoProps {
  variant?: LogoVariant;
  href?: string;
  priority?: boolean;
  onClick?: () => void;
  /** Show “Powered by Shepherd.One” beside the tenant logo */
  showPoweredBy?: boolean;
}

export default function AppLogo({
  variant = 'full',
  href,
  priority = false,
  onClick,
  showPoweredBy = false,
}: AppLogoProps) {
  const config = LOGO_SIZES[variant] || LOGO_SIZES.full;

  const image = (
    <Image
      src={TENANT.logoSrc}
      alt={TENANT.name}
      width={config.width}
      height={config.height}
      className={config.className}
      priority={priority}
      sizes={`${config.width}px`}
      quality={75}
      style={{ width: 'auto', height: 'auto', maxHeight: config.height }}
    />
  );

  const mark = showPoweredBy ? (
    <span className="app-logo-stack app-logo-stack--inline">
      {image}
      <PoweredByShepherd compact />
    </span>
  ) : (
    image
  );

  if (href) {
    return (
      <Link href={href} className="app-logo-link" aria-label={`${TENANT.name} home`}>
        {mark}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className="app-logo-link" onClick={onClick} aria-label={`${TENANT.name} home`}>
        {mark}
      </button>
    );
  }

  return mark;
}
