'use client';
import React from 'react';
import './Skeletons.css';

const AppSkeleton = () => {
  return (
    <div className="universal-skeleton-container" aria-busy="true" aria-label="Loading page content">
      <div className="skeleton-header-row">
        <div className="sk-shimmer sk-input" />
        <div className="skeleton-actions-row">
          <div className="sk-shimmer sk-button" />
          <div className="sk-shimmer sk-button" />
        </div>
      </div>

      <div className="skeleton-grid" style={{ marginBottom: 24, marginTop: 0 }}>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <div className="sk-shimmer sk-title" />
          <div className="sk-shimmer sk-line" />
          <div className="sk-shimmer sk-line sk-line--short" />
        </div>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <div className="sk-shimmer sk-title" />
          <div className="sk-shimmer sk-line" />
          <div className="sk-shimmer sk-line sk-line--short" />
        </div>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <div className="sk-shimmer sk-title" />
          <div className="sk-shimmer sk-line" />
          <div className="sk-shimmer sk-line sk-line--short" />
        </div>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <div className="sk-shimmer sk-title" />
          <div className="sk-shimmer sk-line" />
          <div className="sk-shimmer sk-line sk-line--short" />
        </div>
      </div>

      <div className="skeleton-card">
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line" />
        <div className="sk-shimmer sk-line sk-line--short" />
      </div>
    </div>
  );
};

export default AppSkeleton;
