'use client';
import React from 'react';
import { Skeleton } from 'antd';
import './Skeletons.css';

const LoginSkeleton = () => {
  return (
    <div className="universal-skeleton-container" style={{ padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Skeleton */}
      <div style={{ padding: '24px' }}>
        <Skeleton.Button active size="small" style={{ width: 120 }} />
      </div>

      {/* Centered Card Skeleton */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
        <div className="skeleton-card" style={{ width: '100%', maxWidth: 440, padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Skeleton active title={false} paragraph={{ rows: 2, width: ['40%', '60%'] }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} />
          </div>
          
          <Skeleton.Input active block size="large" style={{ marginBottom: 24, height: 48 }} />
          <Skeleton.Input active block size="large" style={{ marginBottom: 24, height: 48 }} />
          
          <Skeleton.Button active block size="large" style={{ marginBottom: 16, height: 48 }} />
          <Skeleton.Button active block size="large" style={{ height: 48 }} />
          
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Skeleton.Input active size="small" style={{ width: 150 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSkeleton;
