'use client';
import React from 'react';
import { NotificationOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Empty, Spin } from 'antd';
import { useNotifications } from '@/context/NotificationsContext';
import './AnnouncementsWidget.css';

const AnnouncementsWidget = () => {
    const { items, loading } = useNotifications();
    const systemItems = items.filter((n) => n.kind === 'system' || n.kind === 'member' || n.kind === 'ministry').slice(0, 5);

    return (
        <div className="announcements-widget">
            <div className="announcements-header">
                <h3>Announcements</h3>
                <div className="announcements-icon-badge">
                    <NotificationOutlined />
                </div>
            </div>

            <div className="announcements-list">
                {loading && systemItems.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
                ) : systemItems.length === 0 ? (
                    <Empty description="No recent announcements" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    systemItems.map((item) => (
                        <div key={item.id} className="announcement-item">
                            <div className={`priority-indicator ${item.severity === 'warning' ? 'high' : item.severity === 'success' ? 'medium' : 'normal'}`} />
                            <div className="announcement-content">
                                <span className="announcement-title">{item.title}</span>
                                <span className="announcement-date">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {item.severity === 'warning' && (
                                <div className="priority-badge">
                                    <ExclamationCircleOutlined style={{ fontSize: 12 }} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AnnouncementsWidget;
