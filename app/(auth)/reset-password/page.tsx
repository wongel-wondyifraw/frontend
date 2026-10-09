'use client';

import React, { useState, useEffect, Suspense } from "react";
import { Typography, Form, Input, Button } from "antd";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { TENANT } from "@/lib/tenant";
import { useToast } from "@/context/ToastContext";
import PoweredByShepherd from "@/Components/common/PoweredByShepherd";
import PasswordStrengthMeter from "@/Components/common/PasswordStrengthMeter";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import { getAxiosErrorMessage } from "@/lib/errors";
import "@/views/LoginPage/LoginPage.css";

const { Title, Text } = Typography;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      showToast("error", "Invalid or missing reset token");
      router.push("/login");
    }
  }, [token, email, router, showToast]);

  const handleFinish = async (values: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!token || !email) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/reset-password`, { 
        token, 
        email, 
        new_password: values.newPassword 
      });
      showToast("success", "Password reset successfully. Please log in.");
      router.push("/login");
    } catch (error: unknown) {
      showToast("error", getAxiosErrorMessage(error, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) return null;

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-bg-overlay" aria-hidden="true" />

      <header className="login-header">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/login')}
          style={{ color: '#1E40AF', fontWeight: 600 }}
        >
          Back to Login
        </Button>
      </header>

      <main className="login-container">
        <div className="login-card">
          <div className="card-header">
            <Text type="secondary" className="login-tenant-name">
              {TENANT.name}
            </Text>
            <Title level={2} className="card-title">
              Create New Password
            </Title>
            <Text type="secondary" className="card-subtitle">
              Enter your new password below
            </Text>
          </div>

          <Form form={form} layout="vertical" className="login-form" size="large" onFinish={handleFinish}>
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: "New password is required" },
                { min: 8, message: "At least 8 characters" },
                { pattern: /[A-Z]/, message: 'Needs at least 1 uppercase letter' },
                { pattern: /[a-z]/, message: 'Needs at least 1 lowercase letter' },
                { pattern: /[0-9]/, message: 'Needs at least 1 number' },
              ]}
            >
              <Input.Password placeholder="New Password" className="custom-input" prefix={<LockOutlined className="input-icon" />} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.newPassword !== curr.newPassword}>
              {({ getFieldValue }) => (
                <div style={{ marginBottom: 24 }}>
                  <PasswordStrengthMeter password={getFieldValue("newPassword")} />
                </div>
              )}
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
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
              <Input.Password placeholder="Confirm Password" className="custom-input" prefix={<LockOutlined className="input-icon" />} />
            </Form.Item>

            <Button type="primary" htmlType="submit" block className="login-button" loading={loading}>
              Reset Password
            </Button>
          </Form>

          <div className="footer-text">
            <PoweredByShepherd />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
