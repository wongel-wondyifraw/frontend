'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Tag, Typography, Space, ConfigProvider, theme, Spin, Drawer } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  MenuOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import AppLogo from '@/Components/common/AppLogo';
import ProgramPoster, { posterStyleToVariant } from '@/Components/landing/ProgramPoster';
import SectionDisplay from '@/Components/landing/SectionDisplay';
import { TENANT } from '@/lib/tenant';
import { getLandingContent } from '@/services/api';
import type { LandingMediaItem, LandingPageContent } from '@/types';
import {
  DEFAULT_LANDING_CONTENT,
  isDirectVideoFile,
  mergeLandingContent,
  youtubeEmbedUrl,
} from '@/lib/landing-defaults';
import { getImageUrl } from '@/lib/media-url';
import './ChurchFeed.css';

const { Title, Paragraph, Text } = Typography;

const NAV_LINKS = [
  { href: '#vision', label: 'Vision' },
  { href: '#projects', label: 'Projects' },
  { href: '#programs', label: 'Programs' },
  { href: '#updates', label: 'Updates' },
  { href: '#contact', label: 'Contact' },
  { href: '#about', label: 'About' },
] as const;

const landingTheme = {
  token: {
    colorPrimary: '#1E40AF',
    colorLink: '#1E40AF',
    borderRadius: 8,
    fontFamily:
      "'Outfit', 'Noto Sans Ethiopic', system-ui, sans-serif",
  },
  algorithm: theme.defaultAlgorithm,
};

function MediaBlock({
  item,
  showPosterFallback = false,
  posterStyle = 'navy',
}: {
  item: LandingMediaItem;
  showPosterFallback?: boolean;
  posterStyle?: 'navy' | 'emerald' | 'warm';
}) {
  const imageSrc = getImageUrl(item.image_url);
  const embed = youtubeEmbedUrl(item.video_url);
  const fileVideo = item.video_file_url || (isDirectVideoFile(item.video_url) ? item.video_url : null);
  const fileHref = getImageUrl(item.file_url);

  return (
    <div className="lp-media-block">
      {imageSrc ? (
        <div className="lp-card-media">
          <Image
            src={imageSrc}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={55}
            loading="lazy"
            className="lp-card-photo"
            unoptimized={imageSrc.startsWith('http') && !imageSrc.includes('unsplash')}
          />
          {item.tag && (
            <Tag color="#1E40AF" className="lp-card-tag">
              {item.tag}
            </Tag>
          )}
        </div>
      ) : showPosterFallback ? (
        <ProgramPoster
          title={item.title}
          tag={item.tag}
          variant={posterStyleToVariant(posterStyle)}
        />
      ) : null}
      {embed && (
        <div className="lp-video-frame">
          <iframe
            src={embed}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {fileVideo && !embed && (
        <video className="lp-video-file" controls src={getImageUrl(fileVideo) || undefined} />
      )}
      {fileHref && (
        <a className="lp-file-link" href={fileHref} target="_blank" rel="noreferrer">
          {item.file_name || 'Download attachment'}
        </a>
      )}
    </div>
  );
}

function infoLineIcon(line: string) {
  const value = line.trim();
  if (/@|email/i.test(value)) return <MailOutlined aria-hidden />;
  if (/\+?\d[\d\s().-]{6,}|phone|tel\b/i.test(value)) return <PhoneOutlined aria-hidden />;
  if (/https?:|www\./i.test(value)) return <GlobalOutlined aria-hidden />;
  if (/\b(am|pm)\b|\d{1,2}:\d{2}|sunday|monday|tuesday|wednesday|thursday|friday|saturday|hours/i.test(value)) {
    return <ClockCircleOutlined aria-hidden />;
  }
  return <EnvironmentOutlined aria-hidden />;
}

function ProgramCard({
  item,
  posterStyle,
}: {
  item: LandingMediaItem;
  posterStyle?: 'navy' | 'emerald' | 'warm';
}) {
  const imageSrc = getImageUrl(item.image_url);
  return (
    <article key={item.title} className="lp-program">
      <ProgramPoster
        title={item.title}
        text={item.text}
        tag={item.tag}
        eventDate={item.event_date}
        eventTime={item.event_time}
        location={item.location}
        imageUrl={imageSrc}
        variant={posterStyleToVariant(posterStyle)}
        siteLabel={TENANT.shortName}
      />
    </article>
  );
}

export default function ChurchFeed() {
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
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
        setContent(mergeLandingContent(parsed));
      } catch {
        if (!cancelled) setContent(DEFAULT_LANDING_CONTENT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hero = content.hero;
  const about = content.about;
  const vision = content.vision;
  const projects = content.projects;
  const programs = content.programs;
  const updates = content.updates;
  const contact = content.contact;
  const footer = content.footer;

  const heroImage = getImageUrl(hero?.image_url) || '';
  const posterStyle = programs?.default_poster_style || 'navy';

  if (loading) {
    return (
      <div className="lp-shell lp-shell--loading">
        <Spin size="large" />
      </div>
    );
  }

  const aboutItems = about?.items || [];
  const projectItems = projects?.items || [];
  const programItems = programs?.items || [];
  const hasVisionBody = Boolean(
    vision?.heading || vision?.body || vision?.image_url,
  );

  return (
    <ConfigProvider theme={landingTheme}>
      <div className="lp-shell">
        <header className="lp-header">
          <div className="lp-header-inner">
            <AppLogo variant="full" href="/" priority showPoweredBy />
            <nav className="lp-nav" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
            <Button
              type="text"
              className="lp-nav-toggle"
              icon={<MenuOutlined />}
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            />
          </div>
        </header>

        <Drawer
          title={TENANT.name}
          placement="right"
          open={navOpen}
          onClose={() => setNavOpen(false)}
          className="lp-mobile-drawer"
        >
          <nav className="lp-mobile-nav" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setNavOpen(false)}>
              Staff login
            </Link>
          </nav>
        </Drawer>

        <main className="lp-main">
          {hero?.enabled !== false && (
            <section className={`lp-hero${!heroImage ? ' lp-hero--plain' : ''}`}>
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  quality={60}
                  className="lp-hero-img"
                  unoptimized={heroImage.startsWith('http') && !heroImage.includes('unsplash')}
                />
              ) : null}
              <div className="lp-hero-overlay">
                {(hero?.verse_ref || hero?.verse_text) && (
                  <div className="lp-hero-verse-crawl" aria-label="Scripture">
                    <div className="lp-hero-verse-track">
                      {[0, 1].map((copy) => (
                        <span key={copy} className="lp-hero-verse-item">
                          {hero.verse_ref && (
                            <span className="lp-hero-verse-ref">{hero.verse_ref}</span>
                          )}
                          {hero.verse_text && (
                            <span className="lp-hero-verse-text">
                              &ldquo;{hero.verse_text}&rdquo;
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="lp-hero-copy">
                {hero?.kicker && (
                  <Text className="lp-kicker">
                    {hero?.kicker}
                  </Text>
                )}
                <Title level={1} className="lp-hero-title">
                  {hero?.title || TENANT.name}
                </Title>
                {hero?.lede && (
                  <Paragraph className="lp-hero-lede">
                    {hero?.lede}
                  </Paragraph>
                )}
                <Space size="middle" wrap className="lp-hero-actions">
                  <Link href="/login">
                    <Button type="primary" size="large" className="lp-cta-primary">
                      Staff login
                    </Button>
                  </Link>
                  <Button ghost size="large" href="#about" className="lp-cta-ghost">
                    Explore the page
                  </Button>
                </Space>
              </div>
            </section>
          )}

          {vision?.enabled !== false && hasVisionBody && (
            <section id="vision" className="lp-band lp-band--flush">
              <div className="lp-vision-block">
                <div className="lp-vision-bg" aria-hidden={!vision?.image_url}>
                  <MediaBlock
                    item={{
                      title: vision?.heading || 'Vision',
                      image_url: vision?.image_url,
                      video_url: vision?.video_url,
                      video_file_url: vision?.video_file_url,
                      file_url: vision?.file_url,
                      file_name: vision?.file_name,
                    }}
                  />
                </div>
                <div className="lp-vision-shade" />
                <div className="lp-vision-copy">
                  {vision?.label && (
                    <Text className="lp-vision-label">
                      {vision.label}
                    </Text>
                  )}
                  <Title level={2} className="lp-band-title lp-band-title--left">
                    {vision?.title || 'Our vision'}
                  </Title>
                  {vision?.subtitle && (
                    <Paragraph className="lp-band-sub lp-band-sub--left">
                      {vision?.subtitle}
                    </Paragraph>
                  )}
                  {vision?.heading && (
                    <Title level={3} className="lp-vision-heading">
                      {vision?.heading}
                    </Title>
                  )}
                  {vision?.body && (
                    <Paragraph className="lp-vision-body">
                      {vision?.body}
                    </Paragraph>
                  )}
                </div>
              </div>
            </section>
          )}

          {projects?.enabled !== false && projectItems.length > 0 && (
            <section id="projects" className="lp-band lp-band--tone">
              <div className="lp-band-intro">
                <Title level={2} className="lp-band-title">
                  {projects?.title || 'Projects & ministries'}
                </Title>
                {projects?.subtitle && (
                  <Paragraph className="lp-band-sub">
                    {projects?.subtitle}
                  </Paragraph>
                )}
              </div>
              <div className="lp-band-bleed">
                <SectionDisplay style={projects?.display_style || 'grid'} className="lp-strip-display">
                  {projectItems.map((item) => (
                    <article key={item.title} className="lp-story">
                      <MediaBlock item={item} />
                      <div className="lp-story-body">
                        <Title level={4} className="lp-story-title">
                          {item.title}
                        </Title>
                        {item.text && (
                          <Paragraph className="lp-story-text">
                            {item.text}
                          </Paragraph>
                        )}
                        {item.ref && (
                          <cite className="lp-card-cite">
                            {item.ref}
                          </cite>
                        )}
                      </div>
                    </article>
                  ))}
                </SectionDisplay>
              </div>
            </section>
          )}

          {programs?.enabled !== false && programItems.length > 0 && (
            <section id="programs" className="lp-band">
              <div className="lp-band-intro">
                <Title level={2} className="lp-band-title">
                  {programs?.title || 'Programs'}
                </Title>
                {programs?.subtitle && (
                  <Paragraph className="lp-band-sub">
                    {programs?.subtitle}
                  </Paragraph>
                )}
              </div>
              <div className="lp-band-bleed">
                <SectionDisplay style={programs?.display_style || 'carousel'} className="lp-programs-display">
                  {programItems.map((item) => (
                    <ProgramCard key={item.title} item={item} posterStyle={posterStyle} />
                  ))}
                </SectionDisplay>
              </div>
            </section>
          )}

          {updates?.enabled !== false &&
            updates?.show_programs_strip !== false &&
            programItems.length > 0 && (
            <section id="updates" className="lp-updates-bar" aria-label="Recent programs">
              <div className="lp-updates-bar-inner">
                <span className="lp-updates-bar-label">
                  {updates?.programs_strip_title || 'Recent'}
                </span>
                <div className="lp-updates-bar-list">
                  {programItems.map((item, index) => (
                    <span key={`update-${item.title}`} className="lp-updates-bar-item">
                      {index > 0 && <span className="lp-updates-bar-sep" aria-hidden>·</span>}
                      <span className="lp-updates-bar-title">{item.title}</span>
                      {(item.event_date || item.event_time) && (
                        <span className="lp-updates-bar-meta">
                          {[item.event_date, item.event_time].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {contact?.enabled !== false && (
            <section id="contact" className="lp-band lp-band--flush">
              <div className="lp-contact-block">
                <div className="lp-contact-inner">
                  <div className="lp-contact-col">
                    <Text className="lp-vision-label">
                      {contact?.title || 'Contact'}
                    </Text>
                    <Title level={3} className="lp-contact-heading">
                      {contact?.touch_title || 'Get in touch'}
                    </Title>
                    {contact?.touch_body && (
                      <Paragraph className="lp-contact-line">
                        {contact.touch_body}
                      </Paragraph>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {about?.enabled !== false && aboutItems.length > 0 && (
            <section id="about" className="lp-band">
              <div className="lp-band-intro">
                <Title level={2} className="lp-band-title">
                  {about?.title || 'About us'}
                </Title>
                {about?.subtitle && (
                  <Paragraph className="lp-band-sub">
                    {about?.subtitle}
                  </Paragraph>
                )}
              </div>
              <div className="lp-band-bleed">
                <SectionDisplay style={about?.display_style || 'carousel'} className="lp-strip-display">
                  {aboutItems.map((item) => (
                    <article key={item.title} className="lp-feature">
                      <MediaBlock item={item} />
                      <div className="lp-feature-body">
                        <Title level={4} className="lp-feature-title">
                          {item.title}
                        </Title>
                        {item.tag && (
                          <Text className="lp-feature-tag">
                            {item.tag}
                          </Text>
                        )}
                        {item.text && (
                          <Paragraph className="lp-feature-text">
                            {item.text}
                          </Paragraph>
                        )}
                      </div>
                    </article>
                  ))}
                </SectionDisplay>
              </div>
            </section>
          )}
        </main>

        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <Link href="/" className="lp-footer-logo-wrap" aria-label={`${TENANT.name} home`}>
                <AppLogo variant="full" />
              </Link>
              <Text className="lp-footer-name">{TENANT.name}</Text>
              <Text className="lp-footer-tagline">{TENANT.tagline}</Text>
              <Text className="lp-footer-blurb">
                {footer?.blurb || ''}
              </Text>
            </div>

            <div className="lp-footer-col">
              <Text className="lp-footer-heading">Explore</Text>
              <nav className="lp-footer-nav" aria-label="Footer">
                <a href="#vision">Vision</a>
                <a href="#projects">Projects</a>
                <a href="#programs">Programs</a>
                <a href="#updates">Updates</a>
                <a href="#contact">Contact</a>
                <a href="#about">About</a>
                <Link href="/privacy">Privacy</Link>
              </nav>
            </div>

            <div className="lp-footer-col">
              <Text className="lp-footer-heading">
                <EnvironmentOutlined aria-hidden /> Visit
              </Text>
              <ul className="lp-footer-list">
                {(footer?.visit_lines || []).map((line) => (
                  <li key={line} className="lp-info-line">
                    <span className="lp-info-icon">{infoLineIcon(line)}</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-footer-col">
              <Text className="lp-footer-heading">
                <ClockCircleOutlined aria-hidden /> Office
              </Text>
              <ul className="lp-footer-list">
                {(footer?.office_lines || []).map((line) => (
                  <li key={line} className="lp-info-line">
                    <span className="lp-info-icon">{infoLineIcon(line)}</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <Text className="lp-copyright">
              &copy; {new Date().getFullYear()} {TENANT.name}. All rights reserved.
            </Text>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
}
