import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Avatar, Breadcrumb, message, Modal } from 'antd';
import {
    TeamOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMinistry, deleteMinistry, getMember } from '../../services/api';
import './MinistryDetail.css';

const MinistryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ministry, setMinistry] = useState(null);
    const [leader, setLeader] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMinistry = async () => {
            try {
                setLoading(true);
                const data = await getMinistry(id);
                setMinistry(data);

                // Fetch leader info if leader_id exists
                if (data.leader_id) {
                    try {
                        const leaderData = await getMember(data.leader_id);
                        setLeader(leaderData);
                    } catch (e) {
                        console.warn('Leader not found');
                    }
                }
            } catch (error) {
                message.error(error.message || 'Failed to load ministry details');
                navigate('/ministries/manage');
            } finally {
                setLoading(false);
            }
        };
        fetchMinistry();
    }, [id, navigate]);

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete Ministry?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete "${ministry?.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
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

    if (loading || !ministry) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#94A3B8' }}>
                    Loading ministry details...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="ministry-detail-container">
                {/* Breadcrumb Navigation */}
                <Breadcrumb style={{ marginBottom: '16px' }} items={[
                    { title: <a onClick={() => navigate('/dashboard')}><HomeOutlined /> Dashboard</a> },
                    { title: <a onClick={() => navigate('/ministries/manage')}>Ministries</a> },
                    { title: ministry.name },
                ]} />

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
                                    <UserOutlined /> Leader: {leader ? `${leader.first_name} ${leader.last_name}` : <em style={{ color: '#cbd5e1' }}>Not assigned</em>}
                                </span>
                                <span>
                                    <CalendarOutlined /> Schedule: {ministry.schedule || <em style={{ color: '#cbd5e1' }}>Not set</em>}
                                </span>
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                style={{ background: '#7b1fa2', borderColor: '#7b1fa2' }}
                                onClick={() => navigate(`/ministries/edit/${ministry.id}`)}
                            >
                                Edit
                            </Button>
                            <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="ministry-content-grid">
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>About this Ministry</h3>
                                <p style={{ lineHeight: '1.6', color: '#475569' }}>
                                    {ministry.about || <em style={{ color: '#cbd5e1' }}>No description provided</em>}
                                </p>
                            </div>

                            <div className="detail-section">
                                <h3>Members</h3>
                                <p style={{ color: '#94A3B8', fontSize: '13px' }}>No data</p>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Schedule</h3>
                                <div className="info-row">
                                    <span className="info-label"><ClockCircleOutlined /> Meeting Time</span>
                                    <span className="info-value">{ministry.schedule || <em style={{ color: '#cbd5e1' }}>No data</em>}</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Leader</h3>
                                {leader ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Avatar style={{ backgroundColor: '#7b1fa2', fontWeight: 700 }}>
                                            {leader.first_name?.[0]?.toUpperCase() || 'L'}
                                        </Avatar>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{leader.first_name} {leader.last_name}</div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{leader.email || leader.phone || ''}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: '#94A3B8', fontSize: '13px' }}>No leader assigned</p>
                                )}
                            </div>

                            <div className="detail-section">
                                <h3>Created</h3>
                                <p style={{ color: '#475569' }}>
                                    {ministry.created_at
                                        ? new Date(ministry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : 'Unknown'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MinistryDetail;
