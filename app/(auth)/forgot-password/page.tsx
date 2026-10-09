'use client';

import React, { useState } from "react";
import { Typography, Form, Input, Button } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { TENANT } from "@/lib/tenant";
import { useToast } from "@/context/ToastContext";
import PoweredByShepherd from "@/Components/common/PoweredByShepherd";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import { getAxiosErrorMessage } from "@/lib/errors";
import "@/views/LoginPage/LoginPage.css";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password`, { email: values.email });
      setSubmitted(true);
    } catch (error: unknown) {
      showToast("error", getAxiosErrorMessage(error, "Failed to process request"));
    } finally {
      setLoading(false);
    }
  };

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
              Reset Password
            </Title>
            <Text type="secondary" className="card-subtitle">
              {submitted ? "Check your email" : "Enter your email to receive a reset link"}
            </Text>
          </div>

          {!submitted ? (
            <Form layout="vertical" className="login-form" size="large" onFinish={handleFinish}>
              <Form.Item name="email" rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
                <Input placeholder="Email address" className="custom-input" prefix={<MailOutlined className="input-icon" />} />
              </Form.Item>

              <Button type="primary" htmlType="submit" block className="login-button" loading={loading}>
                Send Reset Link
              </Button>
            </Form>
          ) : (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Text>If that email address is in our database, we will send you an email to reset your password.</Text>
            </div>
          )}

          <div className="footer-text">
            <PoweredByShepherd />
          </div>
        </div>
      </main>
    </div>
  );
}
