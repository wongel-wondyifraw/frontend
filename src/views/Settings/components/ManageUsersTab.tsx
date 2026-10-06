'use client';
import React, { useMemo } from 'react';
import { Avatar, Upload, Button, Tag, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import DataTable from '@/Components/common/DataTable';
import DataTableFilterPopup from '@/Components/common/DataTableFilterPopup';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '@/Components/common/TableRowActions';
import { getAvatarUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import type { User } from '@/types';

interface ManageUsersTabProps {
  users: User[];
  loading: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onAvatarUpload: (file: File, userId: string) => boolean | Promise<boolean>;
  canManage?: boolean;
  avatarUploading?: boolean;
  avatarUploadPercent?: number;
}

const ManageUsersTab = ({
  users,
  loading,
  searchText,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onAvatarUpload,
  canManage = true,
  avatarUploading,
  avatarUploadPercent = 0,
}: ManageUsersTabProps) => {
  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.first_name?.toLowerCase().includes(q) ||
        user.last_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.title?.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? user.is_active : !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchText, roleFilter, statusFilter]);

  const userColumns: ColumnsType<User> = useMemo(
    () => [
      {
        title: 'User',
        key: 'user',
        render: (_: unknown, record: User) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
              <Avatar src={getAvatarUrl(record.avatar_url)} size={40}>
                {getInitials(record.first_name, record.last_name) || <UserOutlined />}
              </Avatar>
              {canManage && (
                <Upload
                  showUploadList={false}
                  accept="image/jpeg,image/png,image/webp"
                  beforeUpload={(file) => onAvatarUpload(file, record.id)}
                >
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<PlusOutlined style={{ fontSize: 10 }} />}
                    size="small"
                    aria-label="Upload avatar"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      minWidth: 18,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </Upload>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>
                {[record.first_name, record.last_name].filter(Boolean).join(' ') || '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{record.email}</div>
            </div>
          </div>
        ),
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        responsive: ['sm'],
        render: (role: string) => (
          <Tag color={role === 'admin' ? 'blue' : 'default'}>{role?.toUpperCase()}</Tag>
        ),
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        responsive: ['md'],
        render: (title: string | null) => title || '—',
      },
      {
        title: 'Registered',
        dataIndex: 'created_at',
        key: 'created_at',
        responsive: ['lg'],
        render: (date: string | undefined) => (date ? new Date(date).toLocaleDateString() : '—'),
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (isActive: boolean | undefined) => (
          <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
        ),
      },
      {
        title: 'Actions',
            key: 'actions',
            ...TABLE_ACTIONS_COLUMN,
        render: (_: unknown, record: User) =>
          canManage ? (
            <TableRowActions
              ariaLabel={`Actions for ${record.first_name || 'user'}`}
              items={[
                {
                  key: 'edit',
                  label: 'Edit',
                  icon: <EditOutlined />,
                  onClick: () => onEditUser(record),
                },
                {
                  key: 'toggle-status',
                  label: record.is_active ? 'Deactivate' : 'Activate',
                  icon: record.is_active ? (
                    <StopOutlined style={{ color: '#faad14' }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ),
                  onClick: () => onToggleStatus(record),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => onDeleteUser(record),
                },
              ]}
            />
          ) : null,
      },
    ],
    [canManage, onAvatarUpload, onEditUser, onToggleStatus, onDeleteUser],
  );

  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="manage-page settings-section--wide">
      <UploadProgressBar active={Boolean(avatarUploading)} percent={avatarUploadPercent} />
      <DataTable
        title="Users"
        subtitle="Create accounts and control who can access the system."
        columns={userColumns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search users..."
        searchValue={searchText}
        onSearchChange={onSearchChange}
        pageSize={10}
        actionButton={
          canManage
            ? {
                label: 'Add User',
                icon: <PlusOutlined />,
                onClick: onAddUser,
              }
            : undefined
        }
        filterPanel={
          <DataTableFilterPopup
            activeCount={activeFilterCount}
            onClear={() => {
              onRoleFilterChange('all');
              onStatusFilterChange('all');
            }}
          >
            <div className="dt-filter-field">
              <span className="dt-filter-label">Role</span>
              <Select
                value={roleFilter}
                onChange={onRoleFilterChange}
                options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'minister', label: 'Minister' },
                  { value: 'staff', label: 'Staff' },
                  { value: 'member', label: 'Member' },
                ]}
              />
            </div>
            <div className="dt-filter-field">
              <span className="dt-filter-label">Status</span>
              <Select
                value={statusFilter}
                onChange={onStatusFilterChange}
                options={[
                  { value: 'all', label: 'All status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </DataTableFilterPopup>
        }
        tableCardClassName="data-table-card"
      />
    </div>
  );
};

export default ManageUsersTab;
