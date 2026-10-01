'use client';
import React, { useEffect } from 'react';
import { Form, Input, Button, Avatar, Upload, Row, Col } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useUser } from '@/context/UserContext';
import { getAvatarUrl } from '@/lib/media-url';
import type { User } from '@/types';

interface ProfileTabProps {
  form: FormInstance;
  loading: boolean;
  profile: User | null;
  avatarPreview: string | null;
  onProfileUpdate: (values: Record<string, string>) => void;
  onAvatarUpload: (file: File, userId: string) => boolean | Promise<boolean>;
}

const ProfileTab = ({
  form,
  loading,
  profile,
  avatarPreview,
  onProfileUpdate,
  onAvatarUpload,
}: ProfileTabProps) => {
  const { avatarVersion } = useUser();

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

  return (
    <div className="settings-section settings-section--wide">
      <div className="settings-profile">
        <div className="settings-avatar-panel">
          <h3 className="settings-section-title">Profile picture</h3>
          <Avatar
            className="settings-avatar"
            size={140}
            icon={<UserOutlined />}
            src={avatarPreview || getAvatarUrl(profile?.avatar_url, avatarVersion)}
          />
          <Upload
            showUploadList={false}
            accept="image/jpeg,image/png,image/webp"
            beforeUpload={(file) => onAvatarUpload(file, profile?.id ?? '')}
          >
            <Button icon={<UploadOutlined />}>Change photo</Button>
          </Upload>
          <p className="settings-avatar-hint">JPG, PNG, or WebP. Max 800KB.</p>
        </div>

        <div className="settings-profile-form">
          <h3 className="settings-section-title">Personal information</h3>
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
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
