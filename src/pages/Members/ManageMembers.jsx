import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Avatar, message, Modal, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMembers, deleteMember, API_BASE_URL } from '../../services/api';
import './ManageMembers.css';

const ManageMembers = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Fetch members on mount
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await getMembers();
            setMembers(data);
        } catch (error) {
            message.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    // Delete handler with confirmation
    const handleDelete = (member) => {
        Modal.confirm({
            title: 'Delete Member?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMember(member.id);
                    message.success('Member deleted successfully');
                    loadMembers();
                } catch (error) {
                    message.error(error.message || 'Failed to delete member');
                }
            },
        });
    };

    // Filter members by search
    const filteredMembers = members.filter(member => {
        const q = searchText.toLowerCase();
        const fullName = `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`.toLowerCase();
        return (
            fullName.includes(q) ||
            member.email?.toLowerCase().includes(q) ||
            member.phone?.toLowerCase().includes(q) ||
            member.address?.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                        icon={<UserOutlined />}
                        src={record.image_url ? `${API_BASE_URL}/${record.image_url.replace(/^\//, '')}` : null}
                        style={{ backgroundColor: '#1565c0' }}
                    />
                    <div>
                        <span style={{ fontWeight: 600 }}>
                            {record.first_name} {record.middle_name ? record.middle_name + ' ' : ''}{record.last_name}
                        </span>
                        {record.email && (
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{record.email}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: phone => phone || '-',
        },
        {
            title: 'Marital Status',
            dataIndex: 'marital_status',
            key: 'marital_status',
            render: status => {
                if (!status) return '-';
                const colorMap = {
                    single: '#3B82F6',
                    married: '#10b981',
                    divorced: '#f59e0b',
                    widowed: '#8b5cf6',
                };
                const color = colorMap[status.toLowerCase()] || '#94A3B8';
                return (
                    <Tag color={color} style={{ borderRadius: '20px', padding: '0 10px', fontWeight: 500 }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status) => {
                const s = (status || 'active').toLowerCase();
                const color = s === 'active' ? '#10b981' : '#ef4444';
                return (
                    <Tag color={color} style={{ borderRadius: '20px', padding: '0 12px', fontWeight: 600 }}>
                        {s.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Joined',
            dataIndex: 'created_at',
            key: 'created_at',
            render: date => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="View Details">
                        <Button
                            icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                            onClick={() => navigate(`/members/details/${record.id}`)}
                        />
                    </Tooltip>
                    <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => navigate(`/members/edit/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            danger
                            size="small"
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
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
                        <Input
                            placeholder="Search members..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1565c0' }} onClick={() => navigate('/members/add')}>
                            Add Member
                        </Button>
                    </div>
                </div>

                <div className="members-table-card">
                    <Table
                        dataSource={filteredMembers}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageMembers;

