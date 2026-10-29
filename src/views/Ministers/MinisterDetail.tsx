'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  App,
  Tag,
  Button,
  Timeline,
  Spin,
  Avatar,
  Dropdown,
  Modal,
  Typography,
  Space,
  Statistic,
  Tooltip,
} from 'antd';
import { message } from '@/lib/app-message';
import type { MenuProps } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  LockOutlined,
  StopOutlined,
  CopyOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  TeamOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import {
  getMinisterById,
  deleteMinister,
  updateMinister,
  resetMinisterPassword,
  getFamilyByPerson,
} from '../../services/api';
import type { MinisterDetailProps, Minister, Family } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { getImageUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
import { useCan } from '@/Components/auth/Can';
import { leaderDisplayName } from '../../Components/common/LeaderLabel';
import './MinisterDetail.css';

const { Paragraph, Text } = Typography;

const calculateAge = (dobString?: string): number | undefined => {
  if (!dobString) return undefined;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const MinisterDetail = ({ ministerId: ministerIdProp, initialMinister = null }: MinisterDetailProps) => {
  const params = useParams();
  const id = (ministerIdProp || params?.id) as string;
  const router = useRouter();
  const canUpdate = useCan('ministers.update');
  const canDelete = useCan('ministers.delete');
  const { modal } = App.useApp();
  const [minister, setMinister] = useState<Minister | null>(initialMinister);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(initialMinister === null);
  const [actionLoading, setActionLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [data, familyData] = await Promise.all([
        getMinisterById(id),
        getFamilyByPerson(id, 'minister').catch(() => null),
      ]);
      setMinister(data);
      setFamily(familyData);
    } catch {
      message.error('Failed to load minister details');
      router.push('/ministers/manage');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (initialMinister !== null) {
      getFamilyByPerson(id, 'minister')
        .then(setFamily)
        .catch(() => setFamily(null));
      return;
    }
    fetchDetails();
  }, [initialMinister, fetchDetails, id]);

  const handleDelete = async () => {
    try {
      await deleteMinister(id);
      message.success('Minister and login account deleted');
      router.push('/ministers/manage');
    } catch {
      message.error('Failed to delete minister');
    }
  };

  const handleResetPassword = () => {
    modal.confirm({
      title: 'Reset login password?',
      icon: <LockOutlined style={{ color: '#1565c0' }} />,
      content: 'A new temporary password will be generated. Share it with the minister — it is shown only once.',
      okText: 'Reset Password',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setActionLoading(true);
          const result = await resetMinisterPassword(id);
          setCredentials({
            email: minister?.email || '',
            password: result.temporary_password,
          });
          message.success('Password reset successfully');
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to reset password'));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleToggleStatus = async () => {
    if (!minister) return;
    const nextStatus = (minister.status || 'active').toLowerCase() === 'active' ? 'inactive' : 'active';
    try {
      setActionLoading(true);
      const updated = await updateMinister(id, { status: nextStatus });
      setMinister(updated);
      message.success(`Account ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update account status'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!minister?.email) return;
    try {
      await navigator.clipboard.writeText(minister.email);
      message.success('Login email copied');
    } catch {
      message.error('Could not copy email');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!minister) return null;

  const fullName = `${minister.first_name} ${minister.middle_name ? `${minister.middle_name} ` : ''}${minister.last_name}`;
  const isActive = (minister.status || 'active').toLowerCase() === 'active';
  const accountActive = minister.user?.is_active ?? isActive;
  const accountRole = minister.user?.role || 'minister';
  const age = calculateAge(minister.date_of_birth);

  const joinedYear = minister.joined_date
    ? new Date(minister.joined_date).getFullYear()
    : minister.created_at
    ? new Date(minister.created_at).getFullYear()
    : undefined;

  const isFemale = (minister.gender || '').toLowerCase() === 'female';
  const spouse = isFemale ? family?.husband : family?.wife;
  const spouseName = spouse
    ? leaderDisplayName(spouse)
    : family?.external_spouse_name || (minister.marital_status === 'married' ? 'Linked in Church' : undefined);

  const moreItems: MenuProps['items'] = [
    {
      key: 'copy-email',
      icon: <CopyOutlined />,
      label: 'Copy login email',
      onClick: handleCopyEmail,
    },
    ...(canUpdate ? [
      {
        key: 'reset-password',
        icon: <KeyOutlined />,
        label: 'Reset password',
        onClick: handleResetPassword,
      },
      {
        key: 'toggle-status',
        icon: isActive ? <StopOutlined /> : <CheckCircleOutlined />,
        label: isActive ? 'Deactivate account' : 'Activate account',
        onClick: handleToggleStatus,
      },
    ] : []),
    ...(canDelete ? [
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete minister',
        danger: true,
        onClick: () => {
          modal.confirm({
            title: 'Delete Minister',
            content: 'This also deletes their login account. Continue?',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: handleDelete,
          });
        },
      },
    ] : []),
  ];

  return (
    <div className="member-detail-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}
      >
        Back to Ministers
      </Button>

      <div className="content-card-unified">
        {/* Unified Header Section */}
        <div className="member-header-section">
          <Avatar
            size={120}
            src={getImageUrl(minister.image_url) ?? undefined}
            className="member-profile-image"
            style={{ fontSize: 42, fontWeight: 600, backgroundColor: '#1565c0', color: '#fff' }}
          >
            {getInitials(minister.first_name, minister.last_name, minister.middle_name)}
          </Avatar>

          <div className="member-header-info">
            <h1 className="member-name">{fullName}</h1>
            <div className="member-role-tags">
              <Tag
                icon={isActive ? <CheckCircleOutlined /> : <UserOutlined />}
                color={isActive ? 'success' : 'error'}
                style={{ fontSize: 14, padding: '4px 10px', borderRadius: 12 }}
              >
                {isActive ? 'Active Minister' : 'Inactive Minister'}
              </Tag>
              {minister.title && <Tag color="purple" style={{ fontSize: 14, padding: '4px 10px', borderRadius: 12 }}>{minister.title}</Tag>}
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px', borderRadius: 12 }}>Role: {accountRole}</Tag>
            </div>
          </div>

          <div className="member-actions-stacked">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              size="middle"
              style={{ backgroundColor: '#2c73c5' }}
              onClick={() => window.print()}
            >
              Print
            </Button>
            {canUpdate && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="middle"
                style={{ backgroundColor: '#2c73c5' }}
                onClick={() => router.push(`/ministers/edit/${id}`)}
              >
                Edit
              </Button>
            )}
            <Dropdown menu={{ items: moreItems }} placement="bottomRight" trigger={['click']}>
              <Button icon={<MoreOutlined />} size="middle" loading={actionLoading}>
                More
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* KPI Summary Row */}
        <div className="member-kpi-row">
          <div className="member-kpi-card">
            <Statistic
              title="Status"
              value={isActive ? 'ACTIVE' : 'INACTIVE'}
              valueStyle={{
                color: isActive ? '#10b981' : '#ef4444',
                fontSize: 20,
                fontWeight: 700,
              }}
              prefix={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
            />
          </div>

          <div className="member-kpi-card">
            <Statistic
              title="Pastoral Title"
              value={minister.title || 'Minister'}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: '#1565c0' }}
              prefix={<IdcardOutlined />}
            />
          </div>

          <div className="member-kpi-card">
            <Statistic
              title="Portal Role"
              value={accountRole.toUpperCase()}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}
              prefix={<SafetyCertificateOutlined />}
            />
          </div>

          <div className="member-kpi-card">
            <Statistic
              title="Service Tenure"
              value={joinedYear ? `Since ${joinedYear}` : 'Active'}
              valueStyle={{ fontSize: 20, fontWeight: 700 }}
              prefix={<CalendarOutlined />}
            />
          </div>
        </div>

        {/* Multi-Column Details Grid */}
        <div className="member-details-grid">
          {/* Card 1: Personal Information */}
          <div className="detail-section">
            <h3><UserOutlined /> Personal Information</h3>
            <div className="info-row">
              <span className="info-label"><MailOutlined /> Email</span>
              <span className="info-value">
                <Space>
                  <span>{minister.email}</span>
                  <Tooltip title="Copy Email">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyEmail} />
                  </Tooltip>
                </Space>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><PhoneOutlined /> Phone</span>
              <span className="info-value">{minister.phone || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label"><EnvironmentOutlined /> Address</span>
              <span className="info-value">{minister.address || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label"><CalendarOutlined /> Date of Birth</span>
              <span className="info-value">
                {minister.date_of_birth ? new Date(minister.date_of_birth).toLocaleDateString() : '—'}
                {age !== undefined ? ` (${age} yrs)` : ''}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><UserOutlined /> Gender</span>
              <span className="info-value" style={{ textTransform: 'capitalize' }}>
                {minister.gender || '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><HeartOutlined /> Marital Status</span>
              <span className="info-value" style={{ textTransform: 'capitalize' }}>
                {minister.marital_status || '—'}
              </span>
            </div>
          </div>

          {/* Card 2: Pastoral Profile */}
          <div className="detail-section">
            <h3><IdcardOutlined /> Ministry & Pastoral Profile</h3>
            <div className="info-row">
              <span className="info-label"><IdcardOutlined /> Pastoral Title</span>
              <span className="info-value">
                <Tag color="purple">{minister.title || 'Minister'}</Tag>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><CalendarOutlined /> Joined Church</span>
              <span className="info-value">
                {minister.joined_date ? new Date(minister.joined_date).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><CheckCircleOutlined /> Ministry Standing</span>
              <span className="info-value">
                <Tag color={isActive ? 'success' : 'default'}>
                  {isActive ? 'In Good Standing' : 'Inactive'}
                </Tag>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><CalendarOutlined /> Registered On</span>
              <span className="info-value">
                {minister.created_at ? new Date(minister.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {/* Card 3: Portal Account & Security */}
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0 }}><SafetyCertificateOutlined /> Portal Account & Security</h3>
              {canUpdate && (
                <Space wrap>
                  <Button size="small" icon={<KeyOutlined />} onClick={handleResetPassword} loading={actionLoading}>
                    Reset Password
                  </Button>
                  <Button
                    size="small"
                    icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                    onClick={handleToggleStatus}
                    loading={actionLoading}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </Space>
              )}
            </div>

            <div className="info-row">
              <span className="info-label"><MailOutlined /> Login Email</span>
              <span className="info-value">
                <Space>
                  <span>{minister.email}</span>
                  <Tooltip title="Copy login email">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyEmail} />
                  </Tooltip>
                </Space>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><UserOutlined /> Portal Role</span>
              <span className="info-value">
                <Tag color="purple">{accountRole}</Tag>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><CheckCircleOutlined /> Account Status</span>
              <span className="info-value">
                <Tag color={accountActive ? 'success' : 'error'}>
                  {accountActive ? 'Active — can sign in' : 'Inactive — login blocked'}
                </Tag>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><LockOutlined /> Password</span>
              <span className="info-value">
                <Text type="secondary" style={{ fontSize: 13 }}>Configured at registration</Text>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><CalendarOutlined /> Account Created</span>
              <span className="info-value">
                {minister.user?.created_at
                  ? new Date(minister.user.created_at).toLocaleString()
                  : minister.created_at
                  ? new Date(minister.created_at).toLocaleString()
                  : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label"><CalendarOutlined /> Last Updated</span>
              <span className="info-value">
                {minister.user?.updated_at
                  ? new Date(minister.user.updated_at).toLocaleString()
                  : '—'}
              </span>
            </div>
          </div>

          {/* Card 4: Family Details (if any family information exists) */}
          {(family || spouseName || minister.marital_status === 'married') && (
            <div className="detail-section">
              <h3><TeamOutlined /> Family Details</h3>
              <div className="info-row">
                <span className="info-label"><HeartOutlined /> Spouse</span>
                <span className="info-value">{spouseName || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label"><TeamOutlined /> Children</span>
                <span className="info-value">
                  {family?.children?.length ? `${family.children.length} registered` : 'None registered'}
                </span>
              </div>
              {family?.children && family.children.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {family.children.map((child) => (
                    <div key={child.id} className="info-row" style={{ paddingLeft: 12 }}>
                      <span className="info-label">{child.name}</span>
                      <span className="info-value">
                        {child.age !== undefined ? `${child.age} yrs` : child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Card 5: Activity & Timeline */}
          <div className="detail-section">
            <h3><CalendarOutlined /> Activity Timeline</h3>
            <div style={{ marginTop: 12 }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    content: (
                      <div>
                        <strong>Registered</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {minister.created_at ? new Date(minister.created_at).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                    ),
                  },
                  ...(minister.joined_date ? [{
                    color: 'blue' as const,
                    content: (
                      <div>
                        <strong>Joined Church Service</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {new Date(minister.joined_date).toLocaleDateString()}
                        </div>
                      </div>
                    ),
                  }] : []),
                  {
                    color: accountActive ? 'green' : 'red',
                    content: (
                      <div>
                        <strong>Portal Account {accountActive ? 'Active' : 'Deactivated'}</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {accountActive ? 'Login allowed with minister credentials' : 'Login access is currently blocked'}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Temporary Password Modal */}
      <Modal
        title="Temporary Password Generated"
        open={!!credentials}
        closable={false}
        mask={{ closable: false }}
        onOk={() => setCredentials(null)}
        okText="Done"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Text>
          Share these credentials with the minister now. The temporary password is shown only once.
        </Text>
        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card, #f8fafc)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Login Email</Text>
            <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0, fontWeight: 600 }}>
              {credentials?.email}
            </Paragraph>
          </div>
          <div>
            <Text type="secondary">Temporary Password</Text>
            <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0, fontWeight: 600 }}>
              {credentials?.password}
            </Paragraph>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MinisterDetail;
