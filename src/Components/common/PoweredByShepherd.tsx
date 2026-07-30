'use client';

import { PLATFORM } from '@/lib/tenant';
import './PoweredByShepherd.css';

interface PoweredByShepherdProps {
  className?: string;
  /** Compact single-line mark for sidebars / tight footers */
  compact?: boolean;
}

export default function PoweredByShepherd({ className = '', compact = false }: PoweredByShepherdProps) {
  return (
    <p
      className={`powered-by-shepherd ${compact ? 'powered-by-shepherd--compact' : ''} ${className}`.trim()}
      aria-label={PLATFORM.poweredByLabel}
    >
      {PLATFORM.poweredByLabel}
    </p>
  );
}
