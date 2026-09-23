'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Avatar,
  Button,
  Popconfirm,
  Spin,
  Statistic,
  Tag,
} from 'antd';
import { message } from '@/lib/app-message';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deletePlan, getPlanById, updatePlan } from '@/services/api';
import type { Plan, PlanStatus, PlanType } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useCan } from '@/Components/auth/Can';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import '../Members/MemberDetail.css';
import './PlanDetail.css';

const PLAN_TYPE_LABELS: Record<PlanType, { label: string; color: string }> = {
  program: { label: 'Program', color: 'blue' },
  crusade: { label: 'Crusade', color: 'magenta' },
  general_assembly: { label: 'General Assembly', color: 'purple' },
  training: { label: 'Training', color: 'cyan' },
  fasting_day: { label: 'Fasting Day', color: 'orange' },
  gospel_campaign: { label: 'Gospel Campaign', color: 'green' },
};

function personName(p?: { first_name?: string; middle_name?: string; last_name?: string } | null) {
  if (!p) return '—';
  return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
}

function formatTime(t?: string | null) {
  if (!t) return null;
  return t.length > 5 ? t.slice(0, 5) : t;
}

const PlanDetailContent = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const canUpdate = useCan('plans.update');
  const canDelete = useCan('plans.delete');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPlan(await getPlanById(id));
    } catch {
      message.error('Failed to load plan');
      router.push('/planning');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await deletePlan(id);
      message.success('Plan deleted');
      router.push('/planning');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to delete plan'));
    }
  };

  const setStatus = async (status: PlanStatus) => {
    try {
      const updated = await updatePlan(id, { status });
      setPlan(updated);
      const labels: Record<PlanStatus, string> = {
        planned: 'Plan activated',
        cancelled: 'Plan cancelled',
        completed: 'Plan marked as achieved',
      };
      message.success(labels[status]);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update plan status'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!plan) return null;

  const typeMeta = PLAN_TYPE_LABELS[plan.type] || { label: plan.type, color: 'blue' };
  const start = formatTime(plan.start_time);
  const end = formatTime(plan.end_time);
  const ministers = plan.plan_ministers || [];
  const statusColor =
    plan.status === 'completed' ? 'success' : plan.status === 'cancelled' ? 'default' : 'processing';
  const statusLabel = plan.status === 'completed' ? 'ACHIEVED' : plan.status.toUpperCase();

  return (
    <div className="member-detail-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/planning')}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}
      >
        Back to Planning
      </Button>

      <div className="content-card-unified">
        <div className="member-header-section">
          <Avatar
            size={120}
            className="member-profile-image plan-detail-avatar"
            style={{ fontSize: 42, fontWeight: 600, backgroundColor: '#1565c0', color: '#fff' }}
            icon={<CalendarOutlined />}
          />
          <div className="member-header-info">
            <h1 className="member-name">{plan.title}</h1>
            <div className="member-role-tags">
              <Tag color={typeMeta.color} style={{ fontSize: 14, padding: '4px 10px', borderRadius: 12 }}>
                {typeMeta.label}
              </Tag>
              <Tag
                icon={plan.status === 'completed' ? <CheckCircleOutlined /> : undefined}
                color={statusColor}
                style={{ fontSize: 14, padding: '4px 10px', borderRadius: 12 }}
              >
                {statusLabel}
              </Tag>
            </div>
            <div className="member-id">
              {dayjs(plan.plan_date).format('dddd, MMMM D, YYYY')}
              {start ? ` · ${start}${end ? `–${end}` : ''}` : ''}
            </div>
          </div>
          <div className="member-actions-stacked">
            {canUpdate && plan.status === 'planned' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="middle"
                  style={{ backgroundColor: '#16a34a' }}
                  onClick={() => setStatus('completed')}
                >
                  Mark as achieved
                </Button>
                <Popconfirm
                  title="Cancel this plan?"
                  description="You can activate it again later."
                  onConfirm={() => setStatus('cancelled')}
                  okText="Cancel plan"
                  okType="danger"
                >
                  <Button danger icon={<StopOutlined />} size="middle">
                    Cancel
                  </Button>
                </Popconfirm>
              </>
            )}
            {canUpdate && (plan.status === 'cancelled' || plan.status === 'completed') && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                size="middle"
                style={{ backgroundColor: '#16a34a' }}
                onClick={() => setStatus('planned')}
              >
                Activate
              </Button>
            )}
            {canUpdate && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="middle"
                style={{ backgroundColor: '#2c73c5' }}
                onClick={() => router.push(`/planning?edit=${plan.id}`)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="Delete plan"
                description="Are you sure you want to delete this plan?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
                placement="bottomRight"
              >
                <Button type="primary" danger icon={<DeleteOutlined />} size="middle">
                  Delete
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>

        <div className="member-kpi-row plan-detail-kpi">
          <div className="member-kpi-card">
            <Statistic
              title="Date"
              value={dayjs(plan.plan_date).format('MMM D')}
              prefix={<CalendarOutlined style={{ color: '#1565c0' }} />}
            />
          </div>
          <div className="member-kpi-card">
            <Statistic
              title="Time"
              value={start ? (end ? `${start}–${end}` : start) : 'All day'}
              prefix={<ClockCircleOutlined style={{ color: '#1565c0' }} />}
            />
          </div>
          <div className="member-kpi-card">
            <Statistic
              title="Ministers"
              value={ministers.length}
              prefix={<TeamOutlined style={{ color: '#1565c0' }} />}
            />
          </div>
          <div className="member-kpi-card">
            <Statistic
              title="Location"
              value={plan.location ? 'Set' : 'TBD'}
              prefix={<EnvironmentOutlined style={{ color: '#1565c0' }} />}
            />
          </div>
        </div>

        <div className="member-details-grid">
          <div className="detail-section">
            <h3>
              <CalendarOutlined style={{ marginRight: 8, color: '#1565c0' }} />
              Schedule
            </h3>
            <table className="elegant-info-table">
              <tbody>
                <tr>
                  <th>
                    <CalendarOutlined /> Date
                  </th>
                  <td>{dayjs(plan.plan_date).format('MMMM D, YYYY')}</td>
                </tr>
                <tr>
                  <th>
                    <ClockCircleOutlined /> Start
                  </th>
                  <td>{start || 'N/A'}</td>
                </tr>
                <tr>
                  <th>
                    <ClockCircleOutlined /> End
                  </th>
                  <td>{end || 'N/A'}</td>
                </tr>
                <tr>
                  <th>
                    <EnvironmentOutlined /> Location
                  </th>
                  <td>{plan.location || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="detail-section">
            <h3>
              <FileTextOutlined style={{ marginRight: 8, color: '#1565c0' }} />
              Details
            </h3>
            <table className="elegant-info-table">
              <tbody>
                <tr>
                  <th>Type</th>
                  <td>
                    <Tag color={typeMeta.color}>{typeMeta.label}</Tag>
                  </td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    <Tag color={statusColor}>{statusLabel}</Tag>
                  </td>
                </tr>
                <tr>
                  <th>Created</th>
                  <td>
                    {plan.created_at ? dayjs(plan.created_at).format('MMM D, YYYY') : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <th>Updated</th>
                  <td>
                    {plan.updated_at ? dayjs(plan.updated_at).format('MMM D, YYYY') : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="detail-section detail-section--wide">
            <h3>
              <FileTextOutlined style={{ marginRight: 8, color: '#1565c0' }} />
              Notes
            </h3>
            <p className="plan-detail-notes">{plan.notes?.trim() || 'No notes added.'}</p>
          </div>
        </div>

        <div className="detail-section" style={{ marginTop: 24 }}>
          <h3>
            <TeamOutlined style={{ marginRight: 8, color: '#1565c0' }} />
            Assigned ministers
          </h3>
          {ministers.length === 0 ? (
            <p className="plan-detail-notes">No ministers assigned.</p>
          ) : (
            <div className="plan-minister-grid">
              {ministers.map((pm) => (
                <div key={pm.minister_id} className="plan-minister-card">
                  <Avatar style={{ backgroundColor: '#1565c0' }}>
                    {(pm.minister?.first_name || '?').charAt(0)}
                  </Avatar>
                  <div>
                    <div className="plan-minister-name">{personName(pm.minister)}</div>
                    <div className="plan-minister-meta">{pm.minister?.email || pm.minister?.phone || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlanDetail = () => (
  <PermissionGate permission="plans.read" pageLabel="Plan Details">
    <PlanDetailContent />
  </PermissionGate>
);

export default PlanDetail;
