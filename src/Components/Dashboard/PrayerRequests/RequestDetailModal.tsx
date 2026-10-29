'use client';

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Tag,
  Button,
  Input,
  Select,
  Typography,
  Divider,
  Space,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
  HeartOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { message } from '@/lib/app-message';
import type { ContactRequestItem, ContactRequestStatus } from '@/types';
import { updateContactRequest } from '@/services/api';
import './PrayerRequestsTab.css';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface RequestDetailModalProps {
  request: ContactRequestItem | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: ContactRequestItem) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  prayer: { label: 'Prayer Request', color: 'purple' },
  counseling: { label: 'Counseling', color: 'blue' },
  baptism: { label: 'Baptism', color: 'cyan' },
  cell: { label: 'Home / Cell Group', color: 'green' },
  chms: { label: 'Church System (ChMS)', color: 'orange' },
  general: { label: 'General Inquiry', color: 'default' },
};

const STATUS_CONFIG: Record<
  ContactRequestStatus,
  { label: string; color: string }
> = {
  new: { label: 'New / Unread', color: 'error' },
  read: { label: 'Read', color: 'processing' },
  in_progress: { label: 'In Progress', color: 'warning' },
  responded: { label: 'Responded / Done', color: 'success' },
  archived: { label: 'Archived', color: 'default' },
};

export default function RequestDetailModal({
  request,
  open,
  onClose,
  onUpdated,
}: RequestDetailModalProps) {
  const [status, setStatus] = useState<ContactRequestStatus>('new');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  useEffect(() => {
    if (request) {
      setStatus(request.status || 'new');
      setNotes(request.notes || '');
    }
  }, [request]);

  if (!request) return null;

  const categoryMeta = CATEGORY_CONFIG[request.category] || {
    label: request.category,
    color: 'default',
  };
  const statusMeta = STATUS_CONFIG[request.status] || {
    label: request.status,
    color: 'default',
  };

  const handleCopyPhone = () => {
    if (request.phone) {
      navigator.clipboard.writeText(request.phone);
      message.success('Phone number copied to clipboard');
    }
  };

  const handleSaveNotesAndStatus = async () => {
    try {
      setSaving(true);
      const updated = await updateContactRequest(request.id, {
        status,
        notes: notes.trim() || null,
        responded_at:
          status === 'responded' && !request.responded_at
            ? new Date().toISOString()
            : request.responded_at,
      });
      message.success('Request details updated successfully');
      onUpdated(updated);
    } catch {
      message.error('Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsDone = async () => {
    try {
      setMarkingDone(true);
      const updated = await updateContactRequest(request.id, {
        status: 'responded',
        notes: notes.trim() || request.notes || null,
        responded_at: new Date().toISOString(),
      });
      message.success('Marked as responded / done');
      setStatus('responded');
      onUpdated(updated);
    } catch {
      message.error('Failed to mark as done');
    } finally {
      setMarkingDone(false);
    }
  };

  const formattedDate = new Date(request.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={680}
      centered
      zIndex={2000}
      className="pr-detail-modal"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <HeartOutlined style={{ color: '#1E40AF', fontSize: 20 }} />
          <span style={{ fontSize: 17, fontWeight: 600 }}>
            {request.category === 'prayer' ? 'Prayer Request' : 'Message Details'}
          </span>
          <Tag color={categoryMeta.color}>{categoryMeta.label}</Tag>
          {request.is_confidential && (
            <Tag color="volcano" icon={<SafetyCertificateOutlined />}>
              Confidential (Senior Pastors)
            </Tag>
          )}
          <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
        </div>
      }
      footer={
        <div className="pr-modal-footer">
          <Button onClick={onClose} className="pr-modal-btn">
            Close
          </Button>
          <div className="pr-modal-footer-actions">
            {request.status !== 'responded' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={markingDone}
                style={{ background: '#10B981', borderColor: '#10B981' }}
                onClick={handleMarkAsDone}
                className="pr-modal-btn pr-modal-btn-done"
              >
                Mark as Done
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              style={{ background: '#1E40AF' }}
              onClick={handleSaveNotesAndStatus}
              className="pr-modal-btn pr-modal-btn-save"
            >
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {/* Requester Contact Info Box */}
        <div
          style={{
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Full Name
            </Text>
            <Text strong style={{ fontSize: 15 }}>
              {request.full_name}
            </Text>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Phone Number
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a
                href={`tel:${request.phone}`}
                style={{ fontWeight: 600, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <PhoneOutlined /> {request.phone}
              </a>
              <Tooltip title="Copy Phone">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ fontSize: 12 }} />}
                  onClick={handleCopyPhone}
                />
              </Tooltip>
            </div>
          </div>

          {request.email && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Email Address
              </Text>
              <a
                href={`mailto:${request.email}`}
                style={{ color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <MailOutlined /> {request.email}
              </a>
            </div>
          )}

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Submitted At
            </Text>
            <span style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined /> {formattedDate}
            </span>
          </div>
        </div>

        {/* Message / Prayer Request Card */}
        <div>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>
            {request.category === 'prayer' ? 'Prayer Need / Request' : 'Message'}
          </Text>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 8,
              padding: 16,
              minHeight: 90,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <Paragraph
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-main, #1e293b)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {request.message}
            </Paragraph>
          </div>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Pastoral Follow-up & Management Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              Pastoral Follow-up & Notes
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Status:
              </Text>
              <Select<ContactRequestStatus>
                value={status}
                onChange={(val) => setStatus(val)}
                style={{ width: 160 }}
                options={[
                  { value: 'new', label: 'New / Unread' },
                  { value: 'read', label: 'Read' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'responded', label: 'Responded / Done' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          </div>

          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal pastoral follow-up notes (e.g. called member, scheduled in-person prayer, referred to youth leader)..."
            rows={3}
            maxLength={2000}
            showCount
          />

          {request.responded_at && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ✓ Last marked responded on{' '}
                {new Date(request.responded_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
