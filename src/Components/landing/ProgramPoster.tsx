'use client';

import React from 'react';
import Image from 'next/image';
import { TENANT } from '@/lib/tenant';
import './ProgramPoster.css';

export type ProgramPosterVariant = 'wave' | 'geometric';

export const PROGRAM_PERSON_TEMPLATE = '/landing/program-person-template.jpg';

type Props = {
  title: string;
  text?: string;
  tag?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  /** Uploaded / remote program image. Falls back to person template on wave posters. */
  imageUrl?: string | null;
  variant?: ProgramPosterVariant;
  siteLabel?: string;
  className?: string;
};

function titleParts(title: string): { lead: string; mid: string; trail: string } {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { lead: title || 'Program', mid: '', trail: '' };
  }
  if (words.length === 2) {
    return { lead: words[0], mid: words[1], trail: '' };
  }
  const midStart = Math.floor(words.length / 3) || 1;
  const midEnd = Math.max(midStart + 1, words.length - 1);
  return {
    lead: words.slice(0, midStart).join(' '),
    mid: words.slice(midStart, midEnd).join(' '),
    trail: words.slice(midEnd).join(' '),
  };
}

function WaveDivider() {
  return (
    <svg
      className="program-poster-wave"
      viewBox="0 0 120 400"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        className="program-poster-wave-fill program-poster-wave-fill--deep"
        d="M40 0 C70 60 20 120 55 180 C90 240 35 300 70 360 C85 385 95 395 120 400 L120 0 Z"
      />
      <path
        className="program-poster-wave-fill program-poster-wave-fill--mid"
        d="M55 0 C85 70 40 130 75 190 C110 250 50 310 85 370 C95 390 105 398 120 400 L120 0 Z"
      />
      <path
        className="program-poster-wave-stroke"
        d="M48 0 C78 65 30 125 65 185 C100 245 45 305 80 365"
        fill="none"
      />
      <path
        className="program-poster-wave-fill program-poster-wave-fill--light"
        d="M78 0 C100 80 70 140 95 200 C115 250 85 320 105 380 C110 392 115 398 120 400 L120 0 Z"
      />
    </svg>
  );
}

type TileTone = 'navy' | 'blue' | 'cream' | 'ink';
type TileMotif =
  | 'semi-up'
  | 'semi-down'
  | 'semi-left'
  | 'semi-right'
  | 'arcs'
  | 'arcs-cream'
  | 'solid';

function GeometricTile({
  tone,
  motif,
  className = '',
}: {
  tone: TileTone;
  motif: TileMotif;
  className?: string;
}) {
  return (
    <div
      className={`program-poster-tile program-poster-tile--${tone} program-poster-tile--${motif} ${className}`.trim()}
      aria-hidden
    >
      {(motif === 'arcs' || motif === 'arcs-cream') && (
        <svg viewBox="0 0 80 80" aria-hidden>
          <path d="M8 72 A40 40 0 0 1 72 72" fill="none" stroke="currentColor" strokeWidth="3.5" />
          <path d="M18 72 A30 30 0 0 1 62 72" fill="none" stroke="currentColor" strokeWidth="3.5" />
          <path d="M28 72 A20 20 0 0 1 52 72" fill="none" stroke="currentColor" strokeWidth="3.5" />
        </svg>
      )}
      {motif.startsWith('semi') && <span className="program-poster-semi" />}
    </div>
  );
}

function HoverOverlay({
  title,
  text,
  tag,
  eventDate,
  eventTime,
  location,
}: {
  title: string;
  text?: string;
  tag?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
}) {
  const date = eventDate?.trim();
  const time = eventTime?.trim();
  const place = location?.trim();
  const hasSchedule = Boolean(date || time || place || tag || text);

  return (
    <div className="program-poster-hover" aria-hidden>
      <div className="program-poster-hover-panel">
        <p className="program-poster-hover-title">{title}</p>
        {hasSchedule ? (
          <ul className="program-poster-hover-meta">
            {date && (
              <li>
                <span>{date}</span>
              </li>
            )}
            {time && (
              <li>
                <span>{time}</span>
              </li>
            )}
            {place && (
              <li>
                <span>{place}</span>
              </li>
            )}
            {tag && (
              <li>
                <span>{tag}</span>
              </li>
            )}
          </ul>
        ) : (
          <p className="program-poster-hover-fallback">Date &amp; time coming soon</p>
        )}
        {text && <p className="program-poster-hover-text">{text}</p>}
      </div>
    </div>
  );
}

/**
 * Reusable church program poster — landscape banner (~2:1).
 * - `wave`: media + swoosh + copy (when media is attached)
 * - `geometric`: conference tile layout (when no media / “banner less”)
 * Hover: blue overlay animates in with date / time / location.
 */
export default function ProgramPoster({
  title,
  text,
  tag,
  eventDate,
  eventTime,
  location,
  imageUrl,
  variant = 'wave',
  siteLabel,
  className = '',
}: Props) {
  const hasMedia = Boolean(imageUrl?.trim());
  const mediaSrc = hasMedia ? imageUrl!.trim() : PROGRAM_PERSON_TEMPLATE;
  const parts = titleParts(title);
  const site = (siteLabel || TENANT.shortName || 'Church').toUpperCase();
  const resolvedVariant: ProgramPosterVariant = hasMedia ? variant : 'geometric';

  const overlay = (
    <HoverOverlay
      title={title}
      text={text}
      tag={tag}
      eventDate={eventDate}
      eventTime={eventTime}
      location={location}
    />
  );

  if (resolvedVariant === 'geometric') {
    return (
      <article
        className={`program-poster program-poster--geometric ${className}`.trim()}
        aria-label={title}
      >
        <div className="program-poster-geo-side program-poster-geo-side--left" aria-hidden>
          <GeometricTile tone="navy" motif="arcs-cream" />
          <GeometricTile tone="blue" motif="semi-up" />
          <GeometricTile tone="cream" motif="arcs" />
        </div>

        <div className="program-poster-geo-center">
          <div className="program-poster-geo-copy">
            {parts.lead && <p className="program-poster-geo-lead">{parts.lead}</p>}
            <h3 className="program-poster-geo-title">{parts.mid || title}</h3>
            {parts.trail && <p className="program-poster-geo-year">{parts.trail}</p>}
            {tag && <p className="program-poster-geo-meta">{tag}</p>}
            {text && <p className="program-poster-geo-text">{text}</p>}
            {!tag && !text && site && <p className="program-poster-geo-place">{site}</p>}
          </div>
        </div>

        <div className="program-poster-geo-side program-poster-geo-side--right" aria-hidden>
          <GeometricTile tone="cream" motif="arcs" />
          <GeometricTile tone="navy" motif="arcs-cream" />
          <GeometricTile tone="blue" motif="semi-left" className="program-poster-tile--hero" />
          <GeometricTile tone="cream" motif="semi-down" />
          <GeometricTile tone="navy" motif="arcs-cream" />
          <GeometricTile tone="blue" motif="solid" />
        </div>
        {overlay}
      </article>
    );
  }

  return (
    <article
      className={`program-poster program-poster--wave ${className}`.trim()}
      aria-label={title}
    >
      <div className="program-poster-media">
        <div className={`program-poster-photo${hasMedia ? '' : ' program-poster-photo--template'}`}>
          <Image
            src={mediaSrc}
            alt={hasMedia ? title : 'Community'}
            fill
            sizes="(max-width: 768px) 90vw, 360px"
            className="program-poster-photo-img"
            unoptimized={mediaSrc.startsWith('http')}
          />
        </div>
      </div>

      <div className="program-poster-divider" aria-hidden>
        <WaveDivider />
      </div>

      <div className="program-poster-copy">
        <p className="program-poster-site">{site}</p>
        <h3 className="program-poster-headline">
          {parts.lead && <span className="program-poster-headline-accent">{parts.lead}</span>}
          {parts.mid && <span className="program-poster-headline-ink">{parts.mid}</span>}
          {parts.trail && <span className="program-poster-headline-accent">{parts.trail}</span>}
          {!parts.mid && !parts.trail && (
            <span className="program-poster-headline-accent">{parts.lead}</span>
          )}
        </h3>
        {text && <p className="program-poster-body">{text}</p>}
        <div className="program-poster-corner" aria-hidden />
      </div>
      {overlay}
    </article>
  );
}

export function posterStyleToVariant(
  style?: 'navy' | 'emerald' | 'warm' | string | null,
): ProgramPosterVariant {
  if (style === 'emerald') return 'geometric';
  return 'wave';
}
