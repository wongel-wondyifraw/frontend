'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button, Typography, ConfigProvider, theme, Spin, Drawer, message } from 'antd';
import {
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  MenuOutlined,
  RightOutlined,
  SendOutlined,
  CarOutlined,
  LockOutlined,
  CompassOutlined,
  BookOutlined,
  HeartOutlined,
  TeamOutlined,
  SmileOutlined,
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
  UserOutlined,
  WifiOutlined,
  CoffeeOutlined,
  ReadOutlined,
  BankOutlined,
  GiftOutlined,
  MessageOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { motion, useReducedMotion, useInView, AnimatePresence } from 'framer-motion';
import LandingBannerCard from '@/Components/landing/LandingBannerCard';
import CustomSelect, { type CustomSelectOption } from '@/Components/common/CustomSelect';
import { PLATFORM, TENANT } from '@/lib/tenant';
import { getLandingContent, submitContactRequest } from '@/services/api';
import type { LandingMediaItem, LandingPageContent } from '@/types';
import {
  DEFAULT_LANDING_CONTENT,
  mergeLandingContent,
} from '@/lib/landing-defaults';
import { getImageUrl } from '@/lib/media-url';
import './ChurchFeed.css';

const { Title, Paragraph, Text } = Typography;

const LocationMap = dynamic(
  () => import('@/Components/landing/LocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="lp-map-skeleton">Loading Goro Full Gospel Church map...</div>
    ),
  }
);

/* ────────────────────────────────────────────
   Configuration & Constants
   ──────────────────────────────────────────── */
const NAV_LINKS = [
  { href: '#vision', label: 'Vision' },
  { href: '#programs', label: 'Programs' },
  { href: '#ministries', label: 'Ministries' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
  { href: '#about', label: 'About' },
] as const;

const landingTheme = {
  token: {
    colorPrimary: '#003198',
    colorLink: '#003198',
    borderRadius: 4,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  algorithm: theme.defaultAlgorithm,
};

/* Static stats for the ribbon */
const STATIC_STATS = [
  { value: '4,500+', label: 'Active Church Members' },
  { value: '32', label: 'Community Cell Groups' },
  { value: '18', label: 'Ongoing Ministry Programs' },
  { value: '99.8%', label: 'ChMS System Reliability' },
];

/* Vision card icons mapping */
const VISION_ICONS = [
  { icon: <CompassOutlined />, fallbackTitle: 'Great Commission & Evangelism' },
  { icon: <BookOutlined />, fallbackTitle: 'Holistic Discipleship' },
  { icon: <HeartOutlined />, fallbackTitle: 'Community Compassion' },
];

const renderVisionMedia = (item: LandingMediaItem, i: number) => {
  if (item.image_url) {
    return (
      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        <Image
          src={item.image_url}
          alt=""
          width={48}
          height={48}
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      </div>
    );
  }
  
  if (item.icon) {
    switch (item.icon) {
      case 'compass': return <CompassOutlined />;
      case 'book': return <BookOutlined />;
      case 'heart': return <HeartOutlined />;
      case 'star': return <StarOutlined />;
      case 'team': return <TeamOutlined />;
      case 'fire': return <FireOutlined />;
      case 'bulb': return <BulbOutlined />;
      case 'globe': return <GlobalOutlined />;
      case 'home': return <HomeOutlined />;
      case 'sound': return <SoundOutlined />;
      case 'crown': return <CrownOutlined />;
      case 'check': return <CheckCircleOutlined />;
      case 'info': return <InfoCircleOutlined />;
      case 'play': return <PlayCircleOutlined />;
      case 'shield': return <SafetyOutlined />;
      case 'lightning': return <ThunderboltOutlined />;
      case 'trophy': return <TrophyOutlined />;
      case 'user': return <UserOutlined />;
      case 'wifi': return <WifiOutlined />;
      case 'coffee': return <CoffeeOutlined />;
      case 'read': return <ReadOutlined />;
      case 'bank': return <BankOutlined />;
      case 'gift': return <GiftOutlined />;
      case 'message': return <MessageOutlined />;
      case 'rocket': return <RocketOutlined />;
    }
  }
  
  return VISION_ICONS[i]?.icon || <CompassOutlined />;
};

/* Contact form ministry request category options */
const CONTACT_CATEGORY_OPTIONS: CustomSelectOption[] = [
  {
    value: 'prayer',
    label: 'Pastoral Prayer Request (Confidential)',
    icon: <HeartOutlined />,
  },
  {
    value: 'cell',
    label: 'Join a Cell Group in Goro',
    icon: <TeamOutlined />,
  },
  {
    value: 'baptism',
    label: 'Water Baptism & Membership Class',
    icon: <BookOutlined />,
  },
  {
    value: 'counseling',
    label: 'Family & Premarital Counseling',
    icon: <SmileOutlined />,
  },
  {
    value: 'general',
    label: 'General Church Inquiry',
    icon: <MailOutlined />,
  },
];

/* ────────────────────────────────────────────
   AnimatedSection — scroll-triggered wrapper
   ──────────────────────────────────────────── */
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   AnimatedCounter — counts up on scroll
   ──────────────────────────────────────────── */
function AnimatedCounter({ value }: { value: string }) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    // Extract numeric part
    const numericMatch = value.match(/[\d,.]+/);
    if (!numericMatch) {
      const frame = requestAnimationFrame(() => setDisplayValue(value));
      return () => cancelAnimationFrame(frame);
    }

    const numericStr = numericMatch[0].replace(/,/g, '');
    const target = parseFloat(numericStr);
    const prefix = value.slice(0, value.indexOf(numericMatch[0]));
    const suffix = value.slice(value.indexOf(numericMatch[0]) + numericMatch[0].length);
    const hasCommas = numericMatch[0].includes(',');
    const isDecimal = numericMatch[0].includes('.');

    const duration = 1200;
    const startTime = performance.now();
    let frameId = 0;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = target * easedProgress;

      let formatted: string;
      if (isDecimal) {
        formatted = current.toFixed(1);
      } else {
        const rounded = Math.round(current);
        formatted = hasCommas ? rounded.toLocaleString() : String(rounded);
      }

      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [inView, value, prefersReducedMotion]);

  return (
    <span ref={ref}>{prefersReducedMotion ? value : displayValue}</span>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function ChurchFeed({ previewContent }: { previewContent?: LandingPageContent }) {
  const [fetchedContent, setFetchedContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(!previewContent);
  const [navOpen, setNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('');
  const [selectedVision, setSelectedVision] = useState<
    (LandingMediaItem & { index: number }) | null
  >(null);
  const prefersReducedMotion = useReducedMotion();

  const content = previewContent || fetchedContent;

  useEffect(() => {
    if (previewContent) return; // Skip fetching if in preview mode
    
    let cancelled = false;
    (async () => {
      try {
        const page = await getLandingContent();
        if (cancelled) return;
        const raw = page.content;
        const parsed =
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? (raw as LandingPageContent)
            : {};
        setFetchedContent(mergeLandingContent(parsed));
      } catch {
        if (!cancelled) setFetchedContent(DEFAULT_LANDING_CONTENT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewContent]);

  /* Active nav tracking via intersection observer */
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [loading]);

  const hero = content.hero;
  const about = content.about;
  const vision = content.vision;
  const ministries = content.ministries;
  const projects = content.projects;
  const programs = content.programs;
  const contact = content.contact;
  const footer = content.footer;

  const heroImage = getImageUrl(hero?.image_url) || '';

  const aboutItems = about?.items || [];
  const ministryItems = ministries?.items || [];
  const homepageProjectItems = projects?.items || [];
  const programItems = programs?.items || [];

  const displayedPrograms = programItems;

  const hasVisionBody = Boolean(
    vision?.heading || vision?.body || vision?.image_url || vision?.title || vision?.subtitle,
  );

  /* Build stats from data or use defaults */
  const stats = useMemo(() => {
    const rows: { value: string; label: string }[] = [];
    if (displayedPrograms.length) {
      rows.push({ value: String(displayedPrograms.length), label: programs?.title || 'Programs' });
    }
    if (ministryItems.length) {
      rows.push({ value: String(ministryItems.length), label: ministries?.title || 'Ministries' });
    }
    if (aboutItems.length) {
      rows.push({ value: String(aboutItems.length), label: about?.title || 'About' });
    }
    return rows.length > 0 ? rows : STATIC_STATS;
  }, [displayedPrograms.length, ministryItems.length, aboutItems.length, programs?.title, ministries?.title, about?.title]);

  const [submittingContact, setSubmittingContact] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const fullName = String(formData.get('full_name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const messageText = String(formData.get('message') || '').trim();

    if (!fullName || !phone || !messageText) {
      message.error('Please enter your name, phone number, and message.');
      return;
    }

    setSubmittingContact(true);
    try {
      const rawCategory = String(formData.get('category') || 'general');
      const categories = [
        'prayer',
        'cell',
        'baptism',
        'counseling',
        'chms',
        'general',
      ] as const;
      type ContactCategory = (typeof categories)[number];
      const category: ContactCategory = categories.includes(
        rawCategory as ContactCategory,
      )
        ? (rawCategory as ContactCategory)
        : 'general';
      await submitContactRequest({
        full_name: fullName,
        phone,
        email: String(formData.get('email') || '').trim() || undefined,
        category,
        message: messageText,
        is_confidential: formData.get('is_confidential') === 'on',
      });
      message.success('Thank you! Your message has been sent to our pastoral team.');
      form.reset();
    } catch (err: unknown) {
      message.error(
        err instanceof Error
          ? err.message
          : 'Failed to send your message. Please try again.',
      );
    } finally {
      setSubmittingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="lp-shell lp-shell--loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider theme={landingTheme}>
      <div className="lp-shell">
        {/* ═══════ HEADER ═══════ */}
        <header className="lp-header">
          <div className="lp-header-inner">
            <Link href="/" className="lp-header-brand" aria-label={`${TENANT.name} Home`}>
              <Image
                src="/full-gospel-logo.png"
                alt={TENANT.name}
                width={38}
                height={38}
                className="lp-header-logo"
                priority
              />
              <span className="lp-header-brand-name">{TENANT.name}</span>
            </Link>

            <nav className="lp-nav" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={activeNav === link.href ? 'active' : ''}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="lp-header-actions">
              <Button
                type="text"
                className="lp-nav-toggle"
                icon={<MenuOutlined />}
                aria-label="Open menu"
                onClick={() => setNavOpen(true)}
              />
            </div>
          </div>
        </header>

        {/* Mobile drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Image
                src="/full-gospel-logo.png"
                alt={TENANT.name}
                width={30}
                height={30}
                style={{ objectFit: 'contain' }}
              />
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--lp-primary-container)' }}>
                {TENANT.name}
              </span>
            </div>
          }
          placement="right"
          open={navOpen}
          onClose={() => setNavOpen(false)}
          className="lp-mobile-drawer"
        >
          <nav className="lp-mobile-nav" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setNavOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
        </Drawer>

        <main className="lp-main">
          {/* ═══════ HERO SECTION ═══════ */}
          {hero?.enabled !== false && (
            <section
              className={`lp-hero${!heroImage ? ' lp-hero--plain' : ''}`}
              id="hero"
              style={
                heroImage
                  ? {
                      backgroundImage: `linear-gradient(rgba(10,18,45,0.78), rgba(10,18,45,0.88)), url("${heroImage}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!heroImage && <div className="lp-hero-shade" aria-hidden />}
              <div className="lp-hero-copy">
                {hero?.kicker && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Text className="lp-kicker">{hero.kicker}</Text>
                  </motion.div>
                )}

                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Title level={1} className="lp-hero-title">
                    {hero?.title || TENANT.name}
                  </Title>
                </motion.div>

                {hero?.lede && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Paragraph className="lp-hero-lede">{hero.lede}</Paragraph>
                  </motion.div>
                )}

                <motion.div
                  className="lp-hero-actions"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Link href="/login">
                    <Button type="primary" size="large" className="lp-cta-primary">
                      <LockOutlined style={{ fontSize: 14 }} />
                      {hero?.cta_label || 'Staff Login'}
                    </Button>
                  </Link>
                  <Button ghost size="large" href="#vision" className="lp-cta-ghost">
                    <CompassOutlined style={{ fontSize: 14 }} />
                    {hero?.secondary_cta_label || 'Explore Page'}
                  </Button>
                </motion.div>

                {(hero?.verse_text || hero?.verse_ref) && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="lp-hero-verse-container"
                    style={{
                      position: 'absolute',
                      bottom: '2rem',
                      left: '0',
                      width: '100%',
                      fontFamily: "'Poppins', var(--lp-font)",
                      color: 'rgba(255,255,255,0.95)',
                      textAlign: 'center'
                    }}
                  >
                    <div>
                      {hero.verse_text && (
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4, marginRight: '0.75rem' }}>
                          "{hero.verse_text}"
                        </span>
                      )}
                      {hero.verse_ref && (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          — {hero.verse_ref}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </section>
          )}

          {/* ═══════ STATS RIBBON ═══════ */}
          <section className="lp-stats-ribbon">
            <div className="lp-stats-ribbon-inner">
              <div className="lp-stats-grid">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="lp-stat"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <span className="lp-stat-value">
                      <AnimatedCounter value={stat.value} />
                    </span>
                    <span className="lp-stat-label">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════ VISION & CORE MANDATE ═══════ */}
          {vision?.enabled !== false && hasVisionBody && (
            <section id="vision" className="lp-section">
              <div className="lp-section-inner">
                <AnimatedSection>
                  <div className="lp-section-header">
                    <span className="lp-section-badge">ABOUT OUR CALLING</span>
                    <Title level={2} className="lp-section-title">
                      {vision?.heading || vision?.title || 'Our Vision & Core Mandate'}
                    </Title>
                    {(vision?.body || vision?.subtitle) && (
                      <Paragraph className="lp-section-sub">
                        {vision?.body || vision?.subtitle}
                      </Paragraph>
                    )}
                  </div>
                </AnimatedSection>

                {/* Vision cards */}
                <div className="lp-vision-grid lp-stagger">
                  {(vision?.items || []).map((item, i) => (
                    <motion.div
                      key={item.title || i}
                      className="lp-vision-card"
                      onClick={() => setSelectedVision({ ...item, index: i })}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.15,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="lp-vision-card-icon">
                          {renderVisionMedia(item, i)}
                        </div>
                        <h3>{item.title}</h3>
                        {item.text && <p>{item.text}</p>}
                      </div>
                      <div className="lp-vision-card-footer">
                        <span>Learn More</span>
                        <RightOutlined />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══════ PROGRAMS ═══════ */}
          {programs?.enabled !== false && displayedPrograms.length > 0 && (
            <section id="programs" className="lp-section lp-section--canvas lp-section--card-scroll">
              <div className="lp-section-inner">
                <AnimatedSection>
                  <div className="lp-section-header">
                    <span className="lp-section-badge">OUR PROGRAMS</span>
                    <Title level={2} className="lp-section-title">
                      {programs?.title || 'Ministry & Spiritual Programs'}
                    </Title>
                    {programs?.subtitle && (
                      <Paragraph className="lp-section-sub">
                        {programs.subtitle}
                      </Paragraph>
                    )}
                  </div>
                </AnimatedSection>
              </div>

              <div className="lp-card-scroll" tabIndex={0} aria-label="Programs">
                <div className="lp-card-scroll-track">
                  {displayedPrograms.map((item, i) => (
                    <div key={`${item.title || 'prog'}-${i}`} className="lp-card-scroll-slide">
                      <LandingBannerCard
                        item={item}
                        index={i}
                        type="program"
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══════ MINISTRIES ═══════ */}
          {ministries?.enabled !== false && ministryItems.length > 0 && (
            <section id="ministries" className="lp-section lp-section--card-scroll">
              <div className="lp-section-inner">
                <AnimatedSection>
                  <div className="lp-section-header">
                    <Title level={2} className="lp-section-title">
                      Ministries
                    </Title>
                    {ministries?.subtitle && (
                      <Paragraph className="lp-section-sub">{ministries.subtitle}</Paragraph>
                    )}
                  </div>
                </AnimatedSection>
              </div>

              <div className="lp-card-scroll" tabIndex={0} aria-label="Ministries">
                <div className="lp-card-scroll-track">
                  {ministryItems.map((item, i) => (
                    <div key={`${item.title || 'm'}-${i}`} className="lp-card-scroll-slide">
                      <LandingBannerCard
                        item={item}
                        index={i}
                        type="ministry"
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══════ PROJECTS ═══════ */}
          {projects?.enabled !== false && homepageProjectItems.length > 0 && (
            <section id="projects" className="lp-section lp-section--canvas">
              <div className="lp-section-inner">
                <AnimatedSection>
                  <div className="lp-section-header">
                    <Title level={2} className="lp-section-title">
                      {projects?.title || 'Projects'}
                    </Title>
                    {projects?.subtitle && (
                      <Paragraph className="lp-section-sub">
                        {projects.subtitle}
                      </Paragraph>
                    )}
                  </div>
                </AnimatedSection>

                <div className="lp-projects-grid-full">
                  {homepageProjectItems.map((project, i) => {
                    const img = getImageUrl(project.image_url);
                    const dates = [project.event_date, project.event_date_end]
                      .filter(Boolean)
                      .join(' – ');
                    return (
                      <article
                        key={`${project.title || 'p'}-${i}`}
                        className="lp-project-card-lg"
                      >
                        <div className="lp-project-card-lg-media">
                          {img ? (
                            <Image
                              src={img}
                              alt={project.title}
                              fill
                              sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                              className="lp-project-card-lg-img"
                              unoptimized={
                                img.startsWith('http') && !img.includes('unsplash')
                              }
                            />
                          ) : (
                            <div className="lp-project-card-lg-fallback" aria-hidden />
                          )}
                          <div className="lp-project-card-lg-shade" aria-hidden />
                          {project.tag && (
                            <span className="lp-project-card-lg-tag">{project.tag}</span>
                          )}
                        </div>
                        <div className="lp-project-card-lg-body">
                          <h4 className="lp-project-card-lg-title">{project.title}</h4>
                          {project.text && (
                            <p className="lp-project-card-lg-text">{project.text}</p>
                          )}
                          {dates && (
                            <p className="lp-project-card-lg-dates">{dates}</p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ═══════ CONTACT & MAP ═══════ */}
          {contact?.enabled !== false && (
            <section id="contact" className="lp-contact-section">
              <div className="lp-section-inner">
                <AnimatedSection>
                  <div className="lp-section-header">
                    <span className="lp-section-badge">CONNECT WITH US</span>
                    <Title level={2} className="lp-section-title">
                      {contact?.touch_title || 'Get in Touch & Visit Us'}
                    </Title>
                    {contact?.touch_body && (
                      <Paragraph className="lp-section-sub">{contact.touch_body}</Paragraph>
                    )}
                  </div>
                </AnimatedSection>

                <div className="lp-contact-grid">
                  {/* Left: Contact Form */}
                  <AnimatedSection delay={0.1} className="lp-contact-left-col">
                    <div className="lp-form-card">
                      <div className="lp-form-card-header">
                        <h3>Send a Message or Prayer Request</h3>
                        <p>Our pastoral care team responds within 24 hours.</p>
                      </div>
                      <form
                        className="lp-form"
                        onSubmit={handleContactSubmit}
                      >
                        <div className="lp-form-row">
                          <div className="lp-form-group">
                            <label>Full Name *</label>
                            <input
                              type="text"
                              name="full_name"
                              required
                              placeholder="e.g. Yohannes Bekele"
                            />
                          </div>
                          <div className="lp-form-group">
                            <label>Phone Number *</label>
                            <input
                              type="tel"
                              name="phone"
                              required
                              placeholder="+251 9xx xxx xxx"
                            />
                          </div>
                        </div>
                        <div className="lp-form-group">
                          <label>Email Address</label>
                          <input
                            type="email"
                            name="email"
                            placeholder="yohannes@example.com"
                          />
                        </div>
                        <div className="lp-form-group">
                          <label>Ministry / Request Category</label>
                          <CustomSelect
                            name="category"
                            defaultValue="prayer"
                            options={CONTACT_CATEGORY_OPTIONS}
                          />
                        </div>
                        <div className="lp-form-group lp-form-group--message">
                          <label>Your Message / Prayer Need *</label>
                          <textarea
                            name="message"
                            required
                            placeholder="How may our church family stand with you in faith?"
                            rows={4}
                          />
                        </div>
                        <div className="lp-form-checkbox">
                          <input type="checkbox" id="confidential" name="is_confidential" />
                          <label htmlFor="confidential">
                            Keep this prayer request strictly confidential with Senior Pastors
                          </label>
                        </div>
                        <motion.button
                          type="submit"
                          className="lp-form-submit"
                          disabled={submittingContact}
                          whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        >
                          {submittingContact ? (
                            <Spin size="small" />
                          ) : (
                            <>
                              <SendOutlined style={{ fontSize: 14 }} />
                              Send Message
                            </>
                          )}
                        </motion.button>
                      </form>
                    </div>
                  </AnimatedSection>

                  {/* Right: Location + Map */}
                  <div className="lp-contact-right">
                    <AnimatedSection delay={0.2}>
                      <div className="lp-location-card">
                        <h3>
                          <EnvironmentOutlined />
                          {contact?.location_title ||
                            'Sanctuary Location & Gathering Hours'}
                        </h3>
                        <div className="lp-location-info-grid">
                          <div className="lp-location-info-box">
                            <strong>
                              {contact?.location_services_heading ||
                                'Weekly Services & Gathering Times'}
                            </strong>
                            <div className="lp-weekly-services-row">
                              {(
                                contact?.location_services?.filter(
                                  (s) => s.name || s.time,
                                ) || [
                                  {
                                    name: 'Sunday Worship',
                                    time: '9:00 AM – 12:30 PM',
                                  },
                                  { name: 'Tuesday', time: '5:30 PM – 7:30 PM' },
                                  { name: 'Thursday', time: '5:30 PM – 7:30 PM' },
                                ]
                              ).map((service) => (
                                <div
                                  key={`${service.name}-${service.time}`}
                                  className="lp-weekly-service-item"
                                >
                                  <span className="lp-weekly-service-name">
                                    {service.name}
                                  </span>
                                  <span className="lp-weekly-service-time">
                                    {service.time}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="lp-location-footer">
                          <span>
                            Church Office Direct:{' '}
                            <strong style={{ color: 'var(--lp-on-surface)' }}>
                              {contact?.office_phone || '+251 11 645 8820'}
                            </strong>
                          </span>
                          <a
                            className="lp-location-directions"
                            href={
                              contact?.directions_url ||
                              'https://www.google.com/maps?cid=15714397395026925129'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <CarOutlined style={{ fontSize: 12 }} />
                            Get Directions
                          </a>
                        </div>
                      </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.3}>
                      <LocationMap
                        title={contact?.map_title}
                        subtitle={contact?.map_subtitle}
                        note={contact?.map_note}
                        mapUrl={contact?.map_url}
                        directionsUrl={contact?.directions_url}
                      />
                    </AnimatedSection>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═══════ ABOUT / MISSION ═══════ */}
          {about?.enabled !== false && aboutItems.length > 0 && (
            <section className="lp-section lp-section--grey" id="about">
              <div className="lp-section-inner">
                <AnimatedSection>
                  <div className="lp-section-header">
                    <span className="lp-section-badge">
                      {about?.label || 'MISSION'}
                    </span>
                    <Title level={2} className="lp-section-title">
                      {about?.title || 'Our vision'}
                    </Title>
                    {about?.subtitle && (
                      <Paragraph className="lp-section-sub">
                        {about.subtitle}
                      </Paragraph>
                    )}
                  </div>
                </AnimatedSection>

                <div className="lp-vision-grid lp-stagger">
                  {aboutItems.map((item, i) => (
                    <motion.div
                      key={item.title || i}
                      className="lp-vision-card"
                      onClick={() => setSelectedVision({ ...item, index: i })}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.15,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="lp-vision-card-icon">
                          {renderVisionMedia(item, i)}
                        </div>
                        <h3>{item.title}</h3>
                        {item.text && <p>{item.text}</p>}
                      </div>
                      <div className="lp-vision-card-footer">
                        <span>Learn More</span>
                        <RightOutlined />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

        </main>

        {/* ═══════ VISION MODAL ═══════ */}
        <AnimatePresence>
          {selectedVision && (
            <React.Fragment>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lp-vision-modal-overlay"
                onClick={() => setSelectedVision(null)}
              />
              <div className="lp-vision-modal-container" onClick={() => setSelectedVision(null)}>
                <motion.div
                  className="lp-vision-card lp-vision-card--expanded"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <div className="lp-vision-card-icon">
                      {renderVisionMedia(selectedVision, selectedVision.index)}
                    </div>
                    <h3>{selectedVision.title}</h3>
                    {selectedVision.text && <p>{selectedVision.text}</p>}
                  </div>
                  
                  <div className="lp-vision-expanded-details">
                    <p>This is a core pillar of our ministry. By focusing on {selectedVision.title.toLowerCase()}, we believe we can impact the community deeply. Join us in this mandate as we expand our programs and outreach efforts.</p>
                  </div>
                  
                  <div className="lp-vision-card-footer" onClick={() => setSelectedVision(null)}>
                    <span>Close</span>
                  </div>
                </motion.div>
              </div>
            </React.Fragment>
          )}
        </AnimatePresence>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            {/* Brand Column */}
            <div className="lp-footer-brand">
              <div className="lp-footer-brand-row">
                <div className="lp-footer-brand-icon">
                  <Image
                    src="/full-gospel-logo.png"
                    alt={TENANT.name}
                    width={40}
                    height={40}
                    className="lp-footer-logo-img"
                  />
                </div>
                <div>
                  <Text className="lp-footer-name">{TENANT.name}</Text>
                  <Text className="lp-footer-tagline">
                    Integrated ChMS Portal & Ministry Hub
                  </Text>
                </div>
              </div>
              {footer?.blurb ? (
                <Text className="lp-footer-blurb">{footer.blurb}</Text>
              ) : (
                <Text className="lp-footer-blurb">
                  A biblical congregation in Addis Ababa dedicated to honoring Jesus Christ,
                  cultivating passionate disciples, and serving our surrounding neighborhoods with
                  genuine Christian love.
                </Text>
              )}
            </div>

            {/* Shepherd.One platform */}
            <div className="lp-footer-col">
              <h4>{PLATFORM.name}</h4>
              <p className="lp-footer-col-blurb">{PLATFORM.blurb}</p>
              <nav className="lp-footer-nav" aria-label="Shepherd.One">
                <a
                  href={PLATFORM.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {PLATFORM.poweredByLabel}
                </a>
                <a
                  href={PLATFORM.requestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request this system
                </a>
              </nav>
            </div>

            {/* Ministries from CMS */}
            {ministryItems.length > 0 && (
              <div className="lp-footer-col">
                <h4>{ministries?.title || 'Ministries'}</h4>
                <nav className="lp-footer-nav" aria-label="Footer Ministries">
                  {ministryItems.map((item) => (
                    <a key={item.title} href="#ministries">
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {/* Bottom copyright */}
          <div className="lp-footer-bottom">
            <Text className="lp-copyright">
              © {new Date().getFullYear()} {TENANT.name}. All rights reserved. Empowering faith,
              administration, and community.
            </Text>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
}
