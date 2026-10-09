'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, Form, App } from 'antd';
import { message } from '@/lib/app-message';
import {
  UserOutlined,
  LockOutlined,
  TeamOutlined,
  DeleteOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import {
  getProfile,
  updateProfile,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  forceLogoutUser,
  adminResetUserPassword,
} from '../../services/api';
import { useUser } from '../../context/UserContext';
import type { User, PaginatedResponse } from '@/types';
import { hasPermission } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import ProfileTab from './components/ProfileTab';
import SecurityTab from './components/SecurityTab';
import type { UserWizardValues } from './components/UserWizardModal';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import './Settings.css';

const LocationManagementTab = dynamic(() => import('./components/LocationManagementTab'), {
  ssr: false,
});
const NotificationPreferencesTab = dynamic(
  () => import('./components/NotificationPreferencesTab'),
  { ssr: false },
);
const RoleManagementPanel = dynamic(() => import('./components/RoleManagementPanel'), {
  ssr: false,
});
const ManageUsersTab = dynamic(() => import('./components/ManageUsersTab'), { ssr: false });
const UserWizardModal = dynamic(() => import('./components/UserWizardModal'), { ssr: false });

const Settings = () => {
  const { refreshUser, bumpAvatarVersion, user } = useUser();
  const [form] = Form.useForm();
  const { modal } = App.useApp();

  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [usersPage, setUsersPage] = useState<PaginatedResponse<User> | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);

  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 10 });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploadPercent, setAvatarUploadPercent] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const canManageUsers =
    hasPermission(user, 'users.manage') || hasPermission(profile, 'users.manage');
  const canReadUsers =
    hasPermission(user, 'users.read') || hasPermission(profile, 'users.read') || canManageUsers;

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch {
      message.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await getUsers({
        page: usersPagination.page,
        limit: usersPagination.limit,
        search: searchText,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        origin: originFilter !== 'all' ? originFilter : undefined,
      });
      setUsersPage(data);
    } catch {
      message.error('Failed to load users list');
    } finally {
      setUsersLoading(false);
    }
  }, [usersPagination.page, usersPagination.limit, searchText, roleFilter, statusFilter, originFilter]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (canReadUsers) {
      loadUsers();
    }
  }, [canReadUsers, loadUsers]);

  const handleProfileUpdate = async (values: Record<string, string>) => {
    try {
      setProfileLoading(true);

      if (avatarFile && profile?.id) {
        setAvatarUploading(true);
        await uploadAvatar(profile.id, avatarFile, setAvatarUploadPercent);
        setAvatarFile(null);
        bumpAvatarVersion();
        setAvatarUploading(false);
      }

      await updateProfile({
        first_name: values.firstName,
        middle_name: values.middleName,
        last_name: values.lastName,
      });

      message.success('Profile updated successfully');
      await loadProfile();
      await refreshUser();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update profile'));
    } finally {
      setProfileLoading(false);
      setAvatarUploading(false);
    }
  };

  const handleAvatarUpload = async (file: File, userId: string) => {
    if (!userId) return false;

    if (userId === profile?.id) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      return false;
    }

    try {
      setAvatarUploading(true);
      setAvatarUploadPercent(0);
      await uploadAvatar(userId, file, setAvatarUploadPercent);
      message.success('Avatar updated successfully');
      loadUsers();
      return false;
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Avatar upload failed'));
      return false;
    } finally {
      setAvatarUploading(false);
    }
  };


  const handleUserSubmit = async (values: UserWizardValues, avatarFile: File | null) => {
    try {
      setUserSubmitting(true);

      if (editingUser) {
        await updateUser(editingUser.id, {
          ...values,
          first_name: values.first_name,
          last_name: values.last_name,
          middle_name: values.middle_name,
          title: values.title,
        });
        if (avatarFile) {
          setAvatarUploading(true);
          setAvatarUploadPercent(0);
          await uploadAvatar(editingUser.id, avatarFile, setAvatarUploadPercent);
        }
        message.success('User updated successfully');
      } else {
        const formData = new FormData();
        formData.append('first_name', values.first_name);
        formData.append('last_name', values.last_name);
        formData.append('middle_name', values.middle_name || '');
        formData.append('email', values.email);
        formData.append('password_hash', values.password ?? '');
        formData.append('role', values.role);
        formData.append('is_active', String(values.is_active ?? true));
        if (values.title) formData.append('title', values.title);
        if (avatarFile) formData.append('avatar', avatarFile);

        setAvatarUploading(Boolean(avatarFile));
        setAvatarUploadPercent(0);
        await createUser(formData, setAvatarUploadPercent);
        message.success('User registered successfully');
      }

      setIsModalVisible(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Operation failed'));
    } finally {
      setUserSubmitting(false);
      setAvatarUploading(false);
    }
  };

  const handleDeleteUser = (target: User) => {
    modal.confirm({
      title: 'Delete user?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete ${target.first_name} ${target.last_name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteUser(target.id);
          message.success('User deleted successfully');
          loadUsers();
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete user'));
        }
      },
    });
  };

  const handleToggleStatus = async (target: User) => {
    try {
      await updateUser(target.id, { is_active: !target.is_active });
      message.success(`User ${target.is_active ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update status'));
    }
  };

  const openUserModal = (target: User | null = null) => {
    setEditingUser(target);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const tabLabel = (icon: React.ReactNode, text: string) => (
    <span className="settings-tab-label">
      {icon}
      <span className="settings-tab-label-text"> {text}</span>
    </span>
  );

  const items = [
    {
      key: 'profile',
      label: tabLabel(<UserOutlined />, 'Profile'),
      children: (
        <ProfileTab
          form={form}
          loading={profileLoading}
          profile={profile}
          avatarPreview={avatarPreview}
          onProfileUpdate={handleProfileUpdate}
          onAvatarUpload={handleAvatarUpload}
          avatarUploading={avatarUploading}
          avatarUploadPercent={avatarUploadPercent}
        />
      ),
    },
    {
      key: 'security',
      label: tabLabel(<LockOutlined />, 'Security'),
      children: (
        <SecurityTab />
      ),
    },
  ];

  if (hasPermission(user, 'notifications.update') || hasPermission(profile, 'notifications.update')) {
    items.push({
      key: 'notifications',
      label: tabLabel(<BellOutlined />, 'Notifications'),
      children: <NotificationPreferencesTab />,
    });
  }

  if (
    hasPermission(user, 'locations.read') ||
    hasPermission(user, 'locations.manage') ||
    hasPermission(profile, 'locations.read') ||
    hasPermission(profile, 'locations.manage')
  ) {
    items.push({
      key: 'locations',
      label: tabLabel(<EnvironmentOutlined />, 'Locations'),
      children: <LocationManagementTab />,
    });
  }

  if (hasPermission(user, 'roles.read') || hasPermission(profile, 'roles.read')) {
    items.push({
      key: 'roles',
      label: tabLabel(<SafetyCertificateOutlined />, 'Roles'),
      children: <RoleManagementPanel />,
    });
  }

  if (canManageUsers || canReadUsers) {
    items.push({
      key: 'users',
      label: tabLabel(<TeamOutlined />, 'Users'),
      children: (
        <ManageUsersTab
          usersPage={usersPage}
          loading={usersLoading}
          searchText={searchText}
          onSearchChange={(v) => { setSearchText(v); setUsersPagination(p => ({ ...p, page: 1 })); }}
          roleFilter={roleFilter}
          onRoleFilterChange={(v) => { setRoleFilter(v); setUsersPagination(p => ({ ...p, page: 1 })); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => { setStatusFilter(v); setUsersPagination(p => ({ ...p, page: 1 })); }}
          originFilter={originFilter}
          onOriginFilterChange={(v) => { setOriginFilter(v); setUsersPagination(p => ({ ...p, page: 1 })); }}
          onPageChange={(page, limit) => setUsersPagination({ page, limit })}
          onAddUser={() => openUserModal()}
          onEditUser={openUserModal}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          onAvatarUpload={handleAvatarUpload}
          onAdminResetPassword={async (u) => {
            try {
              const res = await adminResetUserPassword(u.id);
              modal.success({ title: 'Password Reset', content: `New temporary password: ${res.temporary_password}` });
              loadUsers();
            } catch (err) {
              message.error(getApiErrorMessage(err, 'Failed to reset password'));
            }
          }}
          onForceLogout={async (u) => {
            try {
              await forceLogoutUser(u.id);
              message.success('User sessions revoked');
            } catch (err) {
              message.error(getApiErrorMessage(err, 'Failed to revoke sessions'));
            }
          }}
          onUnlock={async (u) => {
            try {
              await updateUser(u.id, { locked_until: null, failed_login_attempts: 0 });
              message.success('User unlocked successfully');
              loadUsers();
            } catch (err) {
              message.error(getApiErrorMessage(err, 'Failed to unlock user'));
            }
          }}
          onAnonymizeUser={async (u) => {
            modal.confirm({
              title: 'Anonymize User?',
              content: `Are you sure you want to anonymize and erase data for ${u.first_name}? This action cannot be undone.`,
              okText: 'Anonymize',
              okType: 'danger',
              onOk: async () => {
                try {
                  const { anonymizeUser } = await import('@/services/api');
                  await anonymizeUser(u.id);
                  message.success('User anonymized successfully');
                  loadUsers();
                } catch (err) {
                  message.error(getApiErrorMessage(err, 'Failed to anonymize user'));
                }
              }
            });
          }}
          avatarUploading={avatarUploading}
          avatarUploadPercent={avatarUploadPercent}
          canManage={canManageUsers}
        />
      ),
    });
  }

  return (
    <PermissionGate permission="settings.read" pageLabel="Settings">
      <div className="settings-page">
        <div className="settings-header">
          <div className="settings-header-text">
            <h2>Settings</h2>
            <p>Manage your account, security, and system configuration.</p>
          </div>
        </div>

        <Tabs className="settings-tabs" defaultActiveKey="profile" items={items} />

        <UserWizardModal
          open={isModalVisible}
          editingUser={editingUser}
          submitting={userSubmitting}
          onCancel={handleModalCancel}
          onSubmit={handleUserSubmit}
          uploadingAvatar={avatarUploading}
          uploadPercent={avatarUploadPercent}
        />
      </div>
    </PermissionGate>
  );
};

export default Settings;
