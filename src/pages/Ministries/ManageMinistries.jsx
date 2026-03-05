import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Avatar, message, Modal, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMinistries, deleteMinistry } from '../../services/api';
import './ManageMinistries.css';

const ManageMinistries = () => {
    const navigate = useNavigate();
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Fetch ministries on mount
    useEffect(() => {
        loadMinistries();
    }, []);

    const loadMinistries = async () => {
        try {
            setLoading(true);
            const data = await getMinistries();
            setMinistries(data);
        } catch (error) {
            message.error('Failed to load ministries');
        } finally {
            setLoading(false);
        }
    };

    // Delete handler with confirmation
    const handleDelete = (ministry) => {
        Modal.confirm({
            title: 'Delete Ministry?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete "${ministry.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMinistry(ministry.id);
                    message.success('Ministry deleted successfully');
                    loadMinistries();
                } catch (error) {
                    message.error(error.message || 'Failed to delete ministry');
                }
            },
        });
    };

    // Filter ministries by search
    const filteredMinistries = ministries.filter(ministry => {
        const q = searchText.toLowerCase();
        const leaderName = ministry.leader
            ? `${ministry.leader.first_name || ''} ${ministry.leader.middle_name || ''} ${ministry.leader.last_name || ''}`.toLowerCase()
            : '';
        return (
            ministry.name?.toLowerCase().includes(q) ||
            leaderName.includes(q) ||
            ministry.schedule?.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: 'Ministry Name',
            key: 'name',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#1565c0' }} />
                    <span style={{ fontWeight: 600 }}>{record.name}</span>
                </div>
            ),
        },
        {
            title: 'Leader',
            key: 'leader',
            render: (_, record) => {
                if (record.leader) {
                    return `${record.leader.first_name} ${record.leader.last_name}`;
                }
                return <span style={{ color: '#94A3B8' }}>Not assigned</span>;
            },
        },
        {
            title: 'Schedule',
            dataIndex: 'schedule',
            key: 'schedule',
            render: schedule => schedule || '-',
        },
        {
            title: 'Created',
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
                            onClick={() => navigate(`/ministries/details/${record.id}`)}
                        />
                    </Tooltip>
                    <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => navigate(`/ministries/edit/${record.id}`)}
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
            <div className="manage-ministries-container">
                <div className="manage-ministries-header">
                    <h2>Manage Ministries</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Input
                            placeholder="Search ministries..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1565c0' }} onClick={() => navigate('/ministries/add')}>
                            Add Ministry
                        </Button>
                    </div>
                </div>

                <div className="ministries-table-card">
                    <Table
                        dataSource={filteredMinistries}
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

export default ManageMinistries;
