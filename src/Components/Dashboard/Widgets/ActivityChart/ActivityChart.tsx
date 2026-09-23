'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { useDashboardStats } from '@/context/DashboardStatsContext';
import './ActivityChart.css';

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{payload[0].value} registrations</p>
        <p className="tooltip-month">{label}</p>
      </div>
    );
  }
  return null;
};

const ActivityChart = () => {
  const stats = useDashboardStats();
  const data = useMemo(
    () =>
      (stats?.registrationsByMonth || []).map((row) => ({
        name: row.month.toUpperCase(),
        registrations: row.value,
      })),
    [stats?.registrationsByMonth],
  );

  return (
    <div className="activity-chart-container">
      <div className="chart-header">
        <h3>Member registrations</h3>
        <button type="button" className="chart-filter-btn">
          <Calendar size={14} />
          This year
        </button>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#667085', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#667085', fontSize: 12 }}
            />
            <CartesianGrid vertical={false} stroke="#EAECF0" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="registrations"
              stroke="#1E40AF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRegistrations)"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
