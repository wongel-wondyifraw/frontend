import React from 'react';
import { AccessTime } from '@mui/icons-material';
import './UpcomingPrograms.css';

const UpcomingPrograms = () => {
    const programs = [
        { id: 1, title: 'Youth Ministry Meeting', date: '15', month: 'OCT', time: '10:00 AM - 12:00 PM' },
        { id: 2, title: 'Sunday Service Prep', date: '18', month: 'OCT', time: '06:00 PM - 08:00 PM' },
        { id: 3, title: 'Community Outreach', date: '22', month: 'OCT', time: '09:00 AM - 02:00 PM' },
        { id: 4, title: 'Choir Practice', date: '25', month: 'OCT', time: '05:00 PM - 07:00 PM' },
    ];

    return (
        <div className="upcoming-programs-card">
            <h3>Upcoming Programs</h3>
            <div className="programs-list">
                {programs.map((program) => (
                    <div key={program.id} className="program-item">
                        <div className="program-date-box">
                            <span className="program-day">{program.date}</span>
                            <span className="program-month">{program.month}</span>
                        </div>
                        <div className="program-info">
                            <div className="program-title">{program.title}</div>
                            <div className="program-time">
                                <AccessTime style={{ fontSize: 14 }} />
                                {program.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UpcomingPrograms;
