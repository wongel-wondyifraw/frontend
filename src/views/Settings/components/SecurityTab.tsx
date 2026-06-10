'use client';
import React from 'react';
import { Form, Input, Button } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface SecurityTabProps {
    passwordForm: FormInstance;
    onPasswordChange: (values: Record<string, string>) => void;
}

const SecurityTab = ({ passwordForm, onPasswordChange }: SecurityTabProps) => (
    <div className="settings-section">
        <h3>Change Password</h3>
        <Form layout="vertical" form={passwordForm} onFinish={onPasswordChange}>
            <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[{ required: true, message: 'Please enter current password' }]}
            >
                <Input.Password placeholder="Enter your current password" />
            </Form.Item>
            <Form.Item label="New Password" name="newPassword" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="Enter new password" />
            </Form.Item>
            <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="Confirm new password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" style={{ background: '#1565c0' }}>
                Update Password
            </Button>
        </Form>
    </div>
);

export default SecurityTab;
