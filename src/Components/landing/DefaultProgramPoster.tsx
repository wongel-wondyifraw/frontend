'use client';

import React from 'react';
import ProgramPoster, { posterStyleToVariant } from './ProgramPoster';

type PosterStyle = 'navy' | 'emerald' | 'warm';

type Props = {
  title: string;
  tag?: string;
  text?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  style?: PosterStyle;
  className?: string;
};

/**
 * @deprecated Prefer `ProgramPoster` directly.
 * Kept as a thin wrapper for existing MediaBlock fallbacks.
 */
export default function DefaultProgramPoster({
  title,
  tag,
  text,
  eventDate,
  eventTime,
  location,
  imageUrl,
  style = 'navy',
  className = '',
}: Props) {
  return (
    <ProgramPoster
      title={title}
      tag={tag}
      text={text}
      eventDate={eventDate}
      eventTime={eventTime}
      location={location}
      imageUrl={imageUrl}
      variant={posterStyleToVariant(style)}
      className={className}
    />
  );
}
