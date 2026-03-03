import React from 'react';
import { PersonAdd, Church, VolunteerActivism, Email } from '@mui/icons-material';
import './QuickActions.css';

const QuickActions = () => {
    const actions = [
        { icon: <PersonAdd fontSize="small" />, label: 'Add Member' },
        { icon: <Church fontSize="small" />, label: 'Create Ministry' },
        { icon: <VolunteerActivism fontSize="small" />, label: 'Add Donation' },
        { icon: <Email fontSize="small" />, label: 'Send Email' },
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
