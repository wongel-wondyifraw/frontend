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
import { getAvatarUrl } from '@/lib/media-url';
import type { User } from '@/types';

const { Option } = Select;

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
}: ManageUsersTabProps) => {
    const filteredUsers = useMemo(() => {
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
    }, [users, searchText, roleFilter, statusFilter]);

    const userColumns: ColumnsType<User> = useMemo(() => [
        {
            title: 'Image',
            key: 'avatar',
            width: 80,
            render: (_: unknown, record: User) => (
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                    <Avatar
                        src={getAvatarUrl(record.avatar_url)}
                        icon={<UserOutlined />}
                        size={40}
                    />
                    <Upload
                        showUploadList={false}
                        beforeUpload={(file) => onAvatarUpload(file, record.id)}
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
            render: (role: string) => <Tag color={role === 'admin' ? 'blue' : 'green'}>{role.toUpperCase()}</Tag>
        },
        { title: 'Title', dataIndex: 'title', key: 'title', render: (title: string | null) => title || '-' },
        {
            title: 'Reg. Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string | undefined) => date ? new Date(date).toLocaleDateString() : '-'
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean | undefined) => <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: User) => (
                <div style={{ display: 'flex', gap: '4px' }}>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => onEditUser(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
                        <Button
                            type="text"
                            icon={record.is_active ? <StopOutlined style={{ color: '#faad14' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => onToggleStatus(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDeleteUser(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ], [onAvatarUpload, onEditUser, onToggleStatus, onDeleteUser]);

    return (
        <div className="settings-section" style={{ maxWidth: '100%' }}>
            <DataTable
                title="All Users"
                columns={userColumns}
                dataSource={filteredUsers}
                loading={users.length === 0 && loading}
                rowKey="id"
                searchPlaceholder="Search users..."
                searchValue={searchText}
                onSearchChange={onSearchChange}
                pageSize={5}
                scroll={{ x: 800 }}
                actionButton={{
                    label: 'Add User',
                    icon: <PlusOutlined />,
                    onClick: onAddUser,
                }}
                extraFilters={
                    <>
                        <Select defaultValue="all" style={{ width: 120 }} onChange={onRoleFilterChange}>
                            <Option value="all">All Roles</Option>
                            <Option value="admin">Admin</Option>
                            <Option value="minister">Minister</Option>
                            <Option value="staff">Staff</Option>
                            <Option value="member">Member</Option>
                        </Select>
                        <Select defaultValue="all" style={{ width: 120 }} onChange={onStatusFilterChange}>
                            <Option value="all">All Status</Option>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </>
                }
            />
        </div>
    );
};

export default ManageUsersTab;
