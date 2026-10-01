'use client';
import React from 'react';
import { Skeleton, Space } from 'antd';
import './Skeletons.css';

const PublicSkeleton = () => {
  return (
    <div className="universal-skeleton-container" style={{ padding: 0 }}>
      {/* Navbar Skeleton */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton.Avatar active shape="circle" size="large" />
        <Space size="large" className="lp-desktop-only" style={{ display: 'none' }}>
           <Skeleton.Button active size="small" style={{ width: 80 }} />
           <Skeleton.Button active size="small" style={{ width: 80 }} />
           <Skeleton.Button active size="small" style={{ width: 80 }} />
        </Space>
        <Skeleton.Button active size="middle" style={{ width: 100 }} />
      </div>

      {/* Hero Skeleton */}
      <div className="public-skeleton-hero">
        <Skeleton active title={{ width: 400 }} paragraph={{ rows: 2, width: ['100%', '80%'] }} style={{ maxWidth: 600, textAlign: 'center' }} />
        <Space style={{ marginTop: 32 }}>
           <Skeleton.Button active size="large" shape="round" style={{ width: 150 }} />
           <Skeleton.Button active size="large" shape="round" style={{ width: 150 }} />
        </Space>
      </div>

      {/* Content Section Skeleton */}
      <div className="public-skeleton-section">
         <Skeleton active title={{ width: 250 }} paragraph={false} />
         <div className="skeleton-grid">
           <div className="skeleton-card">
              <Skeleton.Image active style={{ width: '100%', height: 200, marginBottom: 16 }} />
              <Skeleton active paragraph={{ rows: 2 }} />
           </div>
           <div className="skeleton-card">
              <Skeleton.Image active style={{ width: '100%', height: 200, marginBottom: 16 }} />
              <Skeleton active paragraph={{ rows: 2 }} />
           </div>
           <div className="skeleton-card">
              <Skeleton.Image active style={{ width: '100%', height: 200, marginBottom: 16 }} />
              <Skeleton active paragraph={{ rows: 2 }} />
           </div>
         </div>
      </div>
    </div>
  );
};

export default PublicSkeleton;
