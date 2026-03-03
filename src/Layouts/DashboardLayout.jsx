import React from 'react';
import Sidebar from '../Components/Dashboard/Sidebar';
import Topbar from '../Components/Dashboard/Topbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="content-scrollable">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
