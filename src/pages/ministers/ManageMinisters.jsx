import React, { useState, useEffect } from 'react';
import { Tag, Button, Avatar, message, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import DataTable from '../../Components/common/DataTable';
import { getMinisters, deleteMinister, API_BASE_URL } from '../../services/api';
import './ManageMinisters.css';

const ManageMinisters = () => {
    const navigate = useNavigate();
    const [ministers, setMinisters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchMinisters();
    }, []);

    const fetchMinisters = async () => {
        try {
            setLoading(true);
            const data = await getMinisters();
            setMinisters(data);
        } catch (error) {
            message.error('Failed to load ministers');
        } finally {
            setLoading(false);
        }
    };

    // Delete handler with confirmation
    const handleDelete = (minister) => {
        Modal.confirm({
            title: 'Delete Minister?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to remove ${minister.user.first_name} ${minister.user.last_name} as a minister? This will also delete their user account and cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMinister(minister.minister_id);
                    setMinisters(prev => prev.filter(m => m.minister_id !== minister.minister_id));
                    message.success('Minister deleted successfully');
                } catch (error) {
                    message.error('Failed to delete minister');
                }
            },
        });
    };

    // Filter ministers by search
    const filteredMinisters = ministers.filter(minister => {
        if (!minister.user) return false;
        const q = searchText.toLowerCase();
        const fullName = `${minister.user.first_name || ''} ${minister.user.middle_name || ''} ${minister.user.last_name || ''}`.toLowerCase();
        return (
            fullName.includes(q) ||
            minister.user.email?.toLowerCase().includes(q) ||
            minister.member?.phone?.toLowerCase().includes(q) ||
            minister.user.title?.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_, record) => {
                const user = record.user || {};
                const initial = (user.first_name || '?').charAt(0).toUpperCase();
                const avatarUrl = user.avatar_url ? `${API_BASE_URL}/${user.avatar_url.replace(/^\//, '')}` : null;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar
                            src={avatarUrl}
                            style={{ backgroundColor: '#1565c0', fontWeight: 600, fontSize: '16px' }}
                        >
                            {!avatarUrl && initial}
                        </Avatar>
                        <div>
                            <span style={{ fontWeight: 600 }}>
                                {user.first_name} {user.middle_name ? user.middle_name + ' ' : ''}{user.last_name}
                            </span>
                            {user.email && (
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{user.email}</div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Title',
            key: 'title',
            render: (_, record) => record.user?.title || '-',
        },
        {
            title: 'Phone',
            key: 'phone',
            render: (_, record) => record.member?.phone || '-',
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                const s = record.user?.is_active ? 'active' : 'inactive';
                const color = s === 'active' ? '#10b981' : '#ef4444';
                return (
                    <Tag color={color} style={{ borderRadius: '20px', padding: '0 12px', fontWeight: 600 }}>
                        {s.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="View Details">
                        <Button
                            icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                            onClick={() => navigate(`/ministers/details/${record.minister_id}`)}
                        />
                    </Tooltip>
                    <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => navigate(`/ministers/edit/${record.minister_id}`)}
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
            <div className="manage-ministers-container">
                <DataTable
                    title="Manage Ministers"
                    columns={columns}
                    dataSource={filteredMinisters}
                    loading={loading}
                    rowKey="minister_id" // Using primary UUID
                    searchPlaceholder="Search ministers..."
                    searchValue={searchText}
                    onSearchChange={setSearchText}
                    pageSize={10}
                    actionButton={{
                        label: 'Add Minister',
                        icon: <PlusOutlined />,
                        onClick: () => navigate('/ministers/add'),
                    }}
                    tableCardClassName="ministers-table-card"
                />
            </div>
        </DashboardLayout>
    );
};

export default ManageMinisters;