'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import './MemberOverviewWidget.css';

const data = [
    { name: 'Active', value: 850 },
    { name: 'Inactive', value: 150 },
];

const COLORS = ['#3B82F6', '#DBEAFE'];

const MemberOverviewWidget = () => {
    return (
        <div className="member-overview-widget">
            <div className="member-header">
                <h3>Member Overview</h3>
                <div className="member-icon-badge">
                    <TeamOutlined />
                </div>
            </div>

            <div className="member-stats-row">
                <div className="member-stat-main">
                    <span className="stat-label">Total Members</span>
                    <span className="stat-value">1,000</span>
                    <div className="stat-trend positive">
                        <UserAddOutlined />
                        <span>+12 this month</span>
                    </div>
                </div>

                <div className="member-chart-wrapper">
                    <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={45}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend">
                        <span className="legend-item"><span className="dot active"></span>Active</span>
                        <span className="legend-item"><span className="dot inactive"></span>Inactive</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberOverviewWidget;
