'use client';
import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { notification } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { DashboardStatsProvider } from '../../context/DashboardStatsContext';
import { DashboardProvider } from '../../context/DashboardContext';
import { useUser } from '../../context/UserContext';
import DashboardToolbar from '../../Components/Dashboard/DashboardToolbar';
import type { DashboardProps } from '@/types';
import './Dashboard.css';

const DashboardGrid = dynamic(
  () => import('../../Components/Dashboard/DashboardGrid'),
  {
    ssr: false,
    loading: () => (
      <div className="page-loading">
        <div className="page-loading-spinner" aria-label="Loading dashboard" />
      </div>
    ),
  },
);

const DashboardContent = () => {
  const { user } = useUser();
  const [api, contextHolder] = notification.useNotification();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (user && !hasShownToast.current && !sessionStorage.getItem('welcomeToastShown')) {
      api.open({
        title: `Welcome Back, ${user.first_name || 'User'}!`,
        description: "Here's what's happening in your ministry today.",
        icon: <SmileOutlined style={{ color: '#1565c0' }} />,
        placement: 'topRight',
        className: 'welcome-toast',
        duration: 4.5,
      });

      sessionStorage.setItem('welcomeToastShown', 'true');
      hasShownToast.current = true;
    }
  }, [api, user]);

  return (
    <>
      {contextHolder}
      <DashboardToolbar />
      <DashboardGrid />
    </>
  );
};

const Dashboard = ({ initialStats = null }: DashboardProps) => {
  return (
    <DashboardStatsProvider initialStats={initialStats}>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </DashboardStatsProvider>
  );
};

export default Dashboard;
