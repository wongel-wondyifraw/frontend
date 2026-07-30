'use client';
import React, { useEffect, useState } from 'react';
import { Switch, Typography, message, Spin } from 'antd';
import { getNotificationPreferences, updateNotificationPreferences } from '@/services/api';
import { getApiErrorMessage } from '@/lib/errors';

const KIND_LABELS: Record<string, string> = {
  member: 'Member updates',
  ministry: 'Ministry updates',
  home_group: 'Home group updates',
  system: 'System announcements',
  user: 'User account changes',
};

const NotificationPreferencesTab = () => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [kinds, setKinds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const prefs = await getNotificationPreferences();
        setEnabled(prefs.enabled);
        setKinds(prefs.kinds ?? {});
      } catch (error) {
        message.error(getApiErrorMessage(error, 'Failed to load notification preferences'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (nextEnabled: boolean, nextKinds: Record<string, boolean>) => {
    try {
      await updateNotificationPreferences({ enabled: nextEnabled, kinds: nextKinds });
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to save preferences'));
    }
  };

  if (loading) {
    return <Spin style={{ display: 'block', margin: '24px auto' }} />;
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <Typography.Title level={5}>Notification preferences</Typography.Title>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span>In-app notifications</span>
        <Switch
          checked={enabled}
          onChange={(checked) => {
            setEnabled(checked);
            save(checked, kinds);
          }}
        />
      </div>
      {Object.entries(KIND_LABELS).map(([key, label]) => (
        <div
          key={key}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
        >
          <span>{label}</span>
          <Switch
            checked={kinds[key] !== false}
            disabled={!enabled}
            onChange={(checked) => {
              const next = { ...kinds, [key]: checked };
              setKinds(next);
              save(enabled, next);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationPreferencesTab;
