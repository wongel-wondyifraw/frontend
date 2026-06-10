'use client';
import React, { type ReactNode } from 'react';
import Sidebar from '../Components/Dashboard/Sidebar';
import './SidebarLayout.css';

const SidebarLayout = ({ children }: { children: ReactNode }) => {
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
