'use client';
import React, { useEffect, useRef } from 'react';
import { App } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { DashboardStatsProvider } from '../../context/DashboardStatsContext';
import { useUser } from '../../context/UserContext';
import AnalysisDashboard from '../../Components/Dashboard/AnalysisDashboard/AnalysisDashboard';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import type { DashboardProps } from '@/types';
import './Dashboard.css';

const DashboardContent = () => {
  const { user } = useUser();
  const { notification } = App.useApp();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (user && !hasShownToast.current && !sessionStorage.getItem('welcomeToastShown')) {
      notification.open({
        title: `Welcome Back, ${user.first_name || 'User'}!`,
        description: "Here's what's happening in your ministry today.",
        icon: <SmileOutlined style={{ color: '#1E40AF' }} />,
        placement: 'topRight',
        className: 'welcome-toast',
        duration: 4.5,
      });

      sessionStorage.setItem('welcomeToastShown', 'true');
      hasShownToast.current = true;
    }
  }, [notification, user]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h2>Dashboard</h2>
          <p>
            {user?.first_name
              ? `Welcome back, ${user.first_name}. Here's what's happening in your ministry.`
              : "Overview of members, ministries, and recent activity."}
          </p>
        </div>
      </div>
      <div className="dashboard-stage">
        <AnalysisDashboard />
      </div>
    </div>
  );
};

const Dashboard = ({ initialStats = null }: DashboardProps) => {
  return (
    <PermissionGate permission="dashboard.read" pageLabel="Dashboard">
      <DashboardStatsProvider initialStats={initialStats}>
        <DashboardContent />
      </DashboardStatsProvider>
    </PermissionGate>
  );
};

export default Dashboard;
