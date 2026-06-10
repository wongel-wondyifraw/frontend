'use client';
import React from 'react';
import { NotificationOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './AnnouncementsWidget.css';

const announcements = [
    { id: 1, title: 'Annual General Meeting', date: 'Oct 25, 2025', priority: 'high' },
    { id: 2, title: 'New Building Fundraiser', date: 'Oct 28, 2025', priority: 'medium' },
    { id: 3, title: 'Youth Camp Registration', date: 'Nov 01, 2025', priority: 'normal' },
];

const AnnouncementsWidget = () => {
    return (
        <div className="announcements-widget">
            <div className="announcements-header">
                <h3>Announcements</h3>
                <div className="announcements-icon-badge">
                    <NotificationOutlined />
                </div>
            </div>

            <div className="announcements-list">
                {announcements.map((item) => (
                    <div key={item.id} className="announcement-item">
                        <div className={`priority-indicator ${item.priority}`}></div>
                        <div className="announcement-content">
                            <span className="announcement-title">{item.title}</span>
                            <span className="announcement-date">{item.date}</span>
                        </div>
                        {item.priority === 'high' && (
                            <div className="priority-badge">
                                <ExclamationCircleOutlined style={{ fontSize: 12 }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button className="view-all-btn">View All</button>
        </div>
    );
};

export default AnnouncementsWidget;
