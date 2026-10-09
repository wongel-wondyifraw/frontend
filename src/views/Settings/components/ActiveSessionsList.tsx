'use client';
import React, { useEffect, useState } from 'react';
import { Button, Tag, Typography, message, Modal } from 'antd';
import { DesktopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getSessions, logoutAllSessions } from '@/services/api';
import dayjs from 'dayjs';

const { Text } = Typography;
const { confirm } = Modal;

interface Session {
  id: string;
  device_info?: string;
  ip_address?: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

const ActiveSessionsList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch {
      message.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeAll = () => {
    confirm({
      title: 'Revoke all sessions?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will sign you out of all other devices. You will remain signed in on this device.',
      okText: 'Revoke All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setRevoking(true);
          await logoutAllSessions();
          message.success('All other sessions have been revoked.');
          loadSessions();
        } catch {
          message.error('Failed to revoke sessions');
        } finally {
          setRevoking(false);
        }
      },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DesktopOutlined style={{ fontSize: 20, color: "var(--text-secondary)" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>Active Sessions</span>
        </div>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        These are the devices that have logged into your account.
      </Text>
      <div style={{ marginBottom: 24 }}>
        <Button danger onClick={handleRevokeAll} loading={revoking} disabled={sessions.length <= 1}>
          Revoke All Other Sessions
        </Button>
      </div>

      <div className="sessions-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <Text type="secondary">Loading sessions...</Text>
        ) : sessions.length === 0 ? (
          <Text type="secondary">No active sessions found.</Text>
        ) : (
          sessions.map((session, index) => (
            <div 
              key={session.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '16px 0', 
                borderBottom: '1px solid var(--border-color, #f0f0f0)' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <DesktopOutlined style={{ fontSize: 24, color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {session.device_info || 'Unknown Device'}
                    {session.ip_address && <Text type="secondary" style={{ marginLeft: 8 }}>({session.ip_address})</Text>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Started {dayjs(session.created_at).format('MMM D, YYYY h:mm A')}
                  </Text>
                </div>
              </div>
              <div>
                {session.is_expired ? (
                  <Tag color="default">Expired</Tag>
                ) : index === 0 ? (
                  <Tag color="green">Current Session</Tag>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveSessionsList;
