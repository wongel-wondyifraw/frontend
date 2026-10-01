'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, Input, Modal, Tag } from 'antd';
import { message } from '@/lib/app-message';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import DataTable from '@/Components/common/DataTable';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '@/Components/common/TableRowActions';
import PermissionPicker from './PermissionPicker';
import { useCan } from '@/Components/auth/Can';
import {
  createRole,
  deleteRole,
  getPermissionsGrouped,
  getRoles,
  updateRole,
} from '@/services/api';
import type { Permission, Role } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

interface RoleFormValues {
  key?: string;
  name: string;
  description?: string;
  permissionSlugs: string[];
}

const RoleManagementPanel = () => {
  const canManageRoles = useCan('roles.manage');
  const [roles, setRoles] = useState<Role[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formSeed, setFormSeed] = useState<Partial<RoleFormValues> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<RoleFormValues>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, groupedData] = await Promise.all([
        getRoles(),
        getPermissionsGrouped(),
      ]);
      setRoles(rolesData);
      setGrouped(groupedData);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to load roles'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRoles = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q),
    );
  }, [roles, searchText]);

  const openCreate = () => {
    setEditingRole(null);
    setFormSeed({ permissionSlugs: [], name: undefined, key: undefined, description: undefined });
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormSeed({
      key: role.key,
      name: role.name,
      description: role.description ?? '',
      permissionSlugs: role.permissions.map((p) => p.slug),
    });
    setModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open && formSeed) {
      form.setFieldsValue(formSeed);
    }
    if (!open) {
      form.resetFields();
      setFormSeed(null);
      setEditingRole(null);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingRole) {
        await updateRole(editingRole.id, {
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
      setModalOpen(false);
      await load();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to save role'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (role: Role) => {
    Modal.confirm({
      title: 'Delete role?',
      content: `Remove "${role.name}" (${role.key})? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteRole(role.id);
          message.success('Role deleted');
          await load();
        } catch (error) {
          message.error(getApiErrorMessage(error, 'Failed to delete role'));
        }
      },
    });
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'Role',
      key: 'name',
      render: (_: unknown, record: Role) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{record.key}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      width: 120,
      responsive: ['sm'],
      render: (_: unknown, record: Role) =>
        record.is_system ? <Tag color="blue">System</Tag> : <Tag>Custom</Tag>,
    },
    {
      title: 'Permissions',
      key: 'permissions',
      responsive: ['md'],
      render: (_: unknown, record: Role) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {record.key === 'admin'
            ? 'All permissions'
            : `${record.permissions.length} permission(s)`}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      responsive: ['lg'],
      render: (desc: string | null | undefined) => desc || '—',
    },
    {
      title: 'Actions',
            key: 'actions',
            ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: Role) =>
        canManageRoles ? (
          <TableRowActions
            ariaLabel={`Actions for ${record.name}`}
            items={[
              {
                key: 'edit',
                label: 'Edit role',
                icon: <EditOutlined />,
                onClick: () => openEdit(record),
              },
              ...(!record.is_system
                ? [{
                    key: 'delete',
                    label: 'Delete role',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDelete(record),
                  }]
                : []),
            ]}
          />
        ) : null,
    },
  ];

  const isAdminRole = editingRole?.key === 'admin';

  return (
    <div className="manage-page settings-section--wide">
      <DataTable
        title="Roles"
        subtitle="Configure permission sets that control what each user can do."
        columns={columns}
        dataSource={filteredRoles}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search roles..."
        searchValue={searchText}
        onSearchChange={setSearchText}
        actionButton={
          canManageRoles
            ? { label: 'Add Role', icon: <PlusOutlined />, onClick: openCreate }
            : undefined
        }
        tableCardClassName="data-table-card"
      />

      <Modal
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined />
            {editingRole ? `Edit ${editingRole.name}` : 'Create role'}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editingRole ? 'Save changes' : 'Create role'}
        width={720}
        destroyOnHidden
        afterOpenChange={handleModalOpenChange}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} preserve={false}>
          {!editingRole && (
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
          )}
          <Form.Item
            name="name"
            label="Display name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Volunteer Coordinator" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
          <Form.Item
            name="permissionSlugs"
            label="Permissions"
            rules={[{ required: !isAdminRole, message: 'Select at least one permission' }]}
            extra={isAdminRole ? 'The admin role always has every permission.' : undefined}
          >
            <PermissionPicker grouped={grouped} disabled={isAdminRole} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagementPanel;
