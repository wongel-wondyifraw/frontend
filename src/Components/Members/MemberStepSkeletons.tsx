'use client';

import React from 'react';
import type { DynamicOptionsLoadingProps } from 'next/dynamic';
import { Button } from 'antd';
import { RefreshCw, WifiOff } from 'lucide-react';
import './MemberStepSkeletons.css';

interface StepSkeletonBannerProps {
  error?: Error | null;
  retry?: () => void;
}

function StepNetworkErrorBanner({ error, retry }: StepSkeletonBannerProps) {
  if (!error) return null;

  return (
    <div
      id="member-step-network-banner"
      className="member-step-error-banner"
      role="alert"
    >
      <div
        className="member-step-error-text"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <WifiOff size={16} aria-hidden="true" />
        <span>
          Network unavailable. Your form entries are safe.
        </span>
      </div>
      {retry ? (
        <Button
          size="small"
          type="primary"
          icon={<RefreshCw size={14} />}
          onClick={retry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function MemberFamilySectionSkeleton({
  error,
  retry,
}: DynamicOptionsLoadingProps) {
  return (
    <div
      id="member-family-section-skeleton"
      className="member-step-skeleton-family"
      aria-busy="true"
      aria-label="Loading family fields"
    >
      <StepNetworkErrorBanner error={error} retry={retry} />
      <div className="member-step-skeleton-family-head">
        <div
          className="sk-shimmer"
          style={{ width: 170, height: 18 }}
        />
        <div
          className="sk-shimmer"
          style={{ width: 84, height: 26, borderRadius: 6 }}
        />
      </div>
      <div className="member-step-skeleton-field">
        <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
        <div className="member-step-skeleton-radios">
          <div className="sk-shimmer member-step-skeleton-radio-pill" />
          <div className="sk-shimmer member-step-skeleton-radio-pill" />
        </div>
      </div>
      <div
        className="member-step-skeleton-checkbox-item"
        style={{ marginTop: 4 }}
      >
        <div className="sk-shimmer member-step-skeleton-checkbox-box" />
        <div
          className="sk-shimmer"
          style={{ width: 190, height: 14 }}
        />
      </div>
    </div>
  );
}

export function ContactStepSkeleton({
  error,
  retry,
}: DynamicOptionsLoadingProps) {
  return (
    <div
      id="member-step-contact-skeleton"
      className="member-step-skeleton"
      aria-busy="true"
      aria-label="Loading Contact and Location step"
    >
      <StepNetworkErrorBanner error={error} retry={retry} />
      <div className="member-step-skeleton-heading">
        <div className="sk-shimmer member-step-skeleton-icon" />
        <div className="sk-shimmer member-step-skeleton-title" />
      </div>
      <div className="member-step-skeleton-grid-2">
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
      </div>
      <div className="member-step-skeleton-grid-2">
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
      </div>
      <div className="member-step-skeleton-grid-3">
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
      </div>
      <div className="member-step-skeleton-field" style={{ marginBottom: 0 }}>
        <div className="sk-shimmer member-step-skeleton-label" />
        <div className="sk-shimmer member-step-skeleton-textarea" />
      </div>
    </div>
  );
}

export function ProfessionalStepSkeleton({
  error,
  retry,
}: DynamicOptionsLoadingProps) {
  return (
    <div
      id="member-step-professional-skeleton"
      className="member-step-skeleton"
      aria-busy="true"
      aria-label="Loading Professional Information step"
    >
      <StepNetworkErrorBanner error={error} retry={retry} />
      <div className="member-step-skeleton-heading">
        <div className="sk-shimmer member-step-skeleton-icon" />
        <div
          className="sk-shimmer member-step-skeleton-title"
          style={{ width: 204 }}
        />
      </div>
      <div className="member-step-skeleton-grid-2">
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
      </div>
      <div className="member-step-skeleton-grid-2">
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
      </div>
      <div className="member-step-skeleton-field" style={{ marginBottom: 0 }}>
        <div className="sk-shimmer member-step-skeleton-label" />
        <div className="sk-shimmer member-step-skeleton-control" />
      </div>
    </div>
  );
}

export function SpiritualStepSkeleton({
  error,
  retry,
}: DynamicOptionsLoadingProps) {
  return (
    <div
      id="member-step-spiritual-skeleton"
      className="member-step-skeleton"
      aria-busy="true"
      aria-label="Loading Spiritual Info step"
    >
      <StepNetworkErrorBanner error={error} retry={retry} />
      <div className="member-step-skeleton-heading">
        <div className="sk-shimmer member-step-skeleton-icon" />
        <div
          className="sk-shimmer member-step-skeleton-title"
          style={{ width: 132 }}
        />
      </div>
      <div className="member-step-skeleton-field">
        <div className="sk-shimmer member-step-skeleton-label" />
        <div className="sk-shimmer member-step-skeleton-control" />
      </div>
      <div className="member-step-skeleton-grid-2">
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="member-step-skeleton-radios">
            <div className="sk-shimmer member-step-skeleton-radio-pill" />
            <div className="sk-shimmer member-step-skeleton-radio-pill" />
          </div>
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
          <div className="member-step-skeleton-radios">
            <div className="sk-shimmer member-step-skeleton-radio-pill" />
            <div className="sk-shimmer member-step-skeleton-radio-pill" />
          </div>
        </div>
      </div>
      <div className="member-step-skeleton-grid-2" style={{ marginBottom: 0 }}>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
          <div className="sk-shimmer member-step-skeleton-upload-btn" />
          <div className="sk-shimmer member-step-skeleton-helper" />
        </div>
        <div className="member-step-skeleton-field">
          <div className="sk-shimmer member-step-skeleton-label" />
          <div className="sk-shimmer member-step-skeleton-control" />
        </div>
      </div>
    </div>
  );
}

export function MinistryStepSkeleton({
  error,
  retry,
}: DynamicOptionsLoadingProps) {
  const widths = [74, 88, 96, 70, 108, 84, 68, 92, 112];

  return (
    <div
      id="member-step-ministry-skeleton"
      className="member-step-skeleton"
      aria-busy="true"
      aria-label="Loading Ministry Information step"
    >
      <StepNetworkErrorBanner error={error} retry={retry} />
      <div className="member-step-skeleton-heading">
        <div className="sk-shimmer member-step-skeleton-icon" />
        <div
          className="sk-shimmer member-step-skeleton-title"
          style={{ width: 184 }}
        />
      </div>
      <div className="member-step-skeleton-field" style={{ marginBottom: 0 }}>
        <div className="sk-shimmer member-step-skeleton-label member-step-skeleton-label--wide" />
        <div className="member-step-skeleton-checkbox-grid">
          {widths.map((w, idx) => (
            <div key={idx} className="member-step-skeleton-checkbox-item">
              <div className="sk-shimmer member-step-skeleton-checkbox-box" />
              <div
                className="sk-shimmer member-step-skeleton-checkbox-label"
                style={{ width: w }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewStepSkeleton({
  error,
  retry,
}: DynamicOptionsLoadingProps) {
  return (
    <div
      id="member-step-review-skeleton"
      className="member-step-skeleton"
      aria-busy="true"
      aria-label="Loading Review step"
    >
      <StepNetworkErrorBanner error={error} retry={retry} />
      <div className="member-step-skeleton-heading">
        <div className="sk-shimmer member-step-skeleton-icon" />
        <div
          className="sk-shimmer member-step-skeleton-title"
          style={{ width: 96 }}
        />
      </div>
      <div className="member-step-skeleton-review-card">
        <div
          className="sk-shimmer"
          style={{ width: 172, height: 18 }}
        />
        <div className="member-step-skeleton-review-grid">
          {Array.from({ length: 14 }).map((_, idx) => (
            <div
              key={idx}
              className="sk-shimmer member-step-skeleton-review-item"
              style={{ width: idx % 3 === 0 ? '88%' : '76%' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

