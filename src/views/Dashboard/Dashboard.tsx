'use client';
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { App, Tabs, Badge } from 'antd';
import { SmileOutlined, BarChartOutlined, HeartOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardStatsProvider } from '../../context/DashboardStatsContext';
import { useUser } from '../../context/UserContext';
import AnalysisDashboard from '../../Components/Dashboard/AnalysisDashboard/AnalysisDashboard';
import PrayerRequestsTab from '../../Components/Dashboard/PrayerRequests/PrayerRequestsTab';
import { getContactRequests } from '@/services/api';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import type { DashboardProps } from '@/types';
import './Dashboard.css';

const DashboardContentInner = () => {
  const { user } = useUser();
  const { notification } = App.useApp();
  const hasShownToast = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get('tab') === 'requests' ? 'requests' : 'overview';
  const [activeTab, setActiveTab] = useState(currentTab);
  const [newRequestsCount, setNewRequestsCount] = useState<number>(0);

  // Synchronize tab when search parameter changes (e.g. browser navigation or external link)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requests') {
      setActiveTab('requests');
    } else if (!tab || tab === 'overview') {
      setActiveTab('overview');
    }
  }, [searchParams]);

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

  // Automatic retrieval of unread contact requests count for the tab badge
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const data = await getContactRequests();
        if (isMounted) {
          const count = data.filter((item) => item.status === 'new').length;
          setNewRequestsCount(count);
        }
      } catch {
        // Silent background retrieval
      }
    };

    fetchUnread();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnread();
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (typeof window !== 'undefined') {
      const url = key === 'requests' ? '/dashboard?tab=requests' : '/dashboard';
      window.history.replaceState(null, '', url);
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span className="dashboard-tab-label">
          <BarChartOutlined style={{ fontSize: 16 }} />
          <span>Overview</span>
        </span>
      ),
      children: (
        <div id="dashboard-overview-stage" className="dashboard-stage">
          <AnalysisDashboard />
        </div>
      ),
    },
    {
      key: 'requests',
      label: (
        <span className="dashboard-tab-label">
          <HeartOutlined style={{ fontSize: 16 }} />
          <span>Prayer & Messages</span>
          {newRequestsCount > 0 ? (
            <Badge count={newRequestsCount} size="small" style={{ backgroundColor: '#EF4444' }} />
          ) : null}
        </span>
      ),
      children: (
        <div id="dashboard-requests-stage" className="dashboard-stage">
          <PrayerRequestsTab onCountChange={setNewRequestsCount} />
        </div>
      ),
    },
  ];

  return (
    <div id="dashboard-main-page" className="dashboard-page">
      <div id="dashboard-header-container" className="dashboard-header">
        <div className="dashboard-header-text">
          <h2>Dashboard</h2>
          <p>
            {user?.first_name
              ? `Welcome back, ${user.first_name}. Here's what's happening in your ministry.`
              : "Overview of members, ministries, and recent activity."}
          </p>
        </div>
      </div>

      <Tabs
        id="dashboard-navigation-tabs"
        className="dashboard-tabs"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
      />
    </div>
  );
};

const DashboardContent = () => {
  return (
    <Suspense fallback={<div className="dashboard-page"><div className="dashboard-stage" /></div>}>
      <DashboardContentInner />
    </Suspense>
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
