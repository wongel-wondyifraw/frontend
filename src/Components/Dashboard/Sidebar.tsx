'use client';
import React from 'react';
import {
  Home,
  Users,
  Briefcase,
  Settings,
  HelpCircle,
  ChevronDown,
  Calendar,
  LogOut,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getAvatarUrl } from '@/lib/media-url';
import './Sidebar.css';

interface SidebarSubItem {
  label: string;
  path: string;
}

interface SidebarLinkItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  type: 'link';
  badge?: string;
  badgeColor?: string;
}

interface SidebarDropdownItem {
  label: string;
  icon: React.ReactNode;
  type: 'dropdown';
  subItems: SidebarSubItem[];
  badge?: string;
  badgeColor?: string;
}

type SidebarMenuItem = SidebarLinkItem | SidebarDropdownItem;

const Sidebar = () => {
  const { user, logout, avatarVersion } = useUser();
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

  const toggleMenu = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLogout = () => {
    logout();
  };

  const menuItems: SidebarMenuItem[] = [
    { label: 'Home', icon: <Home size={18} />, path: '/dashboard', type: 'link' },
    {
      label: 'Members',
      icon: <Users size={18} />,
      type: 'dropdown',
      subItems: [
        { label: 'Manage Members', path: '/members/manage' },
        { label: 'Home Groups', path: '/members/home-groups' }
      ]
    },
    {
      label: 'Ministries',
      icon: <Briefcase size={18} />,
      type: 'dropdown',
      subItems: [
        { label: 'Manage Ministries', path: '/ministries/manage' }
      ]
    },
    { label: 'Bible Study', icon: <BookOpen size={18} />, path: '/bible-study', type: 'link' },
    { label: 'Schedule Management', icon: <Calendar size={18} />, path: '/schedule', type: 'link' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
    { label: 'Help Center', icon: <HelpCircle size={18} />, path: '/help' },
  ]

  return (
    <div className="sidebar-container">
      {/* Header Profile */}
      <div className="sidebar-header">
        <div className="sidebar-profile">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={getAvatarUrl(user?.avatar_url, avatarVersion)}
            className="sidebar-profile-img"
            style={{
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--primary-blue)',
              border: '3px solid var(--border-color)'
            }}
          />
          <div className="sidebar-profile-info">
            <h3 className="profile-name">
              {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Loading...'}
            </h3>
            {user && (
              <div className="profile-role-pill">
                {user.role}
              </div>
            )}
            {user?.title && (
              <div className="profile-title-pill">
                {user.title}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div key={item.label} className="nav-group">
            {item.type === 'link' ? (
              <Link
                href={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <div className="nav-left">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </div>
              </Link>
            ) : (
              // Dropdown Parent
              <>
                <div
                  className={`nav-item dropdown-parent ${expanded[index] ? 'expanded' : ''}`}
                  onClick={() => toggleMenu(index)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(index); }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded[index] ? 'true' : 'false'}
                >
                  <div className="nav-left">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <div className="nav-right">
                    {item.badge && (
                      <span className={`nav-badge ${item.badgeColor || 'gray'}`}>{item.badge}</span>
                    )}
                    <ChevronDown size={14} className={`nav-arrow ${expanded[index] ? 'rotated' : ''}`} />
                  </div>
                </div>

                {/* Submenu */}
                {expanded[index] && (
                  <div className="submenu-container">
                    {item.subItems?.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className={`submenu-item ${isActive(sub.path) ? 'active' : ''}`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer-links">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="nav-item footer-item"
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}

        <button
          aria-label="Log out of your account"
          className="nav-item footer-item danger-item"
          onClick={handleLogout}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex' }}
        >
          <span className="nav-icon"><LogOut size={18} /></span>
          <span className="nav-label">Log Out</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
