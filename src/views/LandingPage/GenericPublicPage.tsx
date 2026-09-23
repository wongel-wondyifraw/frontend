'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spin, Typography, ConfigProvider, theme, Empty } from 'antd';
import ReactMarkdown from 'react-markdown';
import AppLogo from '@/Components/common/AppLogo';
import { TENANT } from '@/lib/tenant';
import { getPageContent } from '@/services/api';
import './ChurchFeed.css';

const { Title, Text } = Typography;

const landingTheme = {
  token: {
    colorPrimary: '#1E40AF',
    colorLink: '#1E40AF',
    borderRadius: 10,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  algorithm: theme.defaultAlgorithm,
};

export default function GenericPublicPage({ slug, title }: { slug: string; title: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getPageContent(slug);
      const raw = data.content;
      if (typeof raw === 'string') setContent(raw);
      else if (raw && typeof raw === 'object' && 'content' in (raw as object)) {
        setContent(String((raw as { content?: unknown }).content || ''));
      } else setContent('');
    } catch {
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={landingTheme}>
      <div className="lp-shell">
        <header className="lp-header">
          <div className="lp-header-inner">
            <AppLogo variant="full" href="/" priority />
            <nav className="lp-nav" aria-label="Primary">
              <Link href="/#about">About</Link>
              <Link href="/#vision">Vision</Link>
              <Link href="/#projects">Projects</Link>
              <Link href="/#contact">Contact</Link>
            </nav>
          </div>
        </header>

        <main className="lp-public-main">
          <Title level={1} className="lp-public-title">
            {title}
          </Title>
          <Card className="lp-public-card" variant="outlined">
            {loading ? (
              <div className="lp-public-loading">
                <Spin size="large" />
                <Text type="secondary">Loading content…</Text>
              </div>
            ) : content ? (
              <div className="markdown-body">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <Empty description="Content coming soon" />
            )}
          </Card>
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
                A Christ-centered community gathering for worship, fellowship, and discipleship —
                welcoming families and neighbors across Goro.
              </Text>
            </div>

            <div className="lp-footer-col">
              <Text className="lp-footer-heading">Explore</Text>
              <nav className="lp-footer-nav" aria-label="Footer">
                <Link href="/#about">About</Link>
                <Link href="/#vision">Vision</Link>
                <Link href="/#projects">Projects</Link>
                <Link href="/#contact">Contact</Link>
                <Link href="/privacy">Privacy</Link>
              </nav>
            </div>

            <div className="lp-footer-col">
              <Text className="lp-footer-heading">Visit</Text>
              <ul className="lp-footer-list">
                <li>Sunday worship · 10:00 AM</li>
                <li>Prayer · Sundays 8:30 AM</li>
                <li>Goro, Addis Ababa</li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <Text className="lp-footer-heading">Office</Text>
              <ul className="lp-footer-list">
                <li>Mon–Fri · 9:00 AM – 5:00 PM</li>
                <li>Come by after service or during office hours</li>
                <li>We would love to meet you</li>
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
