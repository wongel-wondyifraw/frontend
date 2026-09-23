'use client';
import React, { useMemo } from 'react';
import { Avatar, Upload, Button, Tag, Tooltip, Select } from 'antd';
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
import { getAvatarUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
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
        render: (_: unknown, record: User) =>
          canManage ? (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <Tooltip title="Edit">
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEditUser(record)} />
              </Tooltip>
              <Tooltip title={record.is_active ? 'Deactivate' : 'Activate'}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    record.is_active ? (
                      <StopOutlined style={{ color: '#faad14' }} />
                    ) : (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    )
                  }
                  onClick={() => onToggleStatus(record)}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDeleteUser(record)}
                />
              </Tooltip>
            </div>
          ) : null,
      },
    ],
    [canManage, onAvatarUpload, onEditUser, onToggleStatus, onDeleteUser],
  );

  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="manage-page settings-section--wide">
      <DataTable
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
