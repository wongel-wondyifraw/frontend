import React from 'react';
import './Notifications.css';

const notifications = [
    { id: 1, name: 'Kathryn Murphy', action: 'Request', desc: 'Request to you for $120', time: '1 Hrs', status: 'Successful', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=50&q=80' },
    { id: 2, name: 'Dianne Russell', action: 'Transfer', desc: 'Transfer from you for $100', time: '16 Hrs', status: 'Pending', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=50&q=80' },
    { id: 3, name: 'Bessie Cooper', action: 'Transfer', desc: 'Transfer from you for $230', time: '24 Hrs', status: 'Successful', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=50&q=80' },
    { id: 4, name: 'Ralph Edwards', action: 'Request', desc: 'Request to you for $120', time: '36 Hrs', status: 'Declined', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=50&q=80' },
];

const Notifications = () => {
    return (
        <div className="notifications-container">
            <div className="section-header">
                <h3>Notifications</h3>
                <button className="view-all-btn">Mark as Read</button>
            </div>

            <div className="notifications-list">
                {notifications.map(notif => (
                    <div key={notif.id} className="notification-item">
                        <img src={notif.avatar} alt={notif.name} className="notif-avatar" />
                        <div className="notif-content">
                            <div className="notif-title">
                                <span className="name">{notif.name}</span>
                                <span className="action-tag">{notif.action}</span>
                            </div>
                            <p className="notif-desc">{notif.desc}</p>
                        </div>
                        <div className="notif-meta">
                            <span className="time">{notif.time}</span>
                            <span className={`status ${notif.status.toLowerCase()}`}>
                                {notif.status === 'Successful' && '✓ Successful'}
                                {notif.status === 'Pending' && '◷ Pending'}
                                {notif.status === 'Declined' && '✕ Declined'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
