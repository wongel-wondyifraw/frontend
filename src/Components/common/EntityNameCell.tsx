'use client';

import React from 'react';
import { Avatar } from 'antd';
import './EntityNameCell.css';

type EntityNameCellProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  avatarSrc?: string | null;
  initials?: string;
  avatarColor?: string;
};

/**
 * Avatar + primary name (+ optional subtitle) for manage tables.
 * Keeps the name readable on narrow viewports.
 */
export default function EntityNameCell({
  title,
  subtitle,
  meta,
  avatarSrc,
  initials,
  avatarColor = '#1565c0',
}: EntityNameCellProps) {
  return (
    <div className="entity-name-cell">
      <Avatar
        className="entity-name-cell-avatar"
        src={avatarSrc || undefined}
        style={{ backgroundColor: avatarColor, color: '#fff', fontWeight: 600 }}
        crossOrigin="use-credentials"
      >
        {initials}
      </Avatar>
      <div className="entity-name-cell-text">
        <div className="entity-name-cell-title">{title}</div>
        {subtitle ? <div className="entity-name-cell-subtitle">{subtitle}</div> : null}
        {meta ? <div className="entity-name-cell-meta">{meta}</div> : null}
      </div>
    </div>
  );
}
