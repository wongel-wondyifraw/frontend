'use client';

import { Bell, CheckCircle, AlertCircle, Moon, Sun } from 'lucide-react';
import { Button, Popover, Avatar, Badge, Empty, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useUser } from '@/context/UserContext';
import { hasPermission } from '@/types';
import AppLogo from '../common/AppLogo';

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function TopbarActions() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const canReadNotifications = hasPermission(user, 'notifications.read');
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={() => markAllRead()}>
            Mark all read
          </Button>
        )}
      </div>
      {loading && items.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
      ) : items.length === 0 ? (
        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 16 }} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 360, overflowY: 'auto' }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
                opacity: item.read_at ? 0.65 : 1,
                cursor: item.href ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (!item.read_at) markRead(item.id);
                if (item.href) router.push(item.href);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && item.href) router.push(item.href);
              }}
              role={item.href ? 'button' : undefined}
              tabIndex={item.href ? 0 : undefined}
            >
              <Avatar
                style={{
                  backgroundColor: item.severity === 'success' || item.severity === 'warning'
                    ? '#f6ffed'
                    : '#e6f7ff',
                  flexShrink: 0,
                }}
                icon={
                  item.severity === 'success' || item.severity === 'warning'
                    ? <CheckCircle size={16} color="#52c41a" />
                    : <AlertCircle size={16} color="#1890ff" />
                }
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {item.message}
                  <br />
                  <span style={{ color: '#aaa', fontSize: '10px' }}>
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="icon-btn theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {canReadNotifications && (
        <Popover content={notificationContent} trigger="click" placement="bottomRight" arrow={false}>
          <button type="button" className="icon-btn notification-btn" aria-label="Notifications">
            <Badge count={unreadCount} size="small" offset={[-4, 4]}>
              <Bell size={20} />
            </Badge>
          </button>
        </Popover>
      )}

      <div className="logo-wrapper">
        <AppLogo variant="topbar" href="/dashboard" />
      </div>
    </>
  );
}
