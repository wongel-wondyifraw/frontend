import React, { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { DashboardProvider } from '../../context/DashboardContext';
import { useUser } from '../../context/UserContext';
import DashboardGrid from '../../Components/Dashboard/DashboardGrid';
import './Dashboard.css';

const DashboardContent = () => {
  const { user } = useUser();
  const [api, contextHolder] = notification.useNotification();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Only show if user is loaded, hasn't been shown in this component mount, AND hasn't been shown in this session
    if (user && !hasShownToast.current && !sessionStorage.getItem('welcomeToastShown')) {
      api.open({
        message: `Welcome Back, ${user.first_name || 'User'}!`,
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
      <DashboardGrid />
    </>
  );
};

const Dashboard = () => {
  return (
    <DashboardProvider>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </DashboardProvider>
  );
};

export default Dashboard;
