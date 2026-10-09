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
import { useRouter } from 'next/navigation';
import type { User, PaginatedResponse } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ManageUsersTabProps {
  usersPage: PaginatedResponse<User> | null;
  loading: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  originFilter?: string;
  onOriginFilterChange?: (value: string) => void;
  onPageChange: (page: number, limit: number) => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onAvatarUpload: (file: File, userId: string) => boolean | Promise<boolean>;
  onAdminResetPassword?: (user: User) => void;
  onForceLogout?: (user: User) => void;
  onUnlock?: (user: User) => void;
  onAnonymizeUser?: (user: User) => void;
  canManage?: boolean;
  avatarUploading?: boolean;
  avatarUploadPercent?: number;
}

const ManageUsersTab = ({
  usersPage,
  loading,
  searchText,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  originFilter,
  onOriginFilterChange,
  onPageChange,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onAvatarUpload,
  onAnonymizeUser,
  canManage = true,
}: ManageUsersTabProps) => {
  const router = useRouter();
  const users = usersPage?.data || [];

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
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {record.email}
                {record.email_verified_at ? (
                  <Tag color="success" style={{ margin: 0, padding: '0 4px', fontSize: 10, lineHeight: '14px', border: 0 }}>Verified</Tag>
                ) : (
                  <Tag color="warning" style={{ margin: 0, padding: '0 4px', fontSize: 10, lineHeight: '14px', border: 0 }}>Unverified</Tag>
                )}
              </div>
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
        title: 'Origin',
        dataIndex: 'created_via',
        key: 'created_via',
        responsive: ['lg'],
        render: (origin: string | undefined) => {
          if (!origin) return '—';
          const labels: Record<string, string> = {
            admin: 'Admin',
            minister_module: 'Minister Module',
            self_registration: 'Self Reg',
            invite: 'Invite',
          };
          return labels[origin] || origin;
        },
      },
      {
        title: 'Last Login',
        dataIndex: 'last_login_at',
        key: 'last_login_at',
        responsive: ['xl'],
        render: (date: string | undefined) => (date ? dayjs(date).fromNow() : 'Never'),
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (isActive: boolean | undefined, record: User) => {
          if (record.locked_until && new Date(record.locked_until) > new Date()) {
            return <Tag color="error">Locked</Tag>;
          }
          return <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>;
        },
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
                  key: 'view',
                  label: 'View Details',
                  icon: <UserOutlined />,
                  onClick: () => {
                    router.push(`/settings/users/${record.id}`);
                  },
                },
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
                {
                  key: 'anonymize',
                  label: 'Anonymize & Erase (GDPR)',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => onAnonymizeUser?.(record),
                },
              ]}
            />
          ) : null,
      },
    ],
    [canManage, onAvatarUpload, onEditUser, onToggleStatus, onDeleteUser, onAnonymizeUser, router],
  );

  const activeFilterCount =
    (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (originFilter !== 'all' ? 1 : 0);

  return (
    <div className="manage-page settings-section--wide">
      <DataTable
        title="Users"
        subtitle="Create accounts and control who can access the system."
        columns={userColumns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search users..."
        searchValue={searchText}
        onSearchChange={onSearchChange}
        serverPagination={{
          current: usersPage?.page || 1,
          pageSize: usersPage?.limit || 10,
          total: usersPage?.total || 0,
          onChange: onPageChange,
        }}
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
              onOriginFilterChange?.('all');
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
            <div className="dt-filter-field">
              <span className="dt-filter-label">Origin</span>
              <Select
                value={originFilter}
                onChange={onOriginFilterChange}
                options={[
                  { value: 'all', label: 'All origins' },
                  { value: 'admin', label: 'Admin Created' },
                  { value: 'minister_module', label: 'Minister Module' },
                  { value: 'self_registration', label: 'Self Registration' },
                ]}
              />
            </div>
          </DataTableFilterPopup>
        }
        tableCardClassName="data-table-card"
        onRow={(record: User) => ({
          onClick: () => {
            router.push(`/settings/users/${record.id}`);
          },
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
};

export default ManageUsersTab;
