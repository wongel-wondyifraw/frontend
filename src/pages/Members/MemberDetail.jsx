import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Button, Timeline, Avatar, Breadcrumb, message, Modal } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    UserOutlined,
    PrinterOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMember, deleteMember, API_BASE_URL } from '../../services/api';
import './MemberDetail.css';

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                setLoading(true);
                const data = await getMember(id);
                setMember(data);
            } catch (error) {
                message.error(error.message || 'Failed to load member details');
                navigate('/members/manage');
            } finally {
                setLoading(false);
            }
        };
        fetchMember();
    }, [id, navigate]);

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete Member?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete ${member?.first_name} ${member?.last_name}? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
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

    const getMaritalColor = (status) => {
        if (!status) return undefined;
        switch (status.toLowerCase()) {
            case 'married': return '#10b981';
            case 'single': return '#3b82f6';
            case 'divorced': return '#f59e0b';
            case 'widowed': return '#8b5cf6';
            default: return undefined;
        }
    };

    const getStatusColor = (status) => {
        const s = (status || 'active').toLowerCase();
        return s === 'active' ? '#10b981' : '#ef4444';
    };

    const getInitials = () => {
        return (member?.first_name?.[0] || '').toUpperCase();
    };

    const fullName = member
        ? `${member.first_name} ${member.middle_name ? member.middle_name + ' ' : ''}${member.last_name}`
        : '';

    if (loading || !member) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#94A3B8' }}>
                    Loading member details...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="member-detail-container">
                {/* Breadcrumb Navigation */}
                <Breadcrumb style={{ marginBottom: '16px' }} items={[
                    { title: <a onClick={() => navigate('/dashboard')}><HomeOutlined /> Dashboard</a> },
                    { title: <a onClick={() => navigate('/members/manage')}>Members</a> },
                    { title: fullName },
                ]} />

                <div className="content-card-unified">
                    {/* Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={90}
                            src={member.image_url ? `${API_BASE_URL}/${member.image_url.replace(/^\//, '')}` : null}
                            style={{
                                backgroundColor: '#1565c0',
                                fontSize: '36px',
                                fontWeight: 700,
                                border: '3px solid #e2e8f0',
                            }}
                            className="member-profile-image"
                        >
                            {!member.image_url && getInitials()}
                        </Avatar>
                        <div className="member-header-info">
                            <h1 className="member-name">{fullName}</h1>
                            <div className="member-role-tags">
                                <Tag
                                    color={getStatusColor(member.status)}
                                    style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}
                                >
                                    {(member.status || 'active').toUpperCase()}
                                </Tag>
                                {member.marital_status && (
                                    <Tag
                                        color={getMaritalColor(member.marital_status)}
                                        style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '12px', fontWeight: 600, textTransform: 'capitalize' }}
                                    >
                                        {member.marital_status}
                                    </Tag>
                                )}
                                <span className="member-id" style={{ fontSize: '12px', color: '#94A3B8' }}>
                                    ID: {member.id.substring(0, 8)}...
                                </span>
                            </div>
                        </div>
                        <div className="member-actions">
                            <Button icon={<PrinterOutlined />} size="large" onClick={() => window.print()}>Print</Button>
                            <Button
                                icon={<EditOutlined />}
                                size="large"
                                onClick={() => navigate(`/members/edit/${member.id}`)}
                            >
                                Edit
                            </Button>
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
                                    <span className="info-value">{member.email || <em style={{ color: '#cbd5e1' }}>No data</em>}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><PhoneOutlined /> Phone</span>
                                    <span className="info-value">{member.phone || <em style={{ color: '#cbd5e1' }}>No data</em>}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><EnvironmentOutlined /> Address</span>
                                    <span className="info-value">{member.address || <em style={{ color: '#cbd5e1' }}>No data</em>}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><CalendarOutlined /> Date of Birth</span>
                                    <span className="info-value">
                                        {member.date_of_birth
                                            ? new Date(member.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : <em style={{ color: '#cbd5e1' }}>No data</em>
                                        }
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><UserOutlined /> Marital Status</span>
                                    <span className="info-value">
                                        {member.marital_status
                                            ? <Tag color={getMaritalColor(member.marital_status)} style={{ borderRadius: '12px', textTransform: 'capitalize' }}>{member.marital_status}</Tag>
                                            : <em style={{ color: '#cbd5e1' }}>No data</em>
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Family Connections</h3>
                                <p style={{ color: '#94A3B8', fontSize: '13px' }}>No data</p>
                            </div>

                            <div className="detail-section">
                                <h3>Ministry Involvement</h3>
                                <div className="info-row">
                                    <span className="info-label">Joined Date</span>
                                    <span className="info-value">
                                        {member.created_at
                                            ? new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : <em style={{ color: '#cbd5e1' }}>No data</em>
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Recent Activity</h3>
                                <p style={{ color: '#94A3B8', fontSize: '13px' }}>No data</p>
                            </div>
                            <div className="detail-section">
                                <h3>Notes</h3>
                                <p style={{ color: '#94A3B8', marginBottom: '16px', fontSize: '13px' }}>No admin notes added yet.</p>
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
        </DashboardLayout>
    );
};

export default MemberDetail;
