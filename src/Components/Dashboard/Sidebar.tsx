'use client';
import React, { useEffect, useMemo, useState } from 'react';
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
  House,
  CalendarDays,
  Globe,
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
  permission?: string;
}

interface SidebarLinkItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  type: 'link';
  permission?: string;
  /** If set, user needs any one of these permissions */
  anyOf?: string[];
}

interface SidebarDropdownItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'dropdown';
  permission?: string;
  subItems: SidebarSubItem[];
}

type SidebarMenuItem = SidebarLinkItem | SidebarDropdownItem;

interface NavSection {
  id: string;
  title: string;
  items: SidebarMenuItem[];
}

const Sidebar = () => {
  const { user, logout, avatarVersion } = useUser();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

  const sections: NavSection[] = useMemo(
    () => [
      {
        id: 'overview',
        title: 'Overview',
        items: [
          {
            id: 'home',
            label: 'Home',
            icon: <Home size={18} />,
            path: '/dashboard',
            type: 'link',
            permission: 'dashboard.read',
          },
        ],
      },
      {
        id: 'people',
        title: 'People',
        items: [
          {
            id: 'members',
            label: 'Members',
            icon: <Users size={18} />,
            path: '/members/manage',
            type: 'link',
            permission: 'members.read',
          },
          {
            id: 'home-groups',
            label: 'Home Groups',
            icon: <House size={18} />,
            path: '/members/home-groups',
            type: 'link',
            permission: 'home_groups.read',
          },
          {
            id: 'families',
            label: 'Families',
            icon: <UsersRound size={18} />,
            path: '/families',
            type: 'link',
            permission: 'families.read',
          },
        ],
      },
      {
        id: 'church',
        title: 'Church life',
        items: [
          {
            id: 'ministers',
            label: 'Ministers',
            icon: <Church size={18} />,
            path: '/ministers/manage',
            type: 'link',
            permission: 'ministers.read',
          },
          {
            id: 'ministries',
            label: 'Ministries',
            icon: <Briefcase size={18} />,
            path: '/ministries/manage',
            type: 'link',
            permission: 'ministries.read',
          },
          {
            id: 'bible-study',
            label: 'Bible Study',
            icon: <BookOpen size={18} />,
            path: '/bible-study',
            type: 'link',
            permission: 'bible_studies.read',
          },
        ],
      },
        {
        id: 'work',
        title: 'Work',
        items: [
          {
            id: 'tasks',
            label: 'Tasks',
            icon: <ListTodo size={18} />,
            path: '/tasks',
            type: 'link',
            permission: 'tasks.read',
          },
          {
            id: 'planning',
            label: 'Planning',
            icon: <CalendarDays size={18} />,
            path: '/planning',
            type: 'link',
            permission: 'plans.read',
          },
          {
            id: 'landing',
            label: 'Landing Page',
            icon: <Globe size={18} />,
            path: '/landing',
            type: 'link',
            anyOf: ['website.manage', 'projects.manage'],
          },
        ],
      },
    ],
    [],
  );

  const bottomItems = [
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings', permission: 'settings.read' },
    { label: 'Help Center', icon: <HelpCircle size={18} />, path: '/help', permission: 'dashboard.read' },
  ];

  const can = (permission?: string) => !permission || hasPermission(user, permission);

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (item.type === 'dropdown') {
            const subItems = item.subItems.filter((sub) => can(sub.permission ?? item.permission));
            if (subItems.length === 0) return null;
            return { ...item, subItems };
          }
          if (item.type === 'link' && item.anyOf?.length) {
            return item.anyOf.some((p) => can(p)) ? item : null;
          }
          return can(item.permission) ? item : null;
        })
        .filter((item): item is SidebarMenuItem => item !== null),
    }))
    .filter((section) => section.items.length > 0);

  const visibleBottomItems = bottomItems.filter((item) => can(item.permission));

  // Auto-expand dropdowns whose child route is active
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const section of sections) {
      for (const item of section.items) {
        if (item.type === 'dropdown') {
          const childActive = item.subItems.some((sub) => isActive(sub.path));
          if (childActive) next[item.id] = true;
        }
      }
    }
    setExpanded((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when path changes
  }, [pathname]);

  const toggleMenu = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
  };

  const renderItem = (item: SidebarMenuItem) => {
    if (item.type === 'link') {
      return (
        <Link
          key={item.id}
          href={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <div className="nav-left">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        </Link>
      );
    }

    const isOpen = Boolean(expanded[item.id]);
    const parentActive = item.subItems.some((sub) => isActive(sub.path));

    return (
      <div key={item.id} className="nav-group">
        <div
          className={`nav-item dropdown-parent ${isOpen ? 'expanded' : ''} ${parentActive ? 'has-active-child' : ''}`}
          onClick={() => toggleMenu(item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMenu(item.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
        >
          <div className="nav-left">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
          <div className="nav-right">
            <ChevronDown size={14} className={`nav-arrow ${isOpen ? 'rotated' : ''}`} />
          </div>
        </div>

        {isOpen && (
          <div className="submenu-container">
            {item.subItems.map((sub) => (
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
      </div>
    );
  };

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
              border: '3px solid var(--border-color)',
            }}
          />
          <div className="sidebar-profile-info">
            <p className="sidebar-tenant-name">{TENANT.shortName}</p>
            <h3 className="profile-name">
              {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Loading...'}
            </h3>
            {user && <div className="profile-role-pill">{user.role}</div>}
            {user?.title && <div className="profile-title-pill">{user.title}</div>}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleSections.map((section) => (
          <div key={section.id} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            <div className="nav-section-items">
              {section.items.map((item) =>
                item.type === 'link' ? (
                  <div key={item.id} className="nav-group">
                    {renderItem(item)}
                  </div>
                ) : (
                  renderItem(item)
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer-links">
        <div className="nav-section-title">System</div>
        {visibleBottomItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item footer-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}

        <button
          type="button"
          aria-label="Log out of your account"
          className="nav-item footer-item danger-item"
          onClick={handleLogout}
        >
          <span className="nav-icon">
            <LogOut size={18} />
          </span>
          <span className="nav-label">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
