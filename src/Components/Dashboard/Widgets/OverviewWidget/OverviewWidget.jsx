import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Group, Church, VolunteerActivism, PersonAdd } from '@mui/icons-material';
import { Badge } from 'antd';
import { getMembers, getMinistries } from '../../../../services/api';
import './OverviewWidget.css';

const OverviewWidget = ({ settings }) => {
    const { title, totalLabel, icon, trend: defaultTrend, data: defaultData = [], colors, legend = [] } = settings;

    const [liveCount, setLiveCount] = useState(settings.count || '0');
    const [liveData, setLiveData] = useState(defaultData);
    const [liveTrend, setLiveTrend] = useState(defaultTrend || '');

    // Icon mapping
    let IconComponent;
    switch (icon) {
        case 'group': IconComponent = <Group fontSize="small" />; break;
        case 'church': IconComponent = <Church fontSize="small" />; break;
        case 'volunteer': IconComponent = <VolunteerActivism fontSize="small" />; break;
        default: IconComponent = <Group fontSize="small" />;
    }

    const COLORS = colors || ['#3B82F6', '#DBEAFE'];

    // Fetch real-time data based on widget type
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (title === 'Total Members' || icon === 'group') {
                    const members = await getMembers();
                    const total = members.length;
                    const active = members.filter(m => (m.status || 'active').toLowerCase() === 'active').length;
                    const inactive = total - active;
                    setLiveCount(total.toLocaleString());
                    setLiveData([
                        { name: 'Active', value: active },
                        { name: 'Inactive', value: inactive },
                    ]);
                    setLiveTrend(`${active} active`);
                } else if (title === 'Total Ministries' || icon === 'volunteer') {
                    const ministries = await getMinistries();
                    const total = ministries.length;
                    setLiveCount(total.toLocaleString());
                    setLiveData([
                        { name: 'Active', value: total },
                        { name: 'Hiatus', value: 0 },
                    ]);
                    setLiveTrend(`${total} active`);
                }
                // 'Total Ministers' (church icon) stays with settings data since there's no separate ministers API
            } catch (error) {
                // Silently fall back to settings data
                console.warn('Failed to fetch live widget data:', error);
            }
        };
        fetchData();
    }, [title, icon]);

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
                    <span className="stat-value">{liveCount}</span>
                    <div className="stat-trend positive">
                        <PersonAdd fontSize="inherit" />
                        <span>{liveTrend}</span>
                    </div>
                </div>

                <div className="overview-chart-wrapper">
                    <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                            <Pie
                                data={liveData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={45}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {liveData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend">
                        {legend.map((item, index) => (
                            <span key={index} className="legend-item">
                                <Badge
                                    status={index === 0 ? 'success' : 'error'}
                                    style={{ marginRight: 4 }}
                                />
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
