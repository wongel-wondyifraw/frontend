import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Button, Switch, Avatar, Upload, message, Table, Modal, Tag, Tooltip, Select, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, BellOutlined, UploadOutlined, TeamOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getProfile, updateProfile, getUsers, createUser, updateUser, changePassword, deleteUser, uploadAvatar, API_BASE_URL } from '../../services/api';
import { useUser } from '../../context/UserContext';
import './Settings.css';

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const Settings = () => {
    const { user: currentUser, refreshUser } = useUser();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [userForm] = Form.useForm();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Filter & Search State
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

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

    // Update Profile
    const handleProfileUpdate = async (values) => {
        try {
            await updateProfile({
                first_name: values.firstName,
                middle_name: values.middleName,
                last_name: values.lastName,
            });
            message.success('Profile updated successfully!');
            loadProfile();
            refreshUser();
        } catch (error) {
            message.error('Failed to update profile');
        }
    };

    // Avatar Upload Logic
    const handleAvatarUpload = async (file, userId) => {
        try {
            await uploadAvatar(userId, file);
            message.success('Avatar updated successfully!');
            if (userId === profile?.id) {
                loadProfile();
                refreshUser();
            } else {
                loadUsers();
            }
            return false; // Prevent default upload
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
    const handleUserSubmit = async (values) => {
        try {
            if (editingUser) {
                await updateUser(editingUser.id, {
                    email: values.email,
                    role: values.role,
                    is_active: values.is_active,
                    first_name: values.first_name,
                    last_name: values.last_name,
                    middle_name: values.middle_name,
                });
                message.success('User updated successfully');
            } else {
                await createUser({
                    ...values,
                    password_hash: values.password,
                });
                message.success('User created successfully');
            }
            setIsModalVisible(false);
            setEditingUser(null);
            userForm.resetFields();
            loadUsers();
        } catch (error) {
            message.error(error.message || 'Operation failed');
        }
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
        if (user) {
            userForm.setFieldsValue(user);
        } else {
            userForm.resetFields();
        }
        setIsModalVisible(true);
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
                        src={record.avatar_url ? `${API_BASE_URL}${record.avatar_url}` : null}
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
                            <Form layout="vertical" form={form} onFinish={handleProfileUpdate}>
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
                                            <Input disabled addonAfter={<LockOutlined />} />
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
                                src={profile?.avatar_url ? `${API_BASE_URL}${profile.avatar_url}` : null}
                                style={{
                                    border: '4px solid var(--border-color)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    marginBottom: '24px',
                                    backgroundColor: 'var(--bg-hover)',
                                    color: 'var(--primary-blue)'
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
                    <Form layout="vertical" form={passwordForm} onFinish={handlePasswordChange}>
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
                    <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <h3>All Users</h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search users..."
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 200 }}
                            />
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
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openUserModal()} style={{ background: '#1565c0' }}>
                                Add User
                            </Button>
                        </div>
                    </div>
                    <Table
                        dataSource={getFilteredUsers()}
                        columns={userColumns}
                        rowKey="id"
                        loading={users.length === 0 && loading}
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 800 }}
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

            {/* Admin User Modal */}
            <Modal
                title={editingUser ? "Edit User" : "Add New User"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={userForm} layout="vertical" onFinish={handleUserSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Middle Name" name="middle_name">
                            <Input />
                        </Form.Item>
                    </div>
                    <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item label="Password" name="password" rules={[{ required: true, min: 6 }]}>
                            <Input.Password placeholder="Set initial password" />
                        </Form.Item>
                    )}

                    <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                        <Select>
                            <Option value="admin">Admin</Option>
                            <Option value="minister">Minister</Option>
                            <Option value="staff">Staff</Option>
                            <Option value="member">Member</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Status" name="is_active" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block style={{ background: '#1565c0' }}>
                        {editingUser ? "Update User" : "Create User"}
                    </Button>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default Settings;
