'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Breadcrumb, Row, Col, Divider, App } from 'antd';
import { SafetyCertificateOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PermissionPicker from './components/PermissionPicker';
import {
  createRole,
  getPermissionsGrouped,
  getRole,
  updateRole,
} from '@/services/api';
import type { Permission, Role } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import './Settings.css';

interface RoleDetailPageProps {
  id?: string;
  isNew?: boolean;
}

interface RoleFormValues {
  key?: string;
  name: string;
  description?: string;
  permissionSlugs: string[];
}

export default function RoleDetailPage({ id, isNew }: RoleDetailPageProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<RoleFormValues>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const groupedData = await getPermissionsGrouped();
        setGrouped(groupedData);

        if (!isNew && id) {
          const roleData = await getRole(id);
          setRole(roleData);
          form.setFieldsValue({
            key: roleData.key,
            name: roleData.name,
            description: roleData.description ?? '',
            permissionSlugs: roleData.permissions.map((p: Permission) => p.slug),
          });
        } else {
          form.setFieldsValue({
            permissionSlugs: [],
          });
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, 'Failed to load role details'));
        router.push('/settings');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isNew, form, router, message]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (!isNew && id) {
        await updateRole(id, {
          name: values.name,
          description: values.description,
          permissionSlugs: values.permissionSlugs,
        });
        message.success('Role updated');
      } else {
        await createRole({
          key: values.key!,
          name: values.name,
          description: values.description,
          permissionSlugs: values.permissionSlugs,
        });
        message.success('Role created');
      }
      router.push('/settings');
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to save role'));
    } finally {
      setSaving(false);
    }
  };

  const isAdminRole = role?.key === 'admin';

  return (
    <div className="manage-page">
      <Breadcrumb
        style={{ marginBottom: 24 }}
        items={[
          { title: <a onClick={() => router.push('/settings')}>Settings</a> },
          { title: isNew ? 'Create Role' : 'Edit Role' },
        ]}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/settings')} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyCertificateOutlined />
              {isNew ? 'Create New Role' : `Edit Role: ${role?.name || ''}`}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Configure permission sets that control what this role can do.
            </p>
          </div>
        </div>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          {isNew ? 'Create Role' : 'Save Changes'}
        </Button>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            {isNew && (
              <Col span={24} lg={8}>
                <Form.Item
                  name="key"
                  label="Key"
                  rules={[
                    { required: true, message: 'Key is required' },
                    {
                      pattern: /^[a-z][a-z0-9_]*$/,
                      message: 'Use lowercase letters, digits, and underscores',
                    },
                  ]}
                  extra="Stable identifier, e.g. volunteer_coordinator"
                >
                  <Input placeholder="volunteer_coordinator" />
                </Form.Item>
              </Col>
            )}
            <Col span={24} lg={isNew ? 8 : 12}>
              <Form.Item
                name="name"
                label="Display name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input placeholder="Volunteer Coordinator" />
              </Form.Item>
            </Col>
            <Col span={24} lg={isNew ? 8 : 12}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={1} placeholder="Optional description" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0 24px 0' }} />

          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Role Permissions</h3>
          
          <Form.Item
            name="permissionSlugs"
            rules={[{ required: !isAdminRole, message: 'Select at least one permission' }]}
            extra={isAdminRole ? 'The admin role always has every permission.' : undefined}
          >
            <PermissionPicker grouped={grouped} disabled={isAdminRole} />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
