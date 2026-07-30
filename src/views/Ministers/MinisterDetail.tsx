'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Tag, Button, Timeline, Spin, message, Avatar, Popconfirm, Dropdown, Modal, Typography, Space,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  EditOutlined, DeleteOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
  CalendarOutlined, ArrowLeftOutlined, UserOutlined, PrinterOutlined, CheckCircleOutlined,
  MoreOutlined, LockOutlined, StopOutlined, CopyOutlined, KeyOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  getMinisterById, deleteMinister, updateMinister, resetMinisterPassword,
} from '../../services/api';
import type { MinisterDetailProps, Minister } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { getImageUrl } from '@/lib/media-url';
import { useCan } from '@/Components/auth/Can';
import './MinisterDetail.css';

const { Paragraph, Text } = Typography;

const MinisterDetail = ({ ministerId: ministerIdProp, initialMinister = null }: MinisterDetailProps) => {
  const params = useParams();
  const id = (ministerIdProp || params?.id) as string;
  const router = useRouter();
  const canUpdate = useCan('ministers.update');
  const canDelete = useCan('ministers.delete');
  const [minister, setMinister] = useState<Minister | null>(initialMinister);
  const [loading, setLoading] = useState(initialMinister === null);
  const [actionLoading, setActionLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setMinister(await getMinisterById(id));
    } catch {
      message.error('Failed to load minister details');
      router.push('/ministers/manage');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (initialMinister !== null) return;
    fetchDetails();
  }, [initialMinister, fetchDetails]);

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
    Modal.confirm({
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
          Modal.confirm({
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
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}>
        Back to Ministers
      </Button>

      <div className="content-card-unified">
        <div className="member-header-section">
          <Avatar
            size={120}
            src={getImageUrl(minister.image_url)}
            icon={<UserOutlined />}
            className="member-profile-image"
            style={{ fontSize: 60 }}
          />
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
              {minister.title && <Tag color="blue">{minister.title}</Tag>}
              <Tag color="purple">Role: {accountRole}</Tag>
            </div>
          </div>
          <div className="member-actions-stacked">
            <Button type="primary" icon={<PrinterOutlined />} style={{ backgroundColor: '#2c73c5' }} onClick={() => window.print()}>Print</Button>
            {canUpdate && (
              <Button type="primary" icon={<EditOutlined />} style={{ backgroundColor: '#2c73c5' }} onClick={() => router.push(`/ministers/edit/${id}`)}>Edit</Button>
            )}
            <Dropdown menu={{ items: moreItems }} placement="bottomRight" trigger={['click']}>
              <Button icon={<MoreOutlined />} loading={actionLoading}>More</Button>
            </Dropdown>
          </div>
        </div>

        <div className="member-details-grid">
          <div className="left-column">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <table className="elegant-info-table">
                <tbody>
                  <tr><th><MailOutlined /> Email</th><td>{minister.email}</td></tr>
                  <tr><th><PhoneOutlined /> Phone</th><td>{minister.phone || 'N/A'}</td></tr>
                  <tr><th><EnvironmentOutlined /> Address</th><td>{minister.address || 'N/A'}</td></tr>
                  <tr><th><CalendarOutlined /> Date of Birth</th><td>{minister.date_of_birth ? new Date(minister.date_of_birth).toLocaleDateString() : 'N/A'}</td></tr>
                  <tr><th><UserOutlined /> Gender</th><td style={{ textTransform: 'capitalize' }}>{minister.gender || 'N/A'}</td></tr>
                  <tr><th><UserOutlined /> Marital Status</th><td>{minister.marital_status || 'N/A'}</td></tr>
                  <tr><th><UserOutlined /> Title</th><td>{minister.title || 'N/A'}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0 }}><SafetyCertificateOutlined style={{ marginRight: 8, color: '#1565c0' }} />Account Information</h3>
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
              <table className="elegant-info-table">
                <tbody>
                  <tr>
                    <th><MailOutlined /> Login Email</th>
                    <td>
                      <Space>
                        <span>{minister.email}</span>
                        <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopyEmail} />
                      </Space>
                    </td>
                  </tr>
                  <tr>
                    <th><UserOutlined /> Role</th>
                    <td><Tag color="purple">{accountRole}</Tag></td>
                  </tr>
                  <tr>
                    <th><CheckCircleOutlined /> Account Status</th>
                    <td>
                      <Tag color={accountActive ? 'success' : 'error'}>
                        {accountActive ? 'Active — can sign in' : 'Inactive — login blocked'}
                      </Tag>
                    </td>
                  </tr>
                  <tr>
                    <th><LockOutlined /> Password</th>
                    <td>Set at registration. Use Reset Password to issue a new temporary password.</td>
                  </tr>
                  <tr>
                    <th><CalendarOutlined /> Account Created</th>
                    <td>
                      {minister.user?.created_at
                        ? new Date(minister.user.created_at).toLocaleString()
                        : minister.created_at
                          ? new Date(minister.created_at).toLocaleString()
                          : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <th><CalendarOutlined /> Last Updated</th>
                    <td>
                      {minister.user?.updated_at
                        ? new Date(minister.user.updated_at).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="right-column">
            <div className="detail-section">
              <h3>Activity Timeline</h3>
              <Timeline
                items={[
                  {
                    color: 'green',
                    content: `Registered on ${minister.created_at ? new Date(minister.created_at).toLocaleDateString() : 'Unknown'}`,
                  },
                  ...(minister.joined_date ? [{
                    color: 'blue' as const,
                    content: `Joined date ${new Date(minister.joined_date).toLocaleDateString()}`,
                  }] : []),
                  {
                    color: accountActive ? 'green' : 'red',
                    content: accountActive ? 'Login account is active' : 'Login account is deactivated',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Temporary password"
        open={!!credentials}
        closable={false}
        maskClosable={false}
        onOk={() => setCredentials(null)}
        okText="Done"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Text>
          Share these credentials with the minister now. The password is shown only once.
        </Text>
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Email</Text>
            <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0, fontWeight: 600 }}>
              {credentials?.email}
            </Paragraph>
          </div>
          <div>
            <Text type="secondary">Temporary password</Text>
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
