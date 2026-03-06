import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Button, Switch, Avatar, Upload, message, Modal, Tag, Tooltip, Select, Row, Col, Space } from 'antd';
import { UserOutlined, LockOutlined, BellOutlined, UploadOutlined, TeamOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, StopOutlined, CheckCircleOutlined, SolutionOutlined, IdcardOutlined } from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import DataTable from '../../Components/common/DataTable';
import { getProfile, updateProfile, getUsers, createUser, updateUser, changePassword, deleteUser, uploadAvatar, API_BASE_URL } from '../../services/api';
import { useUser } from '../../context/UserContext';
import './Settings.css';

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const USER_WIZARD_STEPS = [
    { title: 'Personal' },
    { title: 'Account' },
    { title: 'Role' },
];

const USER_WIZARD_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const Settings = () => {
    const { user: currentUser, refreshUser } = useUser();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [userForm] = Form.useForm();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // New states for deferred avatar upload
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Filter & Search State
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);
    const [wizardAvatar, setWizardAvatar] = useState(null);
    const [wizardAvatarPreview, setWizardAvatarPreview] = useState(null);

    // Fetch Profile on Mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getProfile();
            setProfile(data);
            form.setFieldsValue({
                firstName: data.first_name,
                middleName: data.middle_name,
                lastName: data.last_name,
                email: data.email,
                role: data.role,
                bio: 'Administrator for Kangaroo Inc.',
            });
        } catch (error) {
            message.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    // Admin: Load all users
    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            message.error('Failed to load users list');
        }
    };

    // Update Profile (Includes delayed Avatar upload)
    const handleProfileUpdate = async (values) => {
        try {
            setLoading(true);

            // 1. Upload Avatar if a new one was selected
            if (avatarFile && profile?.id) {
                await uploadAvatar(profile.id, avatarFile);
                setAvatarFile(null); // Clear after upload
            }

            // 2. Update text fields
            await updateProfile({
                first_name: values.firstName,
                middle_name: values.middleName,
                last_name: values.lastName,
            });

            message.success('Profile updated successfully!');
            await loadProfile();
            await refreshUser(); // This ensures Sidebar and Header update instantly
        } catch (error) {
            message.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Avatar Upload Logic (Deferred for main profile, immediate for Admin table)
    const handleAvatarUpload = async (file, userId) => {
        // If it's the current user updating their own profile, defer it
        if (userId === profile?.id) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            return false; // Prevent immediate upload
        }

        // If Admin is uploading someone else's avatar from the table, do it immediately
        try {
            await uploadAvatar(userId, file);
            message.success('Avatar updated successfully!');
            loadUsers();
            return false;
        } catch (error) {
            message.error(error.message || 'Avatar upload failed');
            return false;
        }
    };

    // Change Password (Secure)
    const handlePasswordChange = async (values) => {
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
        } catch (error) {
            message.error(error.message || 'Failed to change password');
        }
    };

    // Admin: Add/Edit User
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
            userForm.resetFields();
            loadUsers();
        } catch (error) {
            console.error('Registration Error:', error);
            message.error(error.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    // Wizard Navigation
    const next = async () => {
        try {
            if (currentStep === 0) {
                await userForm.validateFields(['first_name', 'last_name']);
            } else if (currentStep === 1) {
                await userForm.validateFields(['email', 'password']);
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

    // Admin: Delete User
    const handleDeleteUser = (user) => {
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
                } catch (error) {
                    message.error(error.message || 'Failed to delete user');
                }
            },
        });
    };

    // Admin: Toggle Status
    const handleToggleStatus = async (user) => {
        try {
            await updateUser(user.id, { is_active: !user.is_active });
            message.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
            loadUsers();
        } catch (error) {
            message.error(error.message || 'Failed to update status');
        }
    };

    // Admin: Open Modal
    const openUserModal = (user = null) => {
        setEditingUser(user);
        setCurrentStep(0);
        setWizardAvatar(null);
        setWizardAvatarPreview(null);
        if (user) {
            userForm.setFieldsValue({
                ...user,
                is_active: user.is_active !== undefined ? user.is_active : true
            });
        } else {
            userForm.resetFields();
            userForm.setFieldsValue({ is_active: true });
        }
        setIsModalVisible(true);
    };

    const handleWizardAvatarChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setWizardAvatar(file);
            const reader = new FileReader();
            reader.onload = (e) => setWizardAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    // Filter Logic
    const getFilteredUsers = () => {
        return users.filter(user => {
            const matchesSearch =
                user.first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                user.last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchText.toLowerCase());

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' ? user.is_active : !user.is_active);

            return matchesSearch && matchesRole && matchesStatus;
        });
    };

    // Columns for User Management Table
    const userColumns = [
        {
            title: 'Image',
            key: 'avatar',
            width: 80,
            render: (_, record) => (
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                    <Avatar
                        src={record.avatar_url ? `${API_BASE_URL}/${record.avatar_url.replace(/^\//, '')}?t=${new Date().getTime()}` : null}
                        icon={<UserOutlined />}
                        size={40}
                    />
                    <Upload
                        showUploadList={false}
                        beforeUpload={(file) => handleAvatarUpload(file, record.id)}
                    >
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined style={{ fontSize: '10px' }} />}
                            size="small"
                            style={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                width: 18,
                                height: 18,
                                minWidth: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        />
                    </Upload>
                </div>
            )
        },
        { title: 'First Name', dataIndex: 'first_name', key: 'first_name' },
        { title: 'Last Name', dataIndex: 'last_name', key: 'last_name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: role => <Tag color={role === 'admin' ? 'blue' : 'green'}>{role.toUpperCase()}</Tag>
        },
        { title: 'Title', dataIndex: 'title', key: 'title', render: title => title || '-' },
        {
            title: 'Reg. Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: date => date ? new Date(date).toLocaleDateString() : '-'
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: isActive => <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '4px' }}>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => openUserModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
                        <Button
                            type="text"
                            icon={record.is_active ? <StopOutlined style={{ color: '#faad14' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => handleToggleStatus(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteUser(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    const items = [
        {
            key: '1',
            label: <span><UserOutlined /> Profile</span>,
            children: (
                <div className="settings-section">
                    <Row gutter={[48, 24]}>
                        <Col xs={24} lg={16}>
                            <h3>Personal Information</h3>
                            <Form autoComplete="off" layout="vertical" form={form} onFinish={handleProfileUpdate}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Middle Name" name="middleName">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Email Address" name="email">
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input disabled />
                                                <Button disabled icon={<LockOutlined />} />
                                            </Space.Compact>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item label="Role" name="role">
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="Bio" name="bio">
                                    <TextArea rows={4} />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#1565c0' }}>
                                    Save Changes
                                </Button>
                            </Form>
                        </Col>
                        <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', borderLeft: '1px solid var(--border-color)', minHeight: '300px', paddingTop: '40px' }}>
                            <h3 style={{ marginBottom: '24px' }}>Profile Picture</h3>
                            <Avatar
                                size={160}
                                icon={<UserOutlined />}
                                src={avatarPreview || (profile?.avatar_url ? `${API_BASE_URL}/${profile.avatar_url.replace(/^\//, '')}?t=${new Date().getTime()}` : null)}
                                style={{
                                    border: '4px solid var(--border-color)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    marginBottom: '24px',
                                    backgroundColor: 'var(--bg-hover)',
                                    color: 'var(--primary-blue)',
                                    objectFit: 'cover'
                                }}
                            />
                            <Upload
                                showUploadList={false}
                                beforeUpload={(file) => handleAvatarUpload(file, profile?.id)}
                            >
                                <Button icon={<UploadOutlined />} type="primary" ghost>
                                    Change Photo
                                </Button>
                            </Upload>
                            <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                Allowed JPG or PNG. Max size of 800K
                            </p>
                        </Col>
                    </Row>
                </div>
            ),
        },
        {
            key: '2',
            label: <span><LockOutlined /> Security</span>,
            children: (
                <div className="settings-section">
                    <h3>Change Password</h3>
                    <Form autoComplete="off" layout="vertical" form={passwordForm} onFinish={handlePasswordChange}>
                        <Form.Item
                            label="Current Password"
                            name="currentPassword"
                            rules={[{ required: true, message: 'Please enter current password' }]}
                        >
                            <Input.Password placeholder="Enter your current password" />
                        </Form.Item>
                        <Form.Item label="New Password" name="newPassword" rules={[{ required: true, min: 6 }]}>
                            <Input.Password placeholder="Enter new password" />
                        </Form.Item>
                        <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true, min: 6 }]}>
                            <Input.Password placeholder="Confirm new password" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" style={{ background: '#1565c0' }}>
                            Update Password
                        </Button>
                    </Form>
                </div>
            ),
        },
    ];

    // Conditionally Add "Manage Users" Tab for Admins
    if (profile?.role === 'admin') {
        items.push({
            key: 'ADMIN',
            label: <span><TeamOutlined /> Manage Users</span>,
            children: (
                <div className="settings-section" style={{ maxWidth: '100%' }}>
                    <DataTable
                        title="All Users"
                        columns={userColumns}
                        dataSource={getFilteredUsers()}
                        loading={users.length === 0 && loading}
                        rowKey="id"
                        searchPlaceholder="Search users..."
                        searchValue={searchText}
                        onSearchChange={setSearchText}
                        pageSize={5}
                        scroll={{ x: 800 }}
                        actionButton={{
                            label: 'Add User',
                            icon: <PlusOutlined />,
                            onClick: () => openUserModal(),
                        }}
                        extraFilters={
                            <>
                                <Select defaultValue="all" style={{ width: 120 }} onChange={setRoleFilter}>
                                    <Option value="all">All Roles</Option>
                                    <Option value="admin">Admin</Option>
                                    <Option value="minister">Minister</Option>
                                    <Option value="staff">Staff</Option>
                                    <Option value="member">Member</Option>
                                </Select>
                                <Select defaultValue="all" style={{ width: 120 }} onChange={setStatusFilter}>
                                    <Option value="all">All Status</Option>
                                    <Option value="active">Active</Option>
                                    <Option value="inactive">Inactive</Option>
                                </Select>
                            </>
                        }
                    />
                </div>
            ),
        });
    }

    // Effect to load users if admin
    useEffect(() => {
        if (profile?.role === 'admin') {
            loadUsers();
        }
    }, [profile]);

    return (
        <DashboardLayout>
            <div className="settings-container">
                <div className="settings-header">
                    <h2>Account Settings</h2>
                </div>
                <div className="settings-card">
                    <Tabs defaultActiveKey="1" items={items} />
                </div>
            </div>

            {/* Admin User Wizard Modal */}
            <Modal
                title={editingUser ? "Edit User Registration" : "New User Registration"}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setCurrentStep(0);
                }}
                footer={null}
                width={700}
                centered
            >
                <div style={{ padding: '16px 0' }}>
                    <Form autoComplete="off" form={userForm} layout="vertical" onFinish={handleUserSubmit}>
                        <StepperWizard
                            steps={USER_WIZARD_STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            submitText={editingUser ? "Confirm Update" : "Confirm Registration"}
                            submitLoading={false}
                            stepBackgrounds={USER_WIZARD_BACKGROUNDS}
                            showCancel={false}
                        >
                            {/* STEP 1: Personal Profile */}
                            <div>
                                <h3 style={{ marginBottom: '20px' }}>Personal Profile</h3>
                                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Avatar
                                            size={100}
                                            src={wizardAvatarPreview || (editingUser?.avatar_url ? `${API_BASE_URL}/${editingUser.avatar_url.replace(/^\//, '')}` : null)}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f2f5', border: '2px solid #d9d9d9' }}
                                        />
                                        <div style={{ marginTop: '8px' }}>
                                            <Upload showUploadList={false} beforeUpload={() => false} onChange={handleWizardAvatarChange}>
                                                <Button size="small" icon={<UploadOutlined />}>Upload</Button>
                                            </Upload>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <Form.Item label="First Name" name="first_name" rules={[{ required: true, message: 'First name is required' }]}>
                                                <Input size="large" placeholder="John" />
                                            </Form.Item>
                                            <Form.Item label="Middle Name" name="middle_name">
                                                <Input size="large" placeholder="Optional" />
                                            </Form.Item>
                                        </div>
                                        <Form.Item label="Last Name" name="last_name" rules={[{ required: true, message: 'Last name is required' }]}>
                                            <Input size="large" placeholder="Doe" type="text" />
                                        </Form.Item>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2: Account Setup */}
                            <div>
                                <h3 style={{ marginBottom: '20px' }}>Account Setup</h3>
                                <Form.Item
                                    label="Email Address"
                                    name="email"
                                    rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
                                    extra={<span style={{ color: '#fa8c16', fontSize: '12px' }}>⚠️ Warning: Email cannot be changed later. Please enter carefully.</span>}
                                >
                                    <Input size="large" placeholder="user@example.com" disabled={editingUser} />
                                </Form.Item>

                                {!editingUser && (
                                    <Form.Item label="Temporary Password" name="password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                                        <Input.Password size="large" placeholder="Set initial password" />
                                    </Form.Item>
                                )}
                            </div>

                            {/* STEP 3: Role & Designation */}
                            <div>
                                <h3 style={{ marginBottom: '20px' }}>Role & Designation</h3>
                                <Form.Item label="Select Role" name="role" rules={[{ required: true, message: 'Please assign a role' }]}>
                                    <Select size="large" placeholder="Select an access level">
                                        <Option value="admin">Admin</Option>
                                        <Option value="minister">Minister</Option>
                                        <Option value="staff">Staff</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}>
                                    {({ getFieldValue }) => {
                                        const role = getFieldValue('role');
                                        return (role === 'minister' || role === 'staff') ? (
                                            <Form.Item
                                                label="Title / Designation"
                                                name="title"
                                                rules={[{ required: true, message: 'Title is mandatory for this role' }]}
                                            >
                                                <Input size="large" placeholder="e.g. Senior Pastor, IT Manager" />
                                            </Form.Item>
                                        ) : null;
                                    }}
                                </Form.Item>

                                <Form.Item label="Account Status" name="is_active" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </div>
                        </StepperWizard>
                    </Form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Settings;
