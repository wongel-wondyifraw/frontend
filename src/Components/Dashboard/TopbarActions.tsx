'use client';

import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button, Popover, Badge, Empty, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationsContext';
import { useUser } from '@/context/UserContext';
import { hasPermission } from '@/types';
import AppLogo from '../common/AppLogo';
import './NotificationPanel.css';

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

function severityIcon(severity: string) {
  if (severity === 'success') return <CheckCircle size={18} strokeWidth={2} />;
  if (severity === 'warning') return <AlertTriangle size={18} strokeWidth={2} />;
  if (severity === 'error') return <AlertCircle size={18} strokeWidth={2} />;
  return <Info size={18} strokeWidth={2} />;
}

function severityClass(severity: string) {
  if (severity === 'success') return 'notif-item-icon--success';
  if (severity === 'warning') return 'notif-item-icon--warning';
  if (severity === 'error') return 'notif-item-icon--error';
  return 'notif-item-icon--info';
}

export default function TopbarActions() {
  const { user } = useUser();
  const router = useRouter();
  const canReadNotifications = hasPermission(user, 'notifications.read');
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();

  const notificationContent = (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <div className="notif-panel-heading">
          <h3 className="notif-panel-title">Notifications</h3>
          <p className="notif-panel-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : 'Recent activity across your church'}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button type="link" size="small" className="notif-panel-mark-all" onClick={() => markAllRead()}>
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="notif-panel-body">
        {loading && items.length === 0 ? (
          <div className="notif-panel-loading">
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <div className="notif-panel-empty">
            <Empty description="No notifications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <ul className="notif-list">
            {items.map((item) => {
              const unread = !item.read_at;
              const clickable = Boolean(item.href);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notif-item${unread ? ' notif-item--unread' : ''}${
                      clickable ? ' notif-item--clickable' : ''
                    }`}
                    onClick={() => {
                      if (unread) void markRead(item.id);
                      if (item.href) router.push(item.href);
                    }}
                  >
                    <span className={`notif-item-icon ${severityClass(item.severity)}`}>
                      {severityIcon(item.severity)}
                    </span>
                    <div className="notif-item-main">
                      <div className="notif-item-top">
                        <h4 className="notif-item-title">{item.title}</h4>
                        <span className="notif-item-time">{formatTimeAgo(item.created_at)}</span>
                      </div>
                      <p className="notif-item-message">{item.message}</p>
                    </div>
                    {unread ? <span className="notif-item-dot" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 ? (
        <div className="notif-panel-footer">
          <p className="notif-panel-footer-hint">
            {items.length} notification{items.length === 1 ? '' : 's'}
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {canReadNotifications && (
        <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
          arrow={false}
          overlayClassName="notif-popover"
        >
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
