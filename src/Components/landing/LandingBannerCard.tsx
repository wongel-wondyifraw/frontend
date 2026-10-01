'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  UserOutlined,
  CalendarOutlined,
  CompassOutlined,
  BookOutlined,
  HeartOutlined,
  TeamOutlined,
  StarOutlined,
  FireOutlined,
  BulbOutlined,
  HomeOutlined,
  SoundOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WifiOutlined,
  CoffeeOutlined,
  ReadOutlined,
  BankOutlined,
  GiftOutlined,
  MessageOutlined,
  RocketOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { getImageUrl } from '@/lib/media-url';
import {
  formatLandingDateRange,
  formatLandingTime,
} from '@/lib/landing-defaults';
import type { LandingMediaItem } from '@/types';

function getMinisterNames(item: LandingMediaItem): string[] {
  if (Array.isArray(item.ministers) && item.ministers.length) {
    return item.ministers.map((m) => m.trim()).filter(Boolean);
  }
  if (item.lead?.trim()) {
    return item.lead
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function renderProgramIcon(iconString?: string | null) {
  switch (iconString) {
    case 'compass':
      return <CompassOutlined />;
    case 'book':
      return <BookOutlined />;
    case 'heart':
      return <HeartOutlined />;
    case 'star':
      return <StarOutlined />;
    case 'team':
      return <TeamOutlined />;
    case 'fire':
      return <FireOutlined />;
    case 'bulb':
      return <BulbOutlined />;
    case 'globe':
      return <GlobalOutlined />;
    case 'home':
      return <HomeOutlined />;
    case 'sound':
      return <SoundOutlined />;
    case 'crown':
      return <CrownOutlined />;
    case 'check':
      return <CheckCircleOutlined />;
    case 'info':
      return <InfoCircleOutlined />;
    case 'play':
      return <PlayCircleOutlined />;
    case 'shield':
      return <SafetyOutlined />;
    case 'lightning':
      return <ThunderboltOutlined />;
    case 'trophy':
      return <TrophyOutlined />;
    case 'user':
      return <UserOutlined />;
    case 'wifi':
      return <WifiOutlined />;
    case 'coffee':
      return <CoffeeOutlined />;
    case 'read':
      return <ReadOutlined />;
    case 'bank':
      return <BankOutlined />;
    case 'gift':
      return <GiftOutlined />;
    case 'message':
      return <MessageOutlined />;
    case 'rocket':
      return <RocketOutlined />;
    default:
      return null;
  }
}

/** Simple abstract SVG art in brand blues for programs without a photo. */
function AbstractBannerArt({ index = 0 }: { index?: number }) {
  const variant = index % 3;
  const uid = `lp-abs-${index}`;

  return (
    <svg
      className="lp-banner-abstract"
      viewBox="0 0 640 220"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003198" />
          <stop offset="55%" stopColor="#1f49bb" />
          <stop offset="100%" stopColor="#3b6fd4" />
        </linearGradient>
        <linearGradient id={`${uid}-soft`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d3e4fe" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e5eeff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="640" height="220" fill={`url(#${uid}-bg)`} />
      <rect width="640" height="220" fill={`url(#${uid}-soft)`} />

      {variant === 0 && (
        <>
          <circle cx="520" cy="40" r="90" fill="#d3e4fe" opacity="0.18" />
          <circle cx="560" cy="180" r="70" fill="#ffffff" opacity="0.08" />
          <path d="M0 160 Q160 110 320 150 T640 130 L640 220 L0 220 Z" fill="#0a1a4a" opacity="0.28" />
          <path d="M0 180 Q200 140 400 175 T640 160 L640 220 L0 220 Z" fill="#dce9ff" opacity="0.16" />
          <rect x="48" y="48" width="72" height="8" rx="4" fill="#ffffff" opacity="0.35" />
          <rect x="48" y="68" width="44" height="8" rx="4" fill="#d3e4fe" opacity="0.45" />
        </>
      )}

      {variant === 1 && (
        <>
          <polygon points="420,0 640,0 640,220 360,220" fill="#002a7a" opacity="0.35" />
          <polygon points="480,0 640,0 640,160" fill="#d3e4fe" opacity="0.14" />
          <circle cx="120" cy="110" r="56" fill="none" stroke="#dce9ff" strokeWidth="3" opacity="0.35" />
          <circle cx="120" cy="110" r="28" fill="#ffffff" opacity="0.12" />
          <rect x="200" y="70" width="120" height="6" rx="3" fill="#ffffff" opacity="0.3" />
          <rect x="200" y="90" width="80" height="6" rx="3" fill="#d3e4fe" opacity="0.4" />
          <rect x="200" y="110" width="96" height="6" rx="3" fill="#ffffff" opacity="0.22" />
        </>
      )}

      {variant === 2 && (
        <>
          <circle cx="80" cy="-10" r="100" fill="#d3e4fe" opacity="0.16" />
          <circle cx="580" cy="200" r="110" fill="#002a7a" opacity="0.3" />
          <path d="M0 0 L180 0 L0 180 Z" fill="#ffffff" opacity="0.06" />
          <path d="M640 40 C520 80 480 140 420 220 L640 220 Z" fill="#e5eeff" opacity="0.12" />
          <circle cx="320" cy="110" r="48" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.25" />
          <circle cx="320" cy="110" r="18" fill="#dce9ff" opacity="0.35" />
        </>
      )}
    </svg>
  );
}

interface LandingBannerCardProps {
  item: LandingMediaItem;
  index: number;
  type?: 'program' | 'project' | 'ministry';
  prefersReducedMotion?: boolean | null;
}

/* Custom SVG icon for project footer */
function VolunteerRibbonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1d4ed8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l6.6-6.6a5 5 0 0 0-7-7l-.6.6-.6-.6a5 5 0 0 0-7 7l6.6 6.6a1 1 0 0 0 1.4 0z" />
      <path d="m12 12-4-4a3 3 0 0 0-4.2 4.2l5.6 5.6" />
      <path d="m16 8 2 2" />
    </svg>
  );
}

export default function LandingBannerCard({
  item,
  index,
  type = 'program',
  prefersReducedMotion = false,
}: LandingBannerCardProps) {
  const imageUrl = item.image_url ? getImageUrl(item.image_url) : null;
  const hasImage = Boolean(imageUrl);
  const isMinistry = type === 'ministry';

  const progress = item.progress ?? (hasImage ? Math.min(60 + (index * 11) % 35, 95) : 94);
  const capacity = item.capacity ?? 200;
  const enrolled = item.enrolled ?? Math.round((capacity * progress) / 100);
  const avatars = item.avatars && item.avatars.length > 0 ? item.avatars : ['JD', 'RK', '+38'];

  const mediaChrome = (
    <>
      {item.tag ? (
        <div className="lp-banner-top-tags">
          <div className="lp-banner-left-tags">
            <span className="lp-pill-badge lp-pill-badge--white-blue">{item.tag}</span>
            {!isMinistry && item.status ? (
              <span className="lp-pill-badge lp-pill-badge--green-dot">
                <span className="lp-badge-dot" />
                {item.status}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="lp-banner-bottom-text">
        {!isMinistry && (item.cohort || item.ref) ? (
          <div className="lp-banner-cohort">{item.cohort || item.ref}</div>
        ) : null}
        <h3 className="lp-banner-title">{item.title}</h3>
      </div>
    </>
  );

  let metaRow: React.ReactNode = null;
  if (!isMinistry) {
    const ministers = getMinisterNames(item);
    const dates = formatLandingDateRange(item);
    const time = formatLandingTime(item.event_time);
    const schedule = [dates, time].filter(Boolean).join(' · ');
    if (ministers.length || schedule) {
      metaRow = (
        <div className="lp-banner-meta-row">
          {ministers.map((name) => (
            <div key={name} className="lp-banner-meta-item">
              <UserOutlined />
              <span>
                <strong>{name}</strong>
              </span>
            </div>
          ))}
          {schedule ? (
            <div className="lp-banner-meta-item">
              <CalendarOutlined />
              <span>
                {item.event_date_end && item.event_date_end !== item.event_date
                  ? 'Dates'
                  : 'Starts'}
                : <strong>{schedule}</strong>
              </span>
            </div>
          ) : null}
        </div>
      );
    }
  }

  if (hasImage && imageUrl) {
    return (
      <motion.div
        className={`lp-banner-card lp-banner-card--image${isMinistry ? ' lp-banner-card--ministry' : ''}`}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: 0.5,
          delay: (index % 4) * 0.1,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <div className="lp-banner-media">
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 880px) 100vw, 50vw"
            className="lp-banner-img"
            quality={75}
            unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('unsplash')}
          />
          <div className="lp-banner-overlay" />
          {mediaChrome}
        </div>

        <div className="lp-banner-body">
          {item.text ? <p className="lp-banner-desc">{item.text}</p> : null}
          {metaRow}
          {type === 'project' ? (
            <>
              <div className="lp-banner-progress-block">
                <div className="lp-banner-progress-head">
                  <span className="lp-progress-head-label">Participant Capacity</span>
                  <span className="lp-progress-head-value">
                    {enrolled} / {capacity} Enrolled{' '}
                    <span className="lp-progress-pct">({progress}%)</span>
                  </span>
                </div>
                <div className="lp-banner-progress-track">
                  <motion.div
                    className="lp-banner-progress-fill lp-banner-progress-fill--blue"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
              <div className="lp-banner-footer">
                <div className="lp-avatar-stack">
                  {avatars.map((av, idx) => (
                    <span key={idx} className={`lp-avatar-circle lp-avatar-circle--${idx % 3}`}>
                      {av}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`lp-banner-card lp-banner-card--no-image${isMinistry ? ' lp-banner-card--ministry' : ''}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: (index % 4) * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <div className="lp-banner-media lp-banner-media--abstract">
        <AbstractBannerArt index={index} />
        <div className="lp-banner-overlay lp-banner-overlay--light" />
        {(() => {
          const iconNode = renderProgramIcon(item.icon);
          if (!iconNode) return null;
          return (
            <div className="lp-banner-icon-overlay" aria-hidden>
              <div className="lp-banner-icon-orb">
                <span className="lp-banner-icon-orb__glyph">{iconNode}</span>
              </div>
            </div>
          );
        })()}
        {mediaChrome}
      </div>

      <div className="lp-banner-body">
        {item.text ? <p className="lp-banner-desc">{item.text}</p> : null}
        {metaRow}
        {type === 'project' ? (
          <>
            <div className="lp-banner-metrics-panel">
              <div className="lp-metric-col">
                <span className="lp-metric-label">{item.quotaLabel || 'Monthly Quota'}</span>
                <span className="lp-metric-value lp-metric-value--dark">
                  {item.quotaValue || `${capacity * 2 || 350} Families`}
                </span>
              </div>
              <div className="lp-metric-col">
                <span className="lp-metric-label">{item.fulfilledLabel || 'Fulfilled'}</span>
                <span className="lp-metric-value lp-metric-value--green">
                  {item.fulfilledValue ||
                    `${Math.round((capacity * 2 || 350) * (progress / 100))} Kits (${progress}%)`}
                </span>
              </div>
              <div className="lp-metric-col">
                <span className="lp-metric-label">{item.cadenceLabel || 'Cadence'}</span>
                <span className="lp-metric-value lp-metric-value--blue">
                  {item.cadenceValue ||
                    (item.event_date ? `Every ${item.event_date}` : 'Every 1st Sat')}
                </span>
              </div>
            </div>
            <div className="lp-banner-progress-block">
              <div className="lp-banner-progress-head">
                <span className="lp-progress-head-label">
                  {item.milestoneLabel || 'Beneficiary Disbursement Milestone'}
                </span>
                <span className="lp-progress-head-value lp-progress-head-value--green">
                  {progress}% Achieved
                </span>
              </div>
              <div className="lp-banner-progress-track">
                <motion.div
                  className="lp-banner-progress-fill lp-banner-progress-fill--green"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
            <div className="lp-banner-footer">
              <div className="lp-banner-volunteer-info">
                <VolunteerRibbonIcon />
                <span>{item.teamLabel || '42 Deaconate Volunteers'}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
