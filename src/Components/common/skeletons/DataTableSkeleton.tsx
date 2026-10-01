'use client';
import React from 'react';
import { Skeleton, Space } from 'antd';
import './Skeletons.css';

const DataTableSkeleton = () => {
  return (
    <div className="universal-skeleton-container" style={{ padding: 0 }}>
      <div className="skeleton-header-row" style={{ padding: '0 24px', paddingTop: 24, marginBottom: 16 }}>
        <Skeleton.Input active size="large" style={{ width: 250 }} />
        <Space>
          <Skeleton.Button active size="middle" />
        </Space>
      </div>
      
      {/* Filter toolbar area */}
      <div style={{ padding: '0 24px', marginBottom: 24, display: 'flex', gap: 16 }}>
         <Skeleton.Input active size="middle" style={{ width: 300 }} />
         <Skeleton.Button active size="middle" />
         <Skeleton.Button active size="middle" />
      </div>

      {/* Table Area */}
      <div className="skeleton-card" style={{ margin: '0 24px' }}>
        <Skeleton active title={false} paragraph={{ rows: 10, width: ['100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '80%'] }} />
      </div>
    </div>
  );
};

export default DataTableSkeleton;
