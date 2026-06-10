'use client';

import { Bell, CheckCircle, AlertCircle, Moon, Sun } from 'lucide-react';
import { Button, Popover, List, Avatar, Badge } from 'antd';
import { useTheme } from '@/context/ThemeContext';
import AppLogo from '../common/AppLogo';

const notifications = [
  { id: 1, title: 'New Member Added', desc: 'Sarah Jenkins joined the worship team.', time: '2 mins ago', type: 'success' },
  { id: 2, title: 'Meeting Reminder', desc: 'Elders meeting starts in 1 hour.', time: '1 hour ago', type: 'info' },
  { id: 3, title: 'Donation Received', desc: 'Anonymous donation of $500.', time: '3 hours ago', type: 'success' },
  { id: 4, title: 'System Alert', desc: 'Backup scheduled for tonight.', time: '5 hours ago', type: 'warning' },
];

export default function TopbarActions() {
  const { theme, toggleTheme } = useTheme();

  const notificationContent = (
    <div style={{ width: 300 }}>
      <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>Notifications</div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={(
                <Avatar
                  style={{ backgroundColor: item.type === 'success' ? '#f6ffed' : '#e6f7ff' }}
                  icon={item.type === 'success'
                    ? <CheckCircle size={16} color="#52c41a" />
                    : <AlertCircle size={16} color="#1890ff" />}
                />
              )}
              title={<span style={{ fontSize: '14px' }}>{item.title}</span>}
              description={(
                <div style={{ fontSize: '12px' }}>
                  {item.desc}
                  <br />
                  <span style={{ color: '#aaa', fontSize: '10px' }}>{item.time}</span>
                </div>
              )}
            />
          </List.Item>
        )}
      />
      <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Button type="link" size="small">View All</Button>
      </div>
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

      <Popover content={notificationContent} trigger="click" placement="bottomRight" arrow={false}>
        <button type="button" className="icon-btn notification-btn" aria-label="Notifications">
          <Badge dot offset={[-4, 4]}>
            <Bell size={20} />
          </Badge>
        </button>
      </Popover>

      <div className="logo-wrapper">
        <AppLogo variant="topbar" href="/dashboard" />
      </div>
    </>
  );
}
