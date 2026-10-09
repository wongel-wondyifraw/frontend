'use client';
import React, { useCallback, useEffect, useState } from "react";
import { Descriptions, Tag, Button, Avatar, App, Breadcrumb, Card, Spin, Row, Col } from "antd";
import { UserOutlined, SafetyOutlined, LogoutOutlined, KeyOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { getAvatarUrl } from "@/lib/media-url";
import { getInitials } from "@/lib/initials";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getUserById, adminResetUserPassword, forceLogoutUser, updateUser } from "@/services/api";
import "./Settings.css";

dayjs.extend(relativeTime);

interface UserDetailPageProps {
  userId: string;
}

const getOriginBadge = (origin?: string) => {
  switch (origin) {
    case "admin":
      return <Tag color="blue">Admin Created</Tag>;
    case "minister_module":
      return <Tag color="purple">Minister Module</Tag>;
    case "self_registration":
      return <Tag color="green">Self Registered</Tag>;
    case "invite":
      return <Tag color="orange">Invited</Tag>;
    default:
      return <Tag color="default">Unknown</Tag>;
  }
};

const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId }) => {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserById(userId);
      setUser(data);
    } catch {
      message.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId, message]);

  useEffect(() => {
    if (userId) {
      void loadUser();
    }
  }, [userId, loadUser]);

  const handleResetPassword = async () => {
    if (!user) return;
    try {
      const res = await adminResetUserPassword(user.id);
      modal.success({ title: 'Password Reset', content: `New temporary password: ${res.temporary_password}` });
    } catch {
      message.error("Failed to reset password");
    }
  };

  const handleForceLogout = async () => {
    if (!user) return;
    modal.confirm({
      title: 'Force Logout?',
      content: `Are you sure you want to log out ${user.first_name} from all devices?`,
      okText: 'Force Logout',
      okType: 'danger',
      onOk: async () => {
        try {
          await forceLogoutUser(user.id);
          message.success('User has been logged out of all devices');
        } catch {
          message.error("Failed to force logout");
        }
      }
    });
  };

  const handleUnlock = async () => {
    if (!user) return;
    try {
      await updateUser(user.id, { locked_until: null, failed_login_attempts: 0 });
      message.success('Account unlocked');
      loadUser();
    } catch {
      message.error("Failed to unlock account");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spin size="large" description="Loading user details..." />
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: 24 }}>User not found.</div>;
  }

  const isLocked = user.locked_until && new Date(user.locked_until) > new Date();

  const groupedPermissions = user.permissions?.reduce((acc, p) => {
    const cat = p.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof user.permissions>) || {};

  return (
    <div className="settings-page" style={{ paddingBottom: 24 }}>
      <Breadcrumb
        items={[
          { title: <a onClick={() => router.push('/settings')}>Settings</a> },
          { title: 'Users' },
          { title: `${user.first_name} ${user.last_name}` },
        ]}
        style={{ marginBottom: 24 }}
      />

      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/settings')}>
          Back to Settings
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10} xl={8}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32, textAlign: "center" }}>
              <Avatar size={180} src={getAvatarUrl(user.avatar_url)} icon={<UserOutlined />} style={{ marginBottom: 4 }}>
                {getInitials(user.first_name, user.last_name)}
              </Avatar>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>
                  {user.first_name} {user.last_name}
                </h1>
                <div style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 12 }}>{user.email}</div>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
                  <Tag color={user.role === "admin" ? "blue" : "default"}>{user.role?.toUpperCase()}</Tag>
                  {user.is_active ? <Tag color="success">Active</Tag> : <Tag color="default">Inactive</Tag>}
                  {isLocked && <Tag color="error" icon={<ExclamationCircleOutlined />}>Locked</Tag>}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
              <Button icon={<KeyOutlined />} onClick={handleResetPassword}>Reset Password</Button>
              <Button danger icon={<LogoutOutlined />} onClick={handleForceLogout}>Force Logout</Button>
              {isLocked && <Button type="primary" onClick={handleUnlock}>Unlock Account</Button>}
            </div>

            <Descriptions title="Account Info" column={1} bordered size="small">
              <Descriptions.Item label="Title">{user.title || "—"}</Descriptions.Item>
              <Descriptions.Item label="Registered">
                {user.created_at ? dayjs(user.created_at).format("MMM D, YYYY h:mm A") : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Failed Login Attempts">
                {user.failed_login_attempts || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Origin">{getOriginBadge(user.created_via)}</Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {user.last_login_at ? dayjs(user.last_login_at).fromNow() : "Never"}
              </Descriptions.Item>
              {isLocked && (
                <Descriptions.Item label="Locked Until">
                  {dayjs(user.locked_until).format("MMM D, YYYY h:mm A")}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={14} xl={16}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <SafetyOutlined style={{ fontSize: 20, color: "var(--text-secondary)" }} />
              <h2 style={{ margin: 0, fontSize: 20 }}>Permissions Overview</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              Permissions granted via the <strong>{user.role}</strong> role.
            </p>
            {Object.keys(groupedPermissions).length > 0 ? (
              <Row gutter={[24, 24]}>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <Col xs={24} sm={12} xl={8} key={category}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                      {category}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                      {perms.map((p) => (
                        <Tag key={p.slug} style={{ margin: 0, padding: '4px 8px', fontSize: 13, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', textAlign: 'center', whiteSpace: 'normal', height: 'auto' }}>
                          {p.name}
                        </Tag>
                      ))}
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>No specific permissions assigned.</span>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserDetailPage;
