'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tag, Modal } from 'antd';
import { message } from '@/lib/app-message';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import DataTable from '@/Components/common/DataTable';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '@/Components/common/TableRowActions';
import { useCan } from '@/Components/auth/Can';
import { useRouter } from 'next/navigation';
import {
  deleteRole,
  getRoles,
} from '@/services/api';
import type { Role } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const RoleManagementPanel = () => {
  const canManageRoles = useCan('roles.manage');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rolesData = await getRoles();
      setRoles(rolesData);
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
    router.push('/settings/roles/create');
  };

  const openEdit = (role: Role) => {
    router.push(`/settings/roles/${role.id}`);
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
    </div>
  );
};

export default RoleManagementPanel;
