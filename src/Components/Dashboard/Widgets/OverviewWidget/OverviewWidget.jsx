import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Group, Church, VolunteerActivism, PersonAdd } from '@mui/icons-material';
import './OverviewWidget.css';

const OverviewWidget = ({ settings }) => {
    const { title, count, totalLabel, icon, trend, data = [], colors, legend = [] } = settings;

    // Icon mapping
    let IconComponent;
    switch (icon) {
        case 'group': IconComponent = <Group fontSize="small" />; break;
        case 'church': IconComponent = <Church fontSize="small" />; break;
        case 'volunteer': IconComponent = <VolunteerActivism fontSize="small" />; break;
        default: IconComponent = <Group fontSize="small" />;
    }

    const COLORS = colors || ['#3B82F6', '#DBEAFE'];

    return (
        <div className="overview-widget">
            <div className="overview-header">
                <h3>{title}</h3>
                <div className="overview-icon-badge">
                    {IconComponent}
                </div>
            </div>

            <div className="overview-stats-row">
                <div className="overview-stat-main">
                    <span className="stat-label">{totalLabel}</span>
                    <span className="stat-value">{count}</span>
                    <div className="stat-trend positive">
                        <PersonAdd fontSize="inherit" />
                        <span>{trend}</span>
                    </div>
                </div>

                <div className="overview-chart-wrapper">
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
                        {legend.map((item, index) => (
                            <span key={index} className="legend-item">
                                <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewWidget;
