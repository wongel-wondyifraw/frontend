'use client';
import React, { useState } from "react";
import { Typography, Form, Input, Button, message } from "antd";
import {
  GoogleOutlined,
  LoginOutlined,
  MailOutlined,
  LockOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { loginUser } from "../../services/api";
import { setAuthCookie } from "../../lib/auth-cookies";
import { getApiErrorMessage } from "../../lib/errors";
import AppLogo from "../../Components/common/AppLogo";
import "./LoginPage.css";
import { useUser } from "../../context/UserContext";

const { Title, Text } = Typography;

const LoginPage = () => {
  const router = useRouter();
  const { refreshUser } = useUser();

  const [loading, setLoading] = useState(false);

  // Runs ONLY when form validation passes
  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await loginUser(values.email, values.password);

      // Store token
      localStorage.setItem('token', data.access_token);
      setAuthCookie(data.access_token);

      // Update user context immediately
      await refreshUser();

      message.success("Login successful!");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Login failed:", error);
      message.error(getApiErrorMessage(error, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* HEADER LOGO */}
      <header className="login-header">
        <AppLogo variant="full" href="/" priority />
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          style={{ color: '#1565c0', fontWeight: 600 }}
        >
          Back to Home
        </Button>
      </header>

      {/* CENTERED CARD SECTION */}
      <main className="login-container">
        <div className="login-card">
          <div className="card-header">
            <Title level={2} className="card-title">
              Welcome back
            </Title>
            <Text type="secondary" className="card-subtitle">
              Please enter your details
            </Text>
          </div>

          <Form
            layout="vertical"
            className="login-form"
            size="large"
            onFinish={handleLogin}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Email is required" }]}
            >
              <Input
                placeholder="Email address"
                className="custom-input"
                prefix={<MailOutlined className="input-icon" />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                placeholder="Password"
                className="custom-input"
                prefix={<LockOutlined className="input-icon" />}
              />
            </Form.Item>

            <div className="form-actions">
              <div className="remember-forgot">
                <span />
                <a href="#" className="forgot-link">
                  Forgot password
                </a>
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              className="login-button"
              icon={<LoginOutlined />}
              loading={loading}
            >
              Login
            </Button>

            <Button
              className="google-button"
              icon={<GoogleOutlined />}
              block
            >
              Sign in with Google
            </Button>

            <div className="footer-text">

            </div>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
