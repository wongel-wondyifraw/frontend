'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/Components/common/AppLogo';
import { getProjects } from '@/services/api';
import type { CommunityProject } from '@/types';
import dayjs from 'dayjs';
import '@/views/LandingPage/ChurchFeed.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects('active'); // active projects
      setProjects(data);
    } catch (error) {
      console.error(error);
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

      <main style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <h1 style={{ marginBottom: 32 }}>Community Projects</h1>
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length > 0 ? (
          <div className="landing-cards">
            {projects.map(project => (
              <article key={project.id} className="landing-card">
                {project.image_url && (
                  <div className="landing-card-media">
                    <img src={project.image_url} alt={project.title} className="landing-card-img" />
                    <span className="landing-card-tag">{project.status}</span>
                  </div>
                )}
                <div className="landing-card-body">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  {project.start_date && (
                    <cite>
                      {dayjs(project.start_date).format('MMM D, YYYY')} 
                      {project.end_date ? ` - ${dayjs(project.end_date).format('MMM D, YYYY')}` : ''}
                    </cite>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No active projects at this time.</p>
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
