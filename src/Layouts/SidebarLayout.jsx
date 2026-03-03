import React from 'react';
import Sidebar from '../Components/Dashboard/Sidebar';
import './SidebarLayout.css';

const SidebarLayout = ({ children }) => {
    return (
        <div className="sidebar-layout">
            <Sidebar />
            <div className="main-content">
                <div className="content-scrollable">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SidebarLayout;
