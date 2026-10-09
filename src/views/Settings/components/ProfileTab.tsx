'use client';
import React, { useEffect } from 'react';
import { Form, Input, Button, Avatar, Upload, Row, Col, App, Card, Tag, Divider } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { UserOutlined, UploadOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useUser } from '@/context/UserContext';
import { getAvatarUrl } from '@/lib/media-url';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import type { User } from '@/types';

interface ProfileTabProps {
  form: FormInstance;
  loading: boolean;
  profile: User | null;
  avatarPreview: string | null;
  onProfileUpdate: (values: Record<string, string>) => void;
  onAvatarUpload: (file: File, userId: string) => boolean | Promise<boolean>;
  avatarUploading?: boolean;
  avatarUploadPercent?: number;
}

const ProfileTab = ({
  form,
  loading,
  profile,
  avatarPreview,
  onProfileUpdate,
  onAvatarUpload,
  avatarUploading,
  avatarUploadPercent = 0,
}: ProfileTabProps) => {
  const { avatarVersion } = useUser();
  const { message, modal } = App.useApp();

  useEffect(() => {
    if (!profile) return;
    form.setFieldsValue({
      firstName: profile.first_name,
      middleName: profile.middle_name,
      lastName: profile.last_name,
      email: profile.email,
      role: profile.role,
    });
  }, [profile, form]);

  const allowedAreas = Array.from(new Set(profile?.permissions?.map(p => p.category).filter(Boolean) || []));

  return (
    <div className="settings-section settings-section--wide">
      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} lg={10} xl={8}>
          <Card style={{ height: '100%' }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32, textAlign: "center" }}>
              <Avatar
                size={180}
                icon={<UserOutlined />}
                src={avatarPreview || getAvatarUrl(profile?.avatar_url, avatarVersion)}
                style={{ marginBottom: 4 }}
              />
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <div style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 12 }}>{profile?.email}</div>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
                  <Tag color={profile?.role === "admin" ? "blue" : "default"}>{profile?.role?.toUpperCase()}</Tag>
                  <Tag color="success">Active</Tag>
                </div>
              </div>

              <div style={{ marginTop: 16, width: '100%' }}>
                <Upload
                  showUploadList={false}
                  accept="image/jpeg,image/png,image/webp"
                  beforeUpload={(file) => onAvatarUpload(file, profile?.id ?? '')}
                >
                  <Button icon={<UploadOutlined />} loading={avatarUploading}>Change photo</Button>
                </Upload>
                <UploadProgressBar active={Boolean(avatarUploading)} percent={avatarUploadPercent} />
                <p className="settings-avatar-hint" style={{ marginTop: 8 }}>JPG, PNG, or WebP. Max 800KB.</p>
              </div>
            </div>
            
            <Divider />
            
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18, color: 'var(--text-danger)', fontWeight: 600 }}>Data & Privacy</span>
              </div>
              <p className="settings-avatar-hint" style={{ marginBottom: 16 }}>
                Manage your personal data in accordance with privacy regulations (GDPR).
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button 
                  block
                  onClick={async () => {
                    try {
                      const { exportMyData } = await import('@/services/api');
                      const blob = await exportMyData();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      message.success("Data exported successfully");
                    } catch {
                      message.error("Failed to export data");
                    }
                  }}
                >
                  Download my data
                </Button>
                <Button 
                  danger 
                  block
                  onClick={async () => {
                    modal.confirm({
                      title: 'Request Account Deletion',
                      content: 'Are you sure you want to delete your account? This will anonymize your personal data and cannot be undone.',
                      okText: 'Yes, delete my account',
                      okType: 'danger',
                      cancelText: 'Cancel',
                      onOk: async () => {
                        try {
                          const { requestAccountDeletion, logoutUser } = await import('@/services/api');
                          await requestAccountDeletion();
                          message.success("Account marked for deletion");
                          await logoutUser();
                          window.location.href = '/login';
                        } catch {
                          message.error("Failed to request deletion");
                        }
                      }
                    });
                  }}
                >
                  Request account deletion
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14} xl={16}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }} title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><UserOutlined style={{ fontSize: 20, color: "var(--text-secondary)" }} /><span style={{ fontSize: 18 }}>Personal Information</span></div>}>
            <Form layout="vertical" form={form} onFinish={onProfileUpdate}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="First name"
                    name="firstName"
                    rules={[{ required: true, message: 'First name is required' }]}
                  >
                    <Input placeholder="First name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Middle name" name="middleName">
                    <Input placeholder="Optional" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Last name"
                    name="lastName"
                    rules={[{ required: true, message: 'Last name is required' }]}
                  >
                    <Input placeholder="Last name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email" name="email">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Role" name="role">
                <Input disabled />
              </Form.Item>
              <div className="settings-form-actions">
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save changes
                </Button>
              </div>
            </Form>

            <Divider style={{ margin: '32px 0 24px 0' }} />

            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <AppstoreOutlined style={{ fontSize: 20, color: "var(--text-secondary)" }} />
                <span style={{ fontSize: 18, color: 'var(--text-main)', fontWeight: 600 }}>System Access</span>
              </div>
              <p className="settings-avatar-hint" style={{ marginBottom: 16 }}>
                Based on your current role, you have access to the following areas:
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allowedAreas.length > 0 ? allowedAreas.map((area: string) => (
                  <Tag key={area} color="processing" style={{ padding: '6px 14px', fontSize: 14 }}>{area}</Tag>
                )) : (
                  <span style={{ color: 'var(--text-secondary)' }}>No specific areas assigned.</span>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileTab;
