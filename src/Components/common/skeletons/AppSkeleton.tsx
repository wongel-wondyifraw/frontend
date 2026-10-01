'use client';
import React from 'react';
import { Skeleton, Space } from 'antd';
import './Skeletons.css';

const AppSkeleton = () => {
  return (
    <div className="universal-skeleton-container">
      <div className="skeleton-header-row">
        <Skeleton.Input active size="large" style={{ width: 250 }} />
        <Space>
          <Skeleton.Button active size="middle" />
          <Skeleton.Button active size="middle" />
        </Space>
      </div>

      <div className="skeleton-grid" style={{ marginBottom: 24, marginTop: 0 }}>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
        <div className="skeleton-card" style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      </div>

      <div className="skeleton-card">
        <Skeleton active title={false} paragraph={{ rows: 10, width: ['100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '80%'] }} />
      </div>
    </div>
  );
};

export default AppSkeleton;
