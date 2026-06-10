'use client';

import { UserOutlined, HomeOutlined, HeartOutlined } from '@ant-design/icons';
import StatCard from './StatCard';

interface WidgetSettings {
  icon?: string;
  title?: string;
  amount?: string | number;
  trend?: string;
  color?: string;
}

export default function StatCardWrapper({ settings }: { settings?: WidgetSettings }) {
  let icon = <UserOutlined style={{ fontSize: 28 }} />;
  switch (settings?.icon) {
    case 'church':
      icon = <HomeOutlined style={{ fontSize: 28 }} />;
      break;
    case 'volunteer':
      icon = <HeartOutlined style={{ fontSize: 28 }} />;
      break;
    default:
      break;
  }

  return (
    <StatCard
      title={settings?.title ?? ''}
      amount={settings?.amount ?? ''}
      trend={settings?.trend ?? ''}
      trendLabel="From last week"
      trendDirection={settings?.trend?.includes('-') ? 'down' : 'up'}
      color={settings?.color}
      icon={icon}
    />
  );
}
