'use client';
import React from 'react';
import {
  Home,
  Users,
  Briefcase,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  BookOpen,
  Church,
  ListTodo,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getAvatarUrl } from '@/lib/media-url';
import { hasPermission } from '@/types';
import { TENANT } from '@/lib/tenant';
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
  permission?: string;
  badge?: string;
  badgeColor?: string;
}

interface SidebarDropdownItem {
  label: string;
  icon: React.ReactNode;
  type: 'dropdown';
  permission?: string;
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
    { label: 'Home', icon: <Home size={18} />, path: '/dashboard', type: 'link', permission: 'dashboard.read' },
    {
      label: 'Members',
      icon: <Users size={18} />,
      type: 'dropdown',
      permission: 'members.read',
      subItems: [
        { label: 'Manage Members', path: '/members/manage' },
        { label: 'Home Groups', path: '/members/home-groups' }
      ]
    },
    {
      label: 'Ministers',
      icon: <Church size={18} />,
      path: '/ministers/manage',
      type: 'link',
      permission: 'ministers.read',
    },
    {
      label: 'Ministries',
      icon: <Briefcase size={18} />,
      path: '/ministries/manage',
      type: 'link',
      permission: 'ministries.read',
    },
    { label: 'Bible Study', icon: <BookOpen size={18} />, path: '/bible-study', type: 'link', permission: 'bible_studies.read' },
    { label: 'Task Management', icon: <ListTodo size={18} />, path: '/tasks', type: 'link', permission: 'tasks.read' },
    { label: 'Family Management', icon: <UsersRound size={18} />, path: '/families', type: 'link', permission: 'families.read' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings', permission: 'settings.read' },
    { label: 'Help Center', icon: <HelpCircle size={18} />, path: '/help', permission: 'dashboard.read' },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );

  const visibleBottomItems = bottomItems.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );

  return (
    <div className="sidebar-container">
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
            <p className="sidebar-tenant-name">{TENANT.shortName}</p>
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

      <nav className="sidebar-nav">
        {visibleMenuItems.map((item, index) => (
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
                    <span className="nav-icon">{ item.icon }</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <div className="nav-right">
                    {item.badge && (
                      <span className={`nav-badge ${item.badgeColor || 'gray'}`}>{item.badge}</span>
                    )}
                    <ChevronDown size={14} className={`nav-arrow ${expanded[index] ? 'rotated' : ''}`} />
                  </div>
                </div>

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
        {visibleBottomItems.map((item) => (
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
