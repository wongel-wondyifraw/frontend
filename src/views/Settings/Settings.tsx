'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, Form, Modal } from 'antd';
import { message } from '@/lib/app-message';
import type { UploadChangeParam } from 'antd/es/upload';
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
  changePassword,
  deleteUser,
  uploadAvatar,
} from '../../services/api';
import { useUser } from '../../context/UserContext';
import type { User } from '@/types';
import { hasPermission } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import ProfileTab from './components/ProfileTab';
import SecurityTab from './components/SecurityTab';
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
  const [passwordForm] = Form.useForm();
  const [userForm] = Form.useForm();

  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormSeed, setUserFormSeed] = useState<Record<string, unknown> | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [wizardAvatar, setWizardAvatar] = useState<File | null>(null);
  const [wizardAvatarPreview, setWizardAvatarPreview] = useState<string | null>(null);

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
      const data = await getUsers();
      setUsers(data);
    } catch {
      message.error('Failed to load users list');
    } finally {
      setUsersLoading(false);
    }
  }, []);

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
        await uploadAvatar(profile.id, avatarFile);
        setAvatarFile(null);
        bumpAvatarVersion();
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
      await uploadAvatar(userId, file);
      message.success('Avatar updated successfully');
      loadUsers();
      return false;
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Avatar upload failed'));
      return false;
    }
  };

  const handlePasswordChange = async (values: Record<string, string>) => {
    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to change password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUserSubmit = async () => {
    try {
      const values = await userForm.validateFields();
      setUserSubmitting(true);

      if (editingUser) {
        await updateUser(editingUser.id, {
          ...values,
          first_name: values.first_name,
          last_name: values.last_name,
          middle_name: values.middle_name,
          title: values.title,
        });
        message.success('User updated successfully');
      } else {
        const formData = new FormData();
        formData.append('first_name', values.first_name);
        formData.append('last_name', values.last_name);
        formData.append('middle_name', values.middle_name || '');
        formData.append('email', values.email);
        formData.append('password_hash', values.password);
        formData.append('role', values.role);
        formData.append('is_active', String(values.is_active ?? true));
        if (values.title) formData.append('title', values.title);
        if (wizardAvatar) formData.append('avatar', wizardAvatar);

        await createUser(formData);
        message.success('User registered successfully');
      }

      setIsModalVisible(false);
      setEditingUser(null);
      setCurrentStep(0);
      setWizardAvatar(null);
      setWizardAvatarPreview(null);
      setUserFormSeed(null);
      loadUsers();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Operation failed'));
    } finally {
      setUserSubmitting(false);
    }
  };

  const next = async () => {
    try {
      if (currentStep === 0) {
        await userForm.validateFields(['first_name', 'last_name']);
      } else if (currentStep === 1) {
        await userForm.validateFields(editingUser ? ['email'] : ['email', 'password']);
      } else if (currentStep === 2) {
        await userForm.validateFields(['role']);
        const role = userForm.getFieldValue('role');
        if (role === 'minister' || role === 'staff') {
          await userForm.validateFields(['title']);
        }
      }
      setCurrentStep((step) => step + 1);
    } catch {
      message.error('Please correct the errors before continuing.');
    }
  };

  const prev = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleDeleteUser = (target: User) => {
    Modal.confirm({
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
    setCurrentStep(0);
    setWizardAvatar(null);
    setWizardAvatarPreview(null);
    setUserFormSeed(
      target
        ? {
            first_name: target.first_name,
            middle_name: target.middle_name,
            last_name: target.last_name,
            email: target.email,
            role: target.role,
            title: target.title,
            is_active: target.is_active !== undefined ? target.is_active : true,
          }
        : { is_active: true },
    );
    setIsModalVisible(true);
  };

  const handleWizardAfterOpenChange = (open: boolean) => {
    if (open && userFormSeed) {
      userForm.setFieldsValue(userFormSeed);
    }
    if (!open) {
      userForm.resetFields();
      setUserFormSeed(null);
      setEditingUser(null);
      setCurrentStep(0);
      setWizardAvatar(null);
      setWizardAvatarPreview(null);
    }
  };

  const handleWizardAvatarChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setWizardAvatar(file as File);
      const reader = new FileReader();
      reader.onload = (e) => setWizardAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file as File);
    }
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
        />
      ),
    },
    {
      key: 'security',
      label: tabLabel(<LockOutlined />, 'Security'),
      children: (
        <SecurityTab
          passwordForm={passwordForm}
          loading={passwordLoading}
          onPasswordChange={handlePasswordChange}
        />
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
          users={users}
          loading={usersLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onAddUser={() => openUserModal()}
          onEditUser={openUserModal}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          onAvatarUpload={handleAvatarUpload}
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
          userForm={userForm}
          currentStep={currentStep}
          wizardAvatarPreview={wizardAvatarPreview}
          submitting={userSubmitting}
          onCancel={handleModalCancel}
          onNext={next}
          onPrev={prev}
          onSubmit={handleUserSubmit}
          onWizardAvatarChange={handleWizardAvatarChange}
          onAfterOpenChange={handleWizardAfterOpenChange}
        />
      </div>
    </PermissionGate>
  );
};

export default Settings;
