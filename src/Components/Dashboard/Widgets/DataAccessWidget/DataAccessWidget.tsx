'use client';

import React from 'react';
import { SafetyOutlined } from '@ant-design/icons';
import './DataAccessWidget.css';

/** Placeholder until audit-log API is wired — no fake activity. */
const DataAccessWidget = () => {
  return (
    <div className="data-access-widget">
      <div className="data-access-header">
        <h3>Data Access</h3>
        <div className="data-access-icon-badge">
          <SafetyOutlined />
        </div>
      </div>

      <div className="support-status">
        <span className="status-label">Audit trail:</span>
        <div className="status-badge disabled">
          <span>Coming soon</span>
        </div>
      </div>

      <div className="access-logs-list">
        <p className="log-meta" style={{ padding: '8px 0', margin: 0 }}>
          Access logs will appear here when audit logging is enabled.
        </p>
      </div>
    </div>
  );
};

export default DataAccessWidget;
