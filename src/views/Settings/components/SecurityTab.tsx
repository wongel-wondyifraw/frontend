'use client';
import React from 'react';
import { Form, Input, Button } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface SecurityTabProps {
  passwordForm: FormInstance;
  loading?: boolean;
  onPasswordChange: (values: Record<string, string>) => void;
}

const SecurityTab = ({ passwordForm, loading, onPasswordChange }: SecurityTabProps) => (
  <div className="settings-section">
    <h3 className="settings-section-title">Change password</h3>
    <Form layout="vertical" form={passwordForm} onFinish={onPasswordChange}>
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
          { min: 6, message: 'At least 6 characters' },
        ]}
      >
        <Input.Password placeholder="New password" autoComplete="new-password" />
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
  </div>
);

export default SecurityTab;
