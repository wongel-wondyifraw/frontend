'use client';
import React from 'react';
import { SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './DataAccessWidget.css';

const accessLogs = [
    { id: 1, user: 'Admin User', action: 'Exported Member List', time: '10 mins ago' },
    { id: 2, user: 'Finance Team', action: 'Viewed Reports', time: '1 hour ago' },
    { id: 3, user: 'System', action: 'Backup Completed', time: '2 hours ago' },
];

const DataAccessWidget = () => {
    const isSupportEnabled = true;

    return (
        <div className="data-access-widget">
            <div className="data-access-header">
                <h3>Data Access</h3>
                <div className="data-access-icon-badge">
                    <SafetyOutlined />
                </div>
            </div>

            <div className="support-status">
                <span className="status-label">Support Access:</span>
                <div className={`status-badge ${isSupportEnabled ? 'enabled' : 'disabled'}`}>
                    {isSupportEnabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    <span>{isSupportEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
            </div>

            <div className="access-logs-list">
                {accessLogs.map((log) => (
                    <div key={log.id} className="log-item">
                        <div className="log-avatar">
                            {log.user.charAt(0)}
                        </div>
                        <div className="log-details">
                            <span className="log-action">{log.action}</span>
                            <span className="log-meta">{log.user} • {log.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataAccessWidget;
