'use client';
import React from 'react';
import { TeamOutlined, HomeOutlined, HeartOutlined, UserAddOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import { useDashboardStats } from '../../../../context/DashboardStatsContext';
import './OverviewWidget.css';

interface OverviewSettings {
  title?: string;
  totalLabel?: string;
  icon?: string;
  trend?: string;
  count?: string;
  data?: { name: string; value: number }[];
}

interface BreakdownItem {
  label: string;
  count: number;
  status: 'success' | 'error' | 'warning' | 'default' | 'processing';
}

const OverviewWidget = ({ settings = {} }: { settings?: OverviewSettings }) => {
    const { title, totalLabel, icon, trend: defaultTrend } = settings;
    const stats = useDashboardStats();

    let IconComponent;
    switch (icon) {
        case 'group': IconComponent = <TeamOutlined />; break;
        case 'church': IconComponent = <HomeOutlined />; break;
        case 'volunteer': IconComponent = <HeartOutlined />; break;
        default: IconComponent = <TeamOutlined />;
    }

    let liveCount = settings.count || '0';
    let liveTrend = defaultTrend || '';
    let breakdownItems: BreakdownItem[] = [];

    if (stats) {
        if (title === 'Total Members' || icon === 'group') {
            liveCount = stats.memberCount.toLocaleString();
            breakdownItems = [
                { label: 'Active', count: stats.activeMembers, status: 'success' },
                { label: 'Inactive', count: stats.inactiveMembers, status: 'error' },
            ];
            liveTrend = `+${stats.activeMembers} active`;
        } else if (title === 'Total Ministries' || icon === 'volunteer') {
            liveCount = stats.ministryCount.toLocaleString();
            breakdownItems = [
                { label: 'Active', count: stats.ministryCount, status: 'success' },
                { label: 'Archived', count: 0, status: 'error' },
            ];
            liveTrend = `${stats.ministryCount} active`;
        }
    } else if (title === 'Total Ministers' || icon === 'church') {
        const data = settings.data || [];
        breakdownItems = data.map((d, i) => ({
            label: d.name,
            count: d.value,
            status: i === 0 ? 'success' : 'warning',
        }));
    }

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
                        <UserAddOutlined />
                        <span>{liveTrend}</span>
                    </div>
                </div>

                <div className="overview-breakdown">
                    {breakdownItems.map((item) => (
                        <div key={item.label} className="breakdown-item">
                            <Badge status={item.status} text={item.label} />
                            <span className="breakdown-count">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OverviewWidget;
