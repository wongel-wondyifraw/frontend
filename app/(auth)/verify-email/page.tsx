'use client';

import React, { useState, useEffect, Suspense } from "react";
import { Typography, Button, Spin, Result } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { TENANT } from "@/lib/tenant";
import { useToast } from "@/context/ToastContext";
import PoweredByShepherd from "@/Components/common/PoweredByShepherd";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import { getAxiosErrorMessage } from "@/lib/errors";
import "@/views/LoginPage/LoginPage.css";

const { Title, Text } = Typography;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setVerifying(false);
      setSuccess(false);
      return;
    }

    const verify = async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/auth/verify-email`, { token, email });
        setSuccess(true);
      } catch (error: unknown) {
        showToast("error", getAxiosErrorMessage(error, "Failed to verify email"));
        setSuccess(false);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, email, showToast]);

  const handleResend = async () => {
    if (!email) return;
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/resend-verification`, { email });
      showToast("success", "Verification email resent successfully.");
    } catch (error: unknown) {
      showToast(
        "error",
        getAxiosErrorMessage(error, "Failed to resend verification email"),
      );
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
              Email Verification
            </Title>
          </div>

          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            {verifying ? (
              <Spin size="large" tip="Verifying your email..." />
            ) : success ? (
              <Result
                status="success"
                title="Email Verified!"
                subTitle="Your email address has been successfully verified."
                extra={[
                  <Button type="primary" key="console" onClick={() => router.push('/login')}>
                    Go to Login
                  </Button>,
                ]}
              />
            ) : (
              <Result
                status="error"
                title="Verification Failed"
                subTitle="The verification link is invalid or has expired."
                extra={[
                  email && (
                    <Button type="primary" key="resend" onClick={handleResend} icon={<MailOutlined />}>
                      Resend Verification Email
                    </Button>
                  ),
                ]}
              />
            )}
          </div>

          <div className="footer-text">
            <PoweredByShepherd />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
