'use client';
import React, { useEffect, useState } from 'react';
import { Switch, Spin } from 'antd';
import { message } from '@/lib/app-message';
import { getNotificationPreferences, updateNotificationPreferences } from '@/services/api';
import { getApiErrorMessage } from '@/lib/errors';

const KIND_LABELS: Record<string, { title: string; description: string }> = {
  member: {
    title: 'Member updates',
    description: 'New members, approvals, and profile changes',
  },
  ministry: {
    title: 'Ministry updates',
    description: 'Ministry membership and activity changes',
  },
  home_group: {
    title: 'Home group updates',
    description: 'Home group assignments and visits',
  },
  system: {
    title: 'System announcements',
    description: 'Platform notices and maintenance alerts',
  },
  user: {
    title: 'User account changes',
    description: 'Account, role, and access updates',
  },
};

const NotificationPreferencesTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [kinds, setKinds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prefs = await getNotificationPreferences();
        if (cancelled) return;
        setEnabled(prefs.enabled);
        setKinds(prefs.kinds ?? {});
      } catch (error) {
        if (!cancelled) {
          message.error(getApiErrorMessage(error, 'Failed to load notification preferences'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (nextEnabled: boolean, nextKinds: Record<string, boolean>) => {
    setSaving(true);
    try {
      await updateNotificationPreferences({ enabled: nextEnabled, kinds: nextKinds });
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin style={{ display: 'block', margin: '24px auto' }} />;
  }

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Notification preferences</h3>
      <div className="settings-notification-list">
        <div className="settings-notification-item">
          <div>
            <h4>In-app notifications</h4>
            <p>Turn all in-app alerts on or off</p>
          </div>
          <Switch
            checked={enabled}
            loading={saving}
            onChange={(checked) => {
              setEnabled(checked);
              void save(checked, kinds);
            }}
          />
        </div>
        {Object.entries(KIND_LABELS).map(([key, meta]) => (
          <div key={key} className="settings-notification-item">
            <div>
              <h4>{meta.title}</h4>
              <p>{meta.description}</p>
            </div>
            <Switch
              checked={kinds[key] !== false}
              disabled={!enabled}
              loading={saving}
              onChange={(checked) => {
                const next = { ...kinds, [key]: checked };
                setKinds(next);
                void save(enabled, next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPreferencesTab;
