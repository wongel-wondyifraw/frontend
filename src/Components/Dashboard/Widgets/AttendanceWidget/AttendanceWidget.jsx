import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { EventAvailable, TrendingUp } from '@mui/icons-material';
import './AttendanceWidget.css';

const data = [
    { name: 'S1', value: 400 },
    { name: 'S2', value: 380 },
    { name: 'S3', value: 420 },
    { name: 'S4', value: 450 },
    { name: 'S5', value: 480 },
    { name: 'S6', value: 460 },
    { name: 'S7', value: 520 },
];

const AttendanceWidget = () => {
    return (
        <div className="attendance-widget">
            <div className="attendance-header">
                <h3>Attendance Snapshot</h3>
                <div className="attendance-icon-badge">
                    <EventAvailable fontSize="small" />
                </div>
            </div>

            <div className="attendance-content">
                <div className="attendance-main">
                    <span className="attendance-label">Last Service</span>
                    <span className="attendance-value">520</span>
                    <div className="attendance-trend up">
                        <TrendingUp fontSize="inherit" />
                        <span>12% vs last week</span>
                    </div>
                </div>

                <div className="attendance-mini-chart">
                    <ResponsiveContainer width="100%" height={60}>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7F56D9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#7F56D9"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AttendanceWidget;
