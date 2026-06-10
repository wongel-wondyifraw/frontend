'use client';
// Navbar.jsx
import React from "react";
import Image from "next/image";
import { Layout, Menu, Button, Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import "./Navbar.css";

const { Header } = Layout;

const servicesItems = [
  { key: "1", label: "Counseling" },
  { key: "2", label: "Community Service" },
];

const offeringsItems = [
  { key: "1", label: "Donations" },
  { key: "2", label: "Tithes" },
];

const Navbar = () => {
  return (
    <Header className="navbar">
      <Space className="navbar-inner" align="center">
        {/* Logo */}
        <Image
          src="/Logo.svg"
          alt="Shepherd.One"
          width={140}
          height={36}
          className="logo-icon"
          priority
          unoptimized
        />



        {/* Menu */}
        <Menu
          mode="horizontal"
          selectable={false}
          className="navbar-menu"
          items={[
            { key: "home", label: "Home" },
            { key: "branches", label: "Branches" },
            { key: "about", label: "About" },
            {
              key: "services",
              label: (
                <Dropdown menu={{ items: servicesItems }}>
                  <Space>
                    Services <DownOutlined />
                  </Space>
                </Dropdown>
              ),
            },
            { key: "programs", label: "Programs" },
            {
              key: "offerings",
              label: (
                <Dropdown menu={{ items: offeringsItems }}>
                  <Space>
                    Offerings <DownOutlined />
                  </Space>
                </Dropdown>
              ),
            },
          ]}
        />

        {/* Action */}
        <Button type="primary" className="navbar-btn" href="/subscription">
          Register
        </Button>
      </Space>
    </Header>
  );
};

export default Navbar;
