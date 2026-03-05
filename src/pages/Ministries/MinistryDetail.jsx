import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Modal, Spin, Breadcrumb, Table, Tag, Avatar } from 'antd';
import {
    TeamOutlined,
    CalendarOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    EyeOutlined,
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
    const [membersLoading, setMembersLoading] = useState(false);

    useEffect(() => {
        loadMinistry();
        loadMinistryMembers();
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

    const loadMinistryMembers = async () => {
        try {
            setMembersLoading(true);
            const data = await getMinistryMembers(id);
            setMinistryMembers(data);
        } catch (error) {
            console.warn('Failed to load ministry members:', error);
        } finally {
            setMembersLoading(false);
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
                const member = record.member;
                if (!member) return '-';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar size={32} icon={<UserOutlined />} src={member.image_url || null} />
                        <span>{member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}</span>
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
            key: 'joined_at',
            render: (_, record) => record.joined_at ? new Date(record.joined_at).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/members/${record.member?.id}`)}
                    style={{ color: '#1565c0' }}
                >
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
                                <span>
                                    <UserOutlined /> Leader:{' '}
                                    <strong style={{ color: '#1565c0', fontWeight: 600 }}>{getLeaderName()}</strong>
                                </span>
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
                                    <span className="info-value" style={{ color: '#1565c0', fontWeight: 600 }}>{getLeaderName()}</span>
                                </div>
                                {ministry.leader?.email && (
                                    <div className="info-row">
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{ministry.leader.email}</span>
                                    </div>
                                )}
                                {ministry.leader?.phone && (
                                    <div className="info-row">
                                        <span className="info-label">Phone</span>
                                        <span className="info-value">{ministry.leader.phone}</span>
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
                        <h3><TeamOutlined style={{ marginRight: '8px', color: '#1565c0' }} />Ministry Members ({ministryMembers.length})</h3>
                        <Table
                            dataSource={ministryMembers}
                            columns={memberColumns}
                            rowKey={(record) => record.member_id || record.member?.id}
                            loading={membersLoading}
                            pagination={{ pageSize: 5 }}
                            locale={{ emptyText: 'No members assigned to this ministry yet.' }}
                            style={{ marginTop: '16px' }}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MinistryDetail;
