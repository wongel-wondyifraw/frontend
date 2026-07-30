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
  metric?: 'members' | 'ministers' | 'ministries';
}

interface BreakdownItem {
  label: string;
  count: number;
  status: 'success' | 'error' | 'warning' | 'default' | 'processing';
}

function resolveMetric(settings: OverviewSettings): 'members' | 'ministers' | 'ministries' | null {
  if (settings.metric) return settings.metric;
  if (settings.icon === 'group' || settings.title === 'Total Members') return 'members';
  if (settings.icon === 'church' || settings.title === 'Total Ministers') return 'ministers';
  if (settings.icon === 'volunteer' || settings.title === 'Total Ministries') return 'ministries';
  return null;
}

function formatTrend(count: number, noun: string) {
  if (count <= 0) return `No new ${noun} this month`;
  return `+${count} this month`;
}

const OverviewWidget = ({ settings = {} }: { settings?: OverviewSettings }) => {
  const { title, totalLabel, icon } = settings;
  const stats = useDashboardStats();
  const metric = resolveMetric(settings);

  let IconComponent;
  switch (icon) {
    case 'group': IconComponent = <TeamOutlined />; break;
    case 'church': IconComponent = <HomeOutlined />; break;
    case 'volunteer': IconComponent = <HeartOutlined />; break;
    default: IconComponent = <TeamOutlined />;
  }

  let liveCount = '—';
  let liveTrend = '';
  let breakdownItems: BreakdownItem[] = [];

  if (stats && metric === 'members') {
    liveCount = stats.memberCount.toLocaleString();
    liveTrend = formatTrend(stats.membersThisMonth ?? 0, 'members');
    breakdownItems = [
      { label: 'Active', count: stats.activeMembers, status: 'success' },
      { label: 'Inactive', count: stats.inactiveMembers, status: 'error' },
    ];
  } else if (stats && metric === 'ministers') {
    liveCount = stats.ministerCount.toLocaleString();
    liveTrend = formatTrend(stats.ministersThisMonth ?? 0, 'ministers');
    breakdownItems = [
      { label: 'Active', count: stats.activeMinisters, status: 'success' },
      { label: 'Inactive', count: stats.inactiveMinisters, status: 'warning' },
    ];
  } else if (stats && metric === 'ministries') {
    liveCount = stats.ministryCount.toLocaleString();
    liveTrend = `${stats.ministryCount} total`;
    breakdownItems = [
      { label: 'With leader', count: stats.ministriesWithLeader, status: 'success' },
      { label: 'Unassigned', count: stats.ministriesWithoutLeader, status: 'warning' },
    ];
  } else if (!stats) {
    liveCount = settings.count || '…';
    liveTrend = 'Loading…';
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
