'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  ListTodo,
  CalendarDays,
  Ellipsis,
  House,
  UsersRound,
  Church,
  Briefcase,
  BookOpen,
  Globe,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { hasPermission } from '@/types';
import './BottomNav.css';

type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  anyOf?: string[];
  match?: (path: string) => boolean;
};

const PRIMARY: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/dashboard',
    icon: <Home size={22} strokeWidth={2} />,
    permission: 'dashboard.read',
    match: (p) => p === '/dashboard',
  },
  {
    id: 'members',
    label: 'Members',
    path: '/members/manage',
    icon: <Users size={22} strokeWidth={2} />,
    permission: 'members.read',
    match: (p) => p.startsWith('/members') && !p.startsWith('/members/home-groups'),
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/tasks',
    icon: <ListTodo size={22} strokeWidth={2} />,
    permission: 'tasks.read',
    match: (p) => p.startsWith('/tasks'),
  },
  {
    id: 'planning',
    label: 'Plans',
    path: '/planning',
    icon: <CalendarDays size={22} strokeWidth={2} />,
    permission: 'plans.read',
    match: (p) => p.startsWith('/planning'),
  },
];

const MORE_ITEMS: NavItem[] = [
  {
    id: 'home-groups',
    label: 'Home Groups',
    path: '/members/home-groups',
    icon: <House size={20} />,
    permission: 'home_groups.read',
  },
  {
    id: 'families',
    label: 'Families',
    path: '/families',
    icon: <UsersRound size={20} />,
    permission: 'families.read',
  },
  {
    id: 'ministers',
    label: 'Ministers',
    path: '/ministers/manage',
    icon: <Church size={20} />,
    permission: 'ministers.read',
  },
  {
    id: 'ministries',
    label: 'Ministries',
    path: '/ministries/manage',
    icon: <Briefcase size={20} />,
    permission: 'ministries.read',
  },
  {
    id: 'bible-study',
    label: 'Bible Study',
    path: '/bible-study',
    icon: <BookOpen size={20} />,
    permission: 'bible_studies.read',
  },
  {
    id: 'landing',
    label: 'Landing',
    path: '/landing',
    icon: <Globe size={20} />,
    anyOf: ['website.manage', 'projects.manage'],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: <Settings size={20} />,
    permission: 'settings.read',
  },
  {
    id: 'help',
    label: 'Help',
    path: '/help',
    icon: <HelpCircle size={20} />,
    permission: 'dashboard.read',
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);

  const can = (permission?: string) => !permission || hasPermission(user, permission);
  const canItem = (item: NavItem) =>
    item.anyOf?.length ? item.anyOf.some((p) => can(p)) : can(item.permission);

  const primary = useMemo(() => PRIMARY.filter((item) => canItem(item)), [user]);
  const moreItems = useMemo(() => MORE_ITEMS.filter((item) => canItem(item)), [user]);

  const isPrimaryActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.path || pathname.startsWith(item.path);

  const moreActive = moreItems.some(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/'),
  );

  return (
    <>
      <nav className="bottom-nav" aria-label="Primary mobile">
        {primary.map((item) => {
          const active = isPrimaryActive(item);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`bottom-nav-item${active ? ' is-active' : ''}`}
              onClick={() => setMoreOpen(false)}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`bottom-nav-item${moreOpen || moreActive ? ' is-active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="More navigation"
        >
          <span className="bottom-nav-icon">
            <Ellipsis size={22} strokeWidth={2} />
          </span>
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="bottom-nav-sheet-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="bottom-nav-sheet" role="dialog" aria-label="More">
            <div className="bottom-nav-sheet-head">
              <h3>More</h3>
              <button
                type="button"
                className="bottom-nav-sheet-close"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="bottom-nav-sheet-list">
              {moreItems.map((item) => {
                const active = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`bottom-nav-sheet-item${active ? ' is-active' : ''}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <span className="bottom-nav-sheet-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                className="bottom-nav-sheet-item is-danger"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
              >
                <span className="bottom-nav-sheet-icon">
                  <LogOut size={20} />
                </span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
