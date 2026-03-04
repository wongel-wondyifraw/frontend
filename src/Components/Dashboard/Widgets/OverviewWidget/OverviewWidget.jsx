import React, { useState, useEffect } from 'react';
import { Badge } from 'antd';
import { Group, Church, VolunteerActivism, TrendingUp } from '@mui/icons-material';
import { getMembers, getMinistries } from '../../../../services/api';
import './OverviewWidget.css';

const OverviewWidget = ({ settings }) => {
    const { title, icon, totalLabel } = settings;
    const [liveCount, setLiveCount] = useState(null);
    const [statusItems, setStatusItems] = useState([]);
    const [trendText, setTrendText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (icon === 'group') {
                    const members = await getMembers();
                    const total = members.length;
                    const active = members.filter(m => (m.status || 'active').toLowerCase() === 'active').length;
                    const inactive = total - active;
                    setLiveCount(total);
                    setStatusItems([
                        { label: 'Active', count: active, color: '#10b981' },
                        { label: 'Inactive', count: inactive, color: '#ef4444' },
                    ]);
                    setTrendText(`${active} active`);
                } else if (icon === 'volunteer') {
                    const ministries = await getMinistries();
                    const total = ministries.length;
                    setLiveCount(total);
                    setStatusItems([
                        { label: 'Active', count: total, color: '#10b981' },
                        { label: 'Archived', count: 0, color: '#ef4444' },
                    ]);
                    setTrendText(`${total} registered`);
                } else {
                    setLiveCount(settings.count || '0');
                    setStatusItems(
                        (settings.data || []).map((d, i) => ({
                            label: d.name,
                            count: d.value,
                            color: i === 0 ? '#10b981' : '#ef4444',
                        }))
                    );
                    setTrendText(settings.trend || '');
                }
            } catch (error) {
                console.error('Widget data fetch error:', error);
                setLiveCount(settings.count || '—');
                setTrendText(settings.trend || '');
            }
        };
        fetchData();
    }, [icon, settings]);

    let IconComponent;
    switch (icon) {
        case 'group': IconComponent = <Group fontSize="small" />; break;
        case 'church': IconComponent = <Church fontSize="small" />; break;
        case 'volunteer': IconComponent = <VolunteerActivism fontSize="small" />; break;
        default: IconComponent = <Group fontSize="small" />;
    }

    const displayCount = liveCount !== null ? liveCount : (settings.count || '—');
    const displayTrend = trendText || settings.trend || '';

    return (
        <div className="overview-widget">
            <div className="overview-header">
                <h3>{title}</h3>
                <div className="overview-icon-badge">
                    {IconComponent}
                </div>
            </div>

            <div className="overview-body">
                <div className="overview-stat-main">
                    <span className="stat-label">{totalLabel}</span>
                    <span className="stat-value">{displayCount}</span>
                    <div className="stat-trend positive">
                        <TrendingUp fontSize="inherit" />
                        <span>{displayTrend}</span>
                    </div>
                </div>

                <div className="overview-status-list">
                    {statusItems.map((item, index) => (
                        <div key={index} className="status-row">
                            <Badge color={item.color} />
                            <span className="status-label">{item.label}</span>
                            <span className="status-count">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OverviewWidget;
