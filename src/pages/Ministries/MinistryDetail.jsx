import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Modal, Spin, Breadcrumb, Table, Avatar, Tag } from 'antd';
import {
    TeamOutlined,
    CalendarOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMinistry, deleteMinistry, getMinistryMembers } from '../../services/api';
import './MinistryDetail.css';

const MinistryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ministry, setMinistry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ministryMembers, setMinistryMembers] = useState([]);

    useEffect(() => {
        loadMinistry();
        loadMembers();
    }, [id]);

    const loadMinistry = async () => {
        try {
            setLoading(true);
            const data = await getMinistry(id);
            setMinistry(data);
        } catch (error) {
            message.error('Failed to load ministry details');
            navigate('/ministries/manage');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        try {
            const data = await getMinistryMembers(id);
            setMinistryMembers(data);
        } catch (error) {
            console.warn('Failed to load ministry members:', error);
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete Ministry?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete "${ministry?.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMinistry(id);
                    message.success('Ministry deleted successfully');
                    navigate('/ministries/manage');
                } catch (error) {
                    message.error(error.message || 'Failed to delete ministry');
                }
            },
        });
    };

    const getLeaderName = () => {
        if (ministry?.leader) {
            const { first_name, middle_name, last_name } = ministry.leader;
            return `${first_name || ''} ${middle_name ? middle_name + ' ' : ''}${last_name || ''}`.trim();
        }
        return 'Not assigned';
    };

    const memberColumns = [
        {
            title: 'Member',
            key: 'name',
            render: (_, record) => {
                const m = record.member;
                if (!m) return record.member_id;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1565c0' }} />
                        <span style={{ fontWeight: 500 }}>{m.first_name} {m.last_name}</span>
                    </div>
                );
            },
        },
        {
            title: 'Email',
            key: 'email',
            render: (_, record) => record.member?.email || '-',
        },
        {
            title: 'Phone',
            key: 'phone',
            render: (_, record) => record.member?.phone || '-',
        },
        {
            title: 'Joined',
            dataIndex: 'joined_at',
            key: 'joined_at',
            render: date => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button size="small" onClick={() => navigate(`/members/details/${record.member_id}`)}>
                    View
                </Button>
            ),
        },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
            </DashboardLayout>
        );
    }

    if (!ministry) return null;

    return (
        <DashboardLayout>
            <div className="ministry-detail-container">
                {/* Breadcrumb */}
                <Breadcrumb
                    style={{ marginBottom: '16px', fontSize: '14px' }}
                    items={[
                        {
                            title: <a onClick={() => navigate('/ministries/manage')} style={{ color: '#1565c0', cursor: 'pointer' }}>Ministries</a>,
                        },
                        {
                            title: ministry.name,
                        },
                    ]}
                />

                <div className="content-card-unified">
                    {/* Header Section */}
                    <div className="ministry-header-section">
                        <div className="ministry-icon-bg">
                            <TeamOutlined />
                        </div>
                        <div className="ministry-info-simple">
                            <h1>{ministry.name}</h1>
                            <div className="ministry-meta-simple">
                                <span><UserOutlined /> Leader: {getLeaderName()}</span>
                                {ministry.schedule && (
                                    <span><CalendarOutlined /> {ministry.schedule}</span>
                                )}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                style={{ background: '#1565c0', borderColor: '#1565c0' }}
                                onClick={() => navigate(`/ministries/edit/${id}`)}
                            >
                                Edit Ministry
                            </Button>
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="ministry-content-grid">
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>About this Ministry</h3>
                                <p style={{ lineHeight: '1.6', color: '#475569' }}>
                                    {ministry.about || 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Details</h3>
                                <div className="info-row">
                                    <span className="info-label"><UserOutlined /> Leader</span>
                                    <span className="info-value">{getLeaderName()}</span>
                                </div>
                                {ministry.leader?.email && (
                                    <div className="info-row">
                                        <span className="info-label">Leader Email</span>
                                        <span className="info-value">{ministry.leader.email}</span>
                                    </div>
                                )}
                                <div className="info-row">
                                    <span className="info-label"><CalendarOutlined /> Schedule</span>
                                    <span className="info-value">{ministry.schedule || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Created</span>
                                    <span className="info-value">
                                        {ministry.created_at ? new Date(ministry.created_at).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members Section */}
                    <div className="detail-section" style={{ marginTop: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, border: 'none', padding: 0 }}>
                                <TeamOutlined style={{ marginRight: '8px', color: '#1565c0' }} />
                                Ministry Members ({ministryMembers.length})
                            </h3>
                        </div>

                        {ministryMembers.length > 0 ? (
                            <Table
                                dataSource={ministryMembers}
                                columns={memberColumns}
                                rowKey={(record) => record.member_id}
                                pagination={{ pageSize: 5 }}
                                size="small"
                            />
                        ) : (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
                                No members added to this ministry yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MinistryDetail;
