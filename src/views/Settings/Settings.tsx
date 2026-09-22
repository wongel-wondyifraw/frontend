'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, Form, message, Modal } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import { UserOutlined, LockOutlined, TeamOutlined, DeleteOutlined, BellOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { getProfile, updateProfile, getUsers, createUser, updateUser, changePassword, deleteUser, uploadAvatar } from '../../services/api';
import { useUser } from '../../context/UserContext';
import type { User } from '@/types';
import { hasPermission } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import ProfileTab from './components/ProfileTab';
import SecurityTab from './components/SecurityTab';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import './Settings.css';

const LocationManagementTab = dynamic(() => import('./components/LocationManagementTab'), { ssr: false });


const NotificationPreferencesTab = dynamic(() => import('./components/NotificationPreferencesTab'), { ssr: false });
const RoleManagementPanel = dynamic(() => import('./components/RoleManagementPanel'), { ssr: false });
const WebsiteManagementTab = dynamic(() => import('./components/WebsiteManagementTab'), { ssr: false });

const ManageUsersTab = dynamic(() => import('./components/ManageUsersTab'), { ssr: false });
const UserWizardModal = dynamic(() => import('./components/UserWizardModal'), { ssr: false });

const { confirm } = Modal;

const Settings = () => {
    const { refreshUser, bumpAvatarVersion, user } = useUser();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [userForm] = Form.useForm();

    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [wizardAvatar, setWizardAvatar] = useState<File | null>(null);
    const [wizardAvatarPreview, setWizardAvatarPreview] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProfile();
            setProfile(data);
        } catch (error) {
            message.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            message.error('Failed to load users list');
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (hasPermission(profile, 'users.read')) {
            loadUsers();
        }
    }, [profile, loadUsers]);

    const handleProfileUpdate = async (values: Record<string, string>) => {
        try {
            setLoading(true);

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

            message.success('Profile updated successfully!');
            await loadProfile();
            await refreshUser();
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to update profile'));
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file: File, userId: string) => {
        if (userId === profile?.id) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            return false;
        }

        try {
            await uploadAvatar(userId, file);
            message.success('Avatar updated successfully!');
            loadUsers();
            return false;
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Avatar upload failed'));
            return false;
        }
    };

    const handlePasswordChange = async (values: Record<string, string>) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('Passwords do not match');
            return;
        }
        try {
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });
            message.success('Password changed successfully!');
            passwordForm.resetFields();
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to change password'));
        }
    };

    const handleUserSubmit = async () => {
        try {
            const values = await userForm.validateFields();
            setLoading(true);

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
                formData.append('is_active', values.is_active);
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
            loadUsers();
        } catch (error: unknown) {
            console.error('Registration Error:', error);
            message.error(getApiErrorMessage(error, 'Operation failed'));
        } finally {
            setLoading(false);
        }
    };

    const next = async () => {
        try {
            if (currentStep === 0) {
                await userForm.validateFields(['first_name', 'last_name']);
            } else if (currentStep === 1) {
                await userForm.validateFields(
                    editingUser ? ['email'] : ['email', 'password'],
                );
            } else if (currentStep === 2) {
                await userForm.validateFields(['role']);
            }
            setCurrentStep(currentStep + 1);
        } catch (error) {
            message.error("Please correct the errors before proceeding.");
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleDeleteUser = (user: User) => {
        confirm({
            title: 'Delete User?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete ${user.first_name} ${user.last_name}? this action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteUser(user.id);
                    message.success('User deleted successfully');
                    loadUsers();
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to delete user'));
                }
            },
        });
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await updateUser(user.id, { is_active: !user.is_active });
            message.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
            loadUsers();
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to update status'));
        }
    };

    const openUserModal = (user: User | null = null) => {
        setEditingUser(user);
        setCurrentStep(0);
        setWizardAvatar(null);
        setWizardAvatarPreview(null);
        setIsModalVisible(true);
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
        setCurrentStep(0);
    };

    const items = [
        {
            key: '1',
            label: <span><UserOutlined /> Profile</span>,
            children: (
                <ProfileTab
                    form={form}
                    loading={loading}
                    profile={profile}
                    avatarPreview={avatarPreview}
                    onProfileUpdate={handleProfileUpdate}
                    onAvatarUpload={handleAvatarUpload}
                />
            ),
        },
        {
            key: '2',
            label: <span><LockOutlined /> Security</span>,
            children: (
                <SecurityTab
                    passwordForm={passwordForm}
                    onPasswordChange={handlePasswordChange}
                />
            ),
        },
    ];

    if (hasPermission(user, 'notifications.update')) {
        items.push({
            key: '3',
            label: <span><BellOutlined /> Notifications</span>,
            children: <NotificationPreferencesTab />,
        });
    }

    if (hasPermission(user, 'locations.read') || hasPermission(user, 'locations.manage')) {
        // Use an icon like 'EnvironmentOutlined' but I don't have it imported. Let's just use string label or import it.
        // I will just use string label for simplicity if I can't import easily.
        items.push({
            key: 'locations',
            label: <span>Locations</span>,
            children: <LocationManagementTab />,
        });
    }

    if (hasPermission(user, 'roles.read')) {
        items.push({
            key: 'roles',
            label: <span><SafetyCertificateOutlined /> Roles & Permissions</span>,
            children: <RoleManagementPanel />,
        });
    }

    if (hasPermission(user, 'website.manage') || hasPermission(user, 'projects.manage')) {
        items.push({
            key: 'website',
            label: <span>Website UI</span>,
            children: <WebsiteManagementTab />,
        });
    }

    if (hasPermission(profile, 'users.manage')) {
        items.push({
            key: 'ADMIN',
            label: <span><TeamOutlined /> Manage Users</span>,
            children: (
                <ManageUsersTab
                    users={users}
                    loading={loading}
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
                />
            ),
        });
    }

    return (
        <PermissionGate permission="settings.read" pageLabel="Settings">
        <>
            <div className="settings-container">
                <div className="settings-header">
                    <h2>Account Settings</h2>
                </div>
                <div className="settings-card">
                    <Tabs defaultActiveKey="1" items={items} />
                </div>
            </div>

            <UserWizardModal
                open={isModalVisible}
                editingUser={editingUser}
                userForm={userForm}
                currentStep={currentStep}
                wizardAvatarPreview={wizardAvatarPreview}
                onCancel={handleModalCancel}
                onNext={next}
                onPrev={prev}
                onSubmit={handleUserSubmit}
                onWizardAvatarChange={handleWizardAvatarChange}
            />
        </>
        </PermissionGate>
    );
};

export default Settings;
