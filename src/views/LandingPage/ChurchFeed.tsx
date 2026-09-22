'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import AppLogo from '@/Components/common/AppLogo';
import { TENANT } from '@/lib/tenant';
import './ChurchFeed.css';

const HIGHLIGHTS = [
  {
    title: 'Sunday Worship',
    text: 'Join us at 10:00 AM for Word, worship, and communion in the main sanctuary.',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1400&q=80',
    tag: 'This Sunday',
  },
  {
    title: 'Daily Verse',
    text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles.',
    ref: 'Isaiah 40:31',
    image: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1400&q=80',
    tag: 'Scripture',
  },
  {
    title: 'Life Groups',
    text: 'Home groups across the city — prayer, fellowship, and discipleship through the week.',
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1400&q=80',
    tag: 'Community',
  },
];

const POSTS = [
  {
    author: 'Pastor Daniel',
    time: '2h ago',
    body: 'This Sunday we continue “Faith That Moves.” Come early for prayer at 8:30 AM.',
  },
  {
    author: 'Worship Team',
    time: 'Yesterday',
    body: 'Friday Night Worship — acoustic set and open testimony. Doors open at 6:30 PM.',
  },
  {
    author: 'Youth Ministry',
    time: '2d ago',
    body: 'Youth night theme: Courage in the ordinary. Bring a friend — snacks provided.',
  },
];

export default function ChurchFeed() {
  const reduceMotion = useReducedMotion();

  const fade = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <AppLogo variant="full" href="/" priority showPoweredBy />
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

      <main>
        <section className="landing-hero">
          <motion.div
            className="landing-hero-media"
            {...fade}
            transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.12 }}
          >
            <img
              src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1800&q=80"
              alt="People worshipping together in church"
              className="landing-hero-img"
            />
            <div className="landing-hero-overlay" />
            <div className="landing-hero-copy">
              <p className="landing-kicker">Welcome</p>
              <h1>{TENANT.name}</h1>
              <p className="landing-lede">
                {TENANT.tagline} Worship updates, Scripture, and weekend life for our church family.
              </p>
              <div className="landing-hero-actions">
                <Link href="/login" className="landing-login-btn landing-login-btn--solid">
                  Staff login
                </Link>
                <a href="#highlights" className="landing-text-link landing-text-link--light">
                  Explore the page
                </a>
              </div>
            </div>
            <div className="landing-verse-chip">
              <span className="landing-verse-ref">Matthew 28:19</span>
              <p>Go and make disciples of all nations…</p>
            </div>
          </motion.div>
        </section>

        <section id="highlights" className="landing-section">
          <h2>This week at church</h2>
          <div className="landing-cards">
            {HIGHLIGHTS.map((item, i) => (
              <motion.article
                key={item.title}
                className="landing-card"
                {...fade}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.08 * i }}
              >
                <div className="landing-card-media">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="landing-card-img"
                  />
                  <span className="landing-card-tag">{item.tag}</span>
                </div>
                <div className="landing-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  {item.ref && <cite>{item.ref}</cite>}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--posts">
          <div className="landing-posts-head">
            <h2>Latest from the church</h2>
            <Link href="/login" className="landing-text-link">
              Log in to manage
            </Link>
          </div>
          <div className="landing-posts">
            {POSTS.map((post) => (
              <article key={post.author + post.time} className="landing-post">
                <div className="landing-post-meta">
                  <strong>{post.author}</strong>
                  <span>{post.time}</span>
                </div>
                <p>{post.body}</p>
              </article>
            ))}
          </div>
        </section>
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
