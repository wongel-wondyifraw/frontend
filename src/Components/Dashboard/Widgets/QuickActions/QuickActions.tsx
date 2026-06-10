'use client';
import React from 'react';
import { UserAddOutlined, HomeOutlined, HeartOutlined, MailOutlined } from '@ant-design/icons';
import './QuickActions.css';

const QuickActions = () => {
    const actions = [
        { icon: <UserAddOutlined />, label: 'Add Member' },
        { icon: <HomeOutlined />, label: 'Create Ministry' },
        { icon: <HeartOutlined />, label: 'Add Donation' },
        { icon: <MailOutlined />, label: 'Send Email' },
    ];

    return (
        <div className="quick-actions-card">
            <div className="quick-actions-header">
                <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
                {actions.map((action, index) => (
                    <button key={index} className="action-btn">
                        <div className="action-icon">
                            {action.icon}
                        </div>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
