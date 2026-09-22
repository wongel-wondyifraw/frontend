'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/Components/common/AppLogo';
import { getPageContent } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import './ChurchFeed.css';

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
      setContent(data.content || '');
    } catch (error) {
      console.log('No content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <AppLogo variant="full" href="/" priority />
          <nav style={{ display: 'flex', gap: 16 }}>
            <Link href="/about" className="landing-text-link">About</Link>
            <Link href="/vision" className="landing-text-link">Vision</Link>
            <Link href="/projects" className="landing-text-link">Projects</Link>
            <Link href="/contact" className="landing-text-link">Contact</Link>
          </nav>
        </div>
        <Link href="/login" className="landing-login-btn">
          Log in
        </Link>
      </header>

      <main style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <h1 style={{ marginBottom: 32 }}>{title}</h1>
        {loading ? (
          <p>Loading...</p>
        ) : content ? (
           <div className="markdown-body">
              <ReactMarkdown>{content}</ReactMarkdown>
           </div>
        ) : (
          <p>Content coming soon.</p>
        )}
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-actions">
          <Link href="/login" className="landing-login-btn landing-login-btn--solid">
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
