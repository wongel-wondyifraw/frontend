'use client';
import React from 'react';
import { Form, Input, Button, Row, Col, Card, Divider } from 'antd';
import { SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons';
import PasswordStrengthMeter from '@/Components/common/PasswordStrengthMeter';
import ActiveSessionsList from './ActiveSessionsList';
import { MfaSetup } from './MfaSetup';

import { changePassword } from '@/services/api';
import { getApiErrorMessage } from '@/lib/errors';
import { App } from 'antd';

const SecurityTab = () => {
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { message } = App.useApp();

  const handlePasswordChange = async (values: Record<string, string>) => {
    try {
      setLoading(true);
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section settings-section--wide">
    <Row gutter={[24, 24]} align="stretch">
      <Col xs={24} lg={10} xl={8}>
        <Card style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: "var(--text-main)" }} />
                <h2 style={{ margin: 0, fontSize: 20 }}>Security Overview</h2>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                Manage your account's security settings, change your password, and set up two-factor authentication.
              </p>
            </div>
            <Divider style={{ margin: 0 }} />
            <div>
              <MfaSetup />
            </div>
            <Divider style={{ margin: 0 }} />
            <div style={{ marginTop: 'auto' }}>
              <ActiveSessionsList />
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={14} xl={16}>
        <Card 
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }} 
          styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }} 
          title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><KeyOutlined style={{ fontSize: 20, color: "var(--text-secondary)" }} /><span style={{ fontSize: 18 }}>Change Password</span></div>}
        >
          <Form layout="vertical" form={passwordForm} onFinish={handlePasswordChange}>
            <Form.Item
              label="Current password"
              name="currentPassword"
              rules={[{ required: true, message: 'Enter your current password' }]}
            >
              <Input.Password placeholder="Current password" autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              label="New password"
              name="newPassword"
              rules={[
                { required: true, message: 'Enter a new password' },
                { min: 8, message: 'At least 8 characters' },
                { pattern: /[A-Z]/, message: 'Needs at least 1 uppercase letter' },
                { pattern: /[a-z]/, message: 'Needs at least 1 lowercase letter' },
                { pattern: /[0-9]/, message: 'Needs at least 1 number' },
              ]}
            >
              <Input.Password placeholder="New password" autoComplete="new-password" />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.newPassword !== curr.newPassword}>
              {({ getFieldValue }) => (
                <PasswordStrengthMeter password={getFieldValue("newPassword")} />
              )}
            </Form.Item>
            <Form.Item
              label="Confirm password"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm new password" autoComplete="new-password" />
            </Form.Item>
            <div className="settings-form-actions">
              <Button type="primary" htmlType="submit" loading={loading}>
                Update password
              </Button>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  </div>
  );
};

export default SecurityTab;
