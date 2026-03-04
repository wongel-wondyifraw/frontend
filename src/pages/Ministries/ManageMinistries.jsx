import React from 'react';
import { Table, Tag, Button, Input, Avatar } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import './ManageMinistries.css';

const ManageMinistries = () => {
    const navigate = useNavigate();

    // Sample Data
    const dataSource = [
        {
            key: '1',
            name: 'Worship Team',
            leader: 'David Miller',
            members: 45,
            status: 'Active',
            meetingDay: 'Thursday',
        },
        {
            key: '2',
            name: 'Youth Ministry',
            leader: 'Sarah Jenkins',
            members: 120,
            status: 'Active',
            meetingDay: 'Friday',
        },
        {
            key: '3',
            name: 'Outreach Program',
            leader: 'James Wilson',
            members: 30,
            status: 'Inactive',
            meetingDay: 'Saturday',
        },
        {
            key: '4',
            name: 'Kids Church',
            leader: 'Emily Chen',
            members: 85,
            status: 'Active',
            meetingDay: 'Sunday',
        },
        {
            key: '5',
            name: 'Tech Team',
            leader: 'Mike Ross',
            members: 15,
            status: 'Active',
            meetingDay: 'Wednesday',
        },
    ];

    const columns = [
        {
            title: 'Ministry Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#7b1fa2' }} />
                    <span style={{ fontWeight: 500 }}>{text}</span>
                </div>
            ),
        },
        {
            title: 'Leader',
            dataIndex: 'leader',
            key: 'leader',
        },
        {
            title: 'Members',
            dataIndex: 'members',
            key: 'members',
            render: (count) => (
                <Tag color="purple">{count} Members</Tag>
            ),
        },
        {
            title: 'Meeting Day',
            dataIndex: 'meetingDay',
            key: 'meetingDay',
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status) => {
                let color = status === 'Active' ? '#10b981' : '#ef4444';
                return (
                    <Tag color={color} key={status} style={{ borderRadius: '20px', padding: '0 12px', fontWeight: 600 }}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                        icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                        onClick={() => navigate(`/ministries/details/${record.key}`)}
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
            <div className="manage-ministries-header">
                <h2>Manage Ministries</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Input
                        placeholder="Search ministries..."
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        style={{ width: '250px', borderRadius: '8px' }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1565c0', borderRadius: '8px' }} onClick={() => navigate('/ministries/add')}>
                        Add Ministry
                    </Button>
                </div>
            </div>

            <div className="ministries-table-card">
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={{ pageSize: 7 }}
                />
            </div>
        </DashboardLayout>
    );
};

export default ManageMinistries;
