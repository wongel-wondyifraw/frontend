import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Button, Timeline, Avatar, Spin, message, Modal, Breadcrumb } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    UserOutlined,
    PlusOutlined,
    PrinterOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { getMemberById, deleteMember, getMemberMinistries, API_BASE_URL } from '../../services/api';
import './MemberDetail.css';

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ministries, setMinistries] = useState([]);

    useEffect(() => {
        loadMember();
        loadMinistries();
    }, [id]);

    const loadMember = async () => {
        try {
            setLoading(true);
            const data = await getMemberById(id);
            setMember(data);
        } catch (error) {
            message.error('Failed to load member details');
            navigate('/members/manage');
        } finally {
            setLoading(false);
        }
    };

    const loadMinistries = async () => {
        try {
            const data = await getMemberMinistries(id);
            setMinistries(data);
        } catch (error) {
            console.warn('Failed to load member ministries:', error);
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete Member?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete this member? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMember(id);
                    message.success('Member deleted successfully');
                    navigate('/members/manage');
                } catch (error) {
                    message.error(error.message || 'Failed to delete member');
                }
            },
        });
    };

    const getFullName = () => {
        if (!member) return '';
        return `${member.first_name || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.last_name || ''}`.trim();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'green';
            case 'inactive': return 'red';
            case 'visitor': return 'blue';
            default: return 'default';
        }
    };

    const getMaritalStatusColor = (status) => {
        const colorMap = {
            single: '#3B82F6',
            married: '#10b981',
            divorced: '#f59e0b',
            widowed: '#8b5cf6',
        };
        return colorMap[status?.toLowerCase()] || '#94A3B8';
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
            </SidebarLayout>
        );
    }

    if (!member) return null;

    const avatarSrc = member.image_url
        ? `${API_BASE_URL}/${member.image_url.replace(/^\//, '')}?t=${new Date().getTime()}`
        : null;

    return (
        <SidebarLayout>
            <div className="member-detail-container">
                {/* Breadcrumb */}
                <Breadcrumb
                    style={{ marginBottom: '16px', fontSize: '14px' }}
                    items={[
                        {
                            title: <a onClick={() => navigate('/members/manage')} style={{ color: '#1565c0', cursor: 'pointer' }}>Members</a>,
                        },
                        {
                            title: getFullName(),
                        },
                    ]}
                />

                <div className="content-card-unified">
                    {/* Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={80}
                            icon={<UserOutlined />}
                            src={avatarSrc}
                            style={{ backgroundColor: '#e2e8f0' }}
                        />
                        <div className="member-header-info">
                            <h1 className="member-name">{getFullName()}</h1>
                            <div className="member-role-tags">
                                <Tag color={getStatusColor(member.status)} style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}>
                                    {member.status || 'Unknown'}
                                </Tag>
                                <span className="member-id">ID: #{id?.substring(0, 8)}</span>
                            </div>
                        </div>
                        <div className="member-actions">
                            <Button icon={<PrinterOutlined />} size="large" onClick={() => window.print()}>Print Info</Button>
                            <Button icon={<EditOutlined />} size="large" onClick={() => navigate(`/members/edit/${id}`)}>Edit Profile</Button>
                            <Button icon={<DeleteOutlined />} danger size="large" onClick={handleDelete}>Delete</Button>
                        </div>
                    </div>

                    <div className="member-details-grid">
                        {/* Left Column */}
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>Personal Information</h3>
                                <div className="info-row">
                                    <span className="info-label"><MailOutlined /> Email</span>
                                    <span className="info-value">{member.email || 'Not provided'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><PhoneOutlined /> Phone</span>
                                    <span className="info-value">{member.phone || 'Not provided'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><EnvironmentOutlined /> Address</span>
                                    <span className="info-value">{member.address || 'Not provided'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><CalendarOutlined /> Date of Birth</span>
                                    <span className="info-value">
                                        {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'Not provided'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><UserOutlined /> Marital Status</span>
                                    <span className="info-value">
                                        {member.marital_status ? (
                                            <Tag color={getMaritalStatusColor(member.marital_status)} style={{ borderRadius: '20px' }}>
                                                {member.marital_status.charAt(0).toUpperCase() + member.marital_status.slice(1)}
                                            </Tag>
                                        ) : 'Not provided'}
                                    </span>
                                </div>
                            </div>

                            {/* Ministry Involvement Section */}
                            <div className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Ministry Involvement</h3>
                                </div>

                                {ministries.length > 0 ? (
                                    <div className="ministry-involvement-list">
                                        {ministries.map((mm, idx) => (
                                            <div key={idx} className="family-member-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#1565c0' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                        {mm.ministry?.name || 'Unknown Ministry'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        Joined {mm.joined_at ? new Date(mm.joined_at).toLocaleDateString() : '—'}
                                                    </div>
                                                </div>
                                                <Button size="small" onClick={() => navigate(`/ministries/details/${mm.ministry_id}`)}>View</Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8' }}>Not assigned to any ministry.</p>
                                )}

                                <div className="info-row" style={{ marginTop: '16px' }}>
                                    <span className="info-label">Member Since</span>
                                    <span className="info-value">
                                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Notes</h3>
                                <p style={{ color: '#64748b', marginBottom: '16px' }}>No admin notes added yet.</p>
                                <Button type="dashed" block>Add Note</Button>
                            </div>
                        </div>
                    </div>

                    {/* Print Signature Section */}
                    <div className="print-signature-section">
                        <div className="signature-line">
                            <div className="signature-box">
                                <span className="signature-label">Signature</span>
                                <div className="signature-input"></div>
                            </div>
                            <div className="signature-box">
                                <span className="signature-label">Name</span>
                                <div className="signature-input"></div>
                            </div>
                            <div className="signature-box">
                                <span className="signature-label">Date</span>
                                <div className="signature-input"></div>
                            </div>
                        </div>
                        <p className="signature-disclaimer">This document is an official record of the church membership system.</p>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default MemberDetail;
