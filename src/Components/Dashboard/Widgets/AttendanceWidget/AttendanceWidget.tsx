'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { CalendarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useDashboardStats } from '@/context/DashboardStatsContext';
import './AttendanceWidget.css';

/** Uses real weekly registration counts as an activity pulse (no attendance module yet). */
const AttendanceWidget = () => {
  const stats = useDashboardStats();
  const data = useMemo(() => {
    const spark = stats?.registrationSpark || [];
    return spark.slice(-7).map((value, i) => ({ name: `S${i + 1}`, value }));
  }, [stats?.registrationSpark]);
  const thisWeek = stats?.membersThisWeek ?? 0;
  const lastWeek = stats?.membersLastWeek ?? 0;
  const delta =
    lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const up = delta >= 0;

  return (
    <div className="attendance-widget">
      <div className="attendance-header">
        <h3>New members pulse</h3>
        <div className="attendance-icon-badge">
          <CalendarOutlined />
        </div>
      </div>

      <div className="attendance-content">
        <div className="attendance-main">
          <span className="attendance-label">This week</span>
          <span className="attendance-value">{thisWeek}</span>
          <div className={`attendance-trend ${up ? 'up' : 'down'}`}>
            {up ? <RiseOutlined /> : <FallOutlined />}
            <span>
              {Math.abs(delta)}% vs last week ({lastWeek})
            </span>
          </div>
        </div>

        <div className="attendance-mini-chart">
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={data.length ? data : [{ name: 'S1', value: 0 }]}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1E40AF"
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
