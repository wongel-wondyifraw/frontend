'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import { useDashboardStats } from '@/context/DashboardStatsContext';
import './MemberOverviewWidget.css';

const COLORS = ['#3B82F6', '#DBEAFE'];

const MemberOverviewWidget = () => {
  const stats = useDashboardStats();
  const active = stats?.activeMembers ?? 0;
  const inactive = stats?.inactiveMembers ?? 0;
  const total = stats?.memberCount ?? 0;
  const thisMonth = stats?.membersThisMonth ?? 0;
  const data = [
    { name: 'Active', value: active },
    { name: 'Inactive', value: inactive },
  ].filter((d) => d.value > 0);

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
          <span className="stat-value">{total.toLocaleString()}</span>
          <div className="stat-trend positive">
            <UserAddOutlined />
            <span>+{thisMonth} this month</span>
          </div>
        </div>

        <div className="member-chart-wrapper">
          {data.length > 0 ? (
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
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-legend">No data</div>
          )}
          <div className="chart-legend">
            <span className="legend-item">
              <span className="dot active" />
              Active {active}
            </span>
            <span className="legend-item">
              <span className="dot inactive" />
              Inactive {inactive}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberOverviewWidget;
