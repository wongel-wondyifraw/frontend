import React, { useState, useEffect } from 'react';
import { Group, Church, VolunteerActivism, PersonAdd } from '@mui/icons-material';
import { Badge } from 'antd';
import { getMembers, getMinistries } from '../../../../services/api';
import './OverviewWidget.css';

const OverviewWidget = ({ settings }) => {
    const { title, totalLabel, icon, trend: defaultTrend, legend = [] } = settings;

    const [liveCount, setLiveCount] = useState(settings.count || '0');
    const [liveTrend, setLiveTrend] = useState(defaultTrend || '');
    const [breakdownItems, setBreakdownItems] = useState([]);

    // Icon mapping
    let IconComponent;
    switch (icon) {
        case 'group': IconComponent = <Group fontSize="small" />; break;
        case 'church': IconComponent = <Church fontSize="small" />; break;
        case 'volunteer': IconComponent = <VolunteerActivism fontSize="small" />; break;
        default: IconComponent = <Group fontSize="small" />;
    }

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
                    setBreakdownItems([
                        { label: 'Active', count: active, status: 'success' },
                        { label: 'Inactive', count: inactive, status: 'error' },
                    ]);
                    setLiveTrend(`+${active} active`);
                } else if (title === 'Total Ministries' || icon === 'volunteer') {
                    const ministries = await getMinistries();
                    const total = ministries.length;
                    setLiveCount(total.toLocaleString());
                    setBreakdownItems([
                        { label: 'Active', count: total, status: 'success' },
                        { label: 'Archived', count: 0, status: 'error' },
                    ]);
                    setLiveTrend(`${total} active`);
                } else if (title === 'Total Ministers' || icon === 'church') {
                    const data = settings.data || [];
                    setBreakdownItems(
                        data.map((d, i) => ({
                            label: d.name,
                            count: d.value,
                            status: i === 0 ? 'success' : 'warning',
                        }))
                    );
                }
            } catch (error) {
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

                <div className="overview-breakdown">
                    {breakdownItems.map((item, index) => (
                        <div key={index} className="breakdown-item">
                            <Badge status={item.status} />
                            <span className="breakdown-label">{item.label}</span>
                            <span className="breakdown-count">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OverviewWidget;
