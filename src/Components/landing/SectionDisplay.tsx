'use client';

import React, { useEffect, useRef } from 'react';
import type { LandingDisplayStyle } from '@/types';
import './SectionDisplay.css';

type Props = {
  style?: LandingDisplayStyle;
  className?: string;
  children: React.ReactNode;
};

/** Renders children as grid, horizontal carousel, or auto-scrolling marquee. */
export default function SectionDisplay({ style = 'grid', className = '', children }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const mode = style === 'static' || style === 'feed' ? 'grid' : style;

  useEffect(() => {
    if (mode !== 'marquee' || !trackRef.current) return;
    const el = trackRef.current;
    let raf = 0;
    let paused = false;
    const mobileMq = window.matchMedia('(max-width: 767px)');

    const tick = () => {
      if (!paused && !mobileMq.matches) {
        el.scrollLeft += 0.6;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, [mode]);

  if (mode === 'carousel' || mode === 'marquee') {
    return (
      <div
        ref={trackRef}
        className={`lp-display lp-display--${mode} ${className}`.trim()}
        data-display={mode}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`lp-display lp-display--grid ${className}`.trim()} data-display="grid">
      {children}
    </div>
  );
}
