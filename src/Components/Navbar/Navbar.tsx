'use client';
import React from "react";
import Image from "next/image";
import { Layout, Menu, Button } from "antd";
import type { MenuProps } from "antd";
import "./Navbar.css";

const { Header } = Layout;

const menuItems: MenuProps["items"] = [
  { key: "home", label: "Home" },
  { key: "branches", label: "Branches" },
  { key: "about", label: "About" },
  {
    key: "services",
    label: "Services",
    children: [
      { key: "counseling", label: "Counseling" },
      { key: "community-service", label: "Community Service" },
    ],
  },
  { key: "programs", label: "Programs" },
  {
    key: "offerings",
    label: "Offerings",
    children: [
      { key: "donations", label: "Donations" },
      { key: "tithes", label: "Tithes" },
    ],
  },
];

const Navbar = () => {
  return (
    <Header className="navbar">
      <div className="navbar-inner">
        <Image
          src="/Logo.svg"
          alt="Shepherd.One"
          width={140}
          height={36}
          className="logo-icon"
          priority
          unoptimized
        />

        <Menu
          mode="horizontal"
          selectable={false}
          className="navbar-menu"
          items={menuItems}
          disabledOverflow
        />

        <Button type="primary" className="navbar-btn" href="/subscription">
          Register
        </Button>
      </div>
    </Header>
  );
};

export default Navbar;
