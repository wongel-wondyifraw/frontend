'use client';
import React, { useState, useEffect } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import './TimeWidget.css';

const TimeWidget = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="time-widget">
            <div className="time-header">
                <h3>Current Time</h3>
                <div className="time-icon-badge">
                    <ClockCircleOutlined />
                </div>
            </div>

            <div className="time-display">
                <div className="time-main">
                    {formatTime(time)}
                </div>
                <div className="date-sub">
                    {formatDate(time)}
                </div>
                <div className="timezone-info">
                    UTC{time.getTimezoneOffset() / 60 > 0 ? '-' : '+'}{Math.abs(time.getTimezoneOffset() / 60)}:00 (Local)
                </div>
            </div>
        </div>
    );
};

export default TimeWidget;
