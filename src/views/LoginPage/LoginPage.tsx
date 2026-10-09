'use client';
import React, { useState, useEffect } from "react";
import { Typography, Form, Input, Button, Checkbox } from "antd";
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
import PoweredByShepherd from "../../Components/common/PoweredByShepherd";
import { TENANT } from "@/lib/tenant";
import { useToast } from "@/context/ToastContext";
import "./LoginPage.css";
import { useUser } from "../../context/UserContext";

const { Title, Text } = Typography;

const LoginPage = () => {
  const router = useRouter();
  const { refreshUser } = useUser();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (localStorage.getItem("cms_remember_me") === "1") {
      form.setFieldsValue({ remember: true });
    }
  }, [form]);

  // Runs ONLY when form validation passes
  const handleLogin = async (values: {
    email: string;
    password: string;
    remember?: boolean;
  }) => {
    setLoading(true);
    try {
      const remember = Boolean(values.remember);
      const data = await loginUser(values.email, values.password, remember);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAuthCookie(data.access_token, remember);
      localStorage.setItem("cms_remember_me", remember ? "1" : "0");

      // Update user context immediately
      await refreshUser();

      showToast("success", "Login successful!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error, "Invalid email or password");
      console.error("Login failed:", errorMessage, error);
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-bg-overlay" aria-hidden="true" />

      {/* HEADER */}
      <header className="login-header">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          style={{ color: '#1E40AF', fontWeight: 600 }}
        >
          Back to Home
        </Button>
      </header>

      {/* CENTERED CARD SECTION */}
      <main className="login-container">
        <div className="login-card">
          <div className="card-header">
            <Text type="secondary" className="login-tenant-name">
              {TENANT.name}
            </Text>
            <Title level={2} className="card-title">
              Welcome back
            </Title>
            <Text type="secondary" className="card-subtitle">
              Please enter your details
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            className="login-form"
            size="large"
            onFinish={handleLogin}
            initialValues={{ remember: false }}
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
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
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
              <PoweredByShepherd />
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
