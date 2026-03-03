import React from 'react';
import { Table, Tag, Button, Input, Avatar } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import './ManageMembers.css';

const ManageMembers = () => {
    const navigate = useNavigate();
    // Sample Data
    const dataSource = [
        {
            key: '1',
            name: 'Michael Scott',
            role: 'Head Minister',
            status: 'Active',
            email: 'michael@dundermifflin.com',
            joined: '2023-01-15',
        },
        {
            key: '2',
            name: 'Dwight Schrute',
            role: 'Assistant Minister',
            status: 'Active',
            email: 'dwight@dundermifflin.com',
            joined: '2023-02-20',
        },
        {
            key: '3',
            name: 'Jim Halpert',
            role: 'Member',
            status: 'Inactive',
            email: 'jim@dundermifflin.com',
            joined: '2023-03-10',
        },
    ];

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1565c0' }} />
                    <span style={{ fontWeight: 500 }}>{text}</span>
                </div>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status) => {
                let color = status === 'Active' ? 'green' : 'volcano';
                if (status === 'Active') color = '#10b981'; // Vibrant Green
                if (status === 'Inactive') color = '#ef4444'; // Vibrant Red

                return (
                    <Tag color={color} key={status} style={{ borderRadius: '20px', padding: '0 12px', fontWeight: 600 }}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Joined',
            dataIndex: 'joined',
            key: 'joined',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                        icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                        onClick={() => navigate(`/members/details/${record.key}`)}
                    />
                    <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                    <Button icon={<EditOutlined />} type="text" size="small" />
                    <Button icon={<DeleteOutlined />} type="text" danger size="small" />
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="manage-members-container">
                <div className="manage-members-header">
                    <h2>Manage Members</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Input placeholder="Search members..." prefix={<SearchOutlined />} style={{ width: 250 }} />
                        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1565c0' }} onClick={() => navigate('/members/add')}>
                            Add Member
                        </Button>
                    </div>
                </div>

                <div className="members-table-card">
                    <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 5 }} />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageMembers;
