import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Button, Timeline, Spin, message, Avatar } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    PlusOutlined,
    PrinterOutlined
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMember } from '../../services/api';
import './MemberDetail.css';

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMemberDetails();
    }, [id]);

    const fetchMemberDetails = async () => {
        try {
            setLoading(true);
            const data = await getMember(id);
            setMember(data);
        } catch (error) {
            message.error('Failed to load member details');
            navigate('/members/manage');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
            </DashboardLayout>
        );
    }

    if (!member) return null;

    const fullName = `${member.first_name} ${member.middle_name ? member.middle_name + ' ' : ''}${member.last_name}`;

    return (
        <DashboardLayout>
            <div className="member-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#1565c0' }}
                >
                    Back to Members
                </Button>

                <div className="content-card-unified">
                    {/* Unified Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={120}
                            src={member.image_url}
                            icon={<UserOutlined />}
                            className="member-profile-image"
                        />
                        <div className="member-header-info">
                            <h1 className="member-name">{fullName}</h1>
                            <div className="member-role-tags">
                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 10px' }}>Member</Tag>
                                <Tag color={member.status === 'active' ? 'green' : 'orange'} style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}>
                                    {member.status?.charAt(0).toUpperCase() + member.status?.slice(1)}
                                </Tag>
                                <span className="member-id">ID: #{member.id?.slice(0, 8)}</span>
                            </div>
                        </div>
                        <div className="member-actions">
                            <Button icon={<PrinterOutlined />} size="large" onClick={() => window.print()}>Print Info</Button>
                            <Button icon={<EditOutlined />} size="large" onClick={() => navigate(`/members/edit/${id}`)}>Edit Profile</Button>
                            <Button icon={<DeleteOutlined />} danger size="large">Delete</Button>
                        </div>
                    </div>

                    <div className="member-details-grid">
                        {/* Left Column */}
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>Personal Information</h3>
                                <div className="info-row">
                                    <span className="info-label"><MailOutlined /> Email</span>
                                    <span className="info-value">{member.email || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><PhoneOutlined /> Phone</span>
                                    <span className="info-value">{member.phone || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><EnvironmentOutlined /> Address</span>
                                    <span className="info-value">{member.address || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><CalendarOutlined /> Date of Birth</span>
                                    <span className="info-value">{member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><UserOutlined /> Marital Status</span>
                                    <span className="info-value">{member.marital_status || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Ministry Involvement</h3>
                                <div className="info-row">
                                    <span className="info-label">Active Ministries</span>
                                    <span className="info-value">
                                        {member.ministry_members?.length || 0} ministries
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Joined Date</span>
                                    <span className="info-value">{new Date(member.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    {member.ministry_members?.map(mm => (
                                        <Tag key={mm.ministry_id} color="blue" style={{ marginBottom: '8px' }}>
                                            {mm.ministry?.name}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Activity Timeline</h3>
                                <Timeline
                                    items={[
                                        {
                                            color: 'green',
                                            children: `Member registered on ${new Date(member.created_at).toLocaleDateString()}`,
                                        },
                                        ...(member.ministry_members || []).map(mm => ({
                                            color: 'blue',
                                            children: `Joined ${mm.ministry?.name || 'Ministry'} on ${new Date(mm.joined_at).toLocaleDateString()}`
                                        }))
                                    ]}
                                />
                            </div>
                            <div className="detail-section">
                                <h3>Notes</h3>
                                <p style={{ color: '#64748b', marginBottom: '16px' }}>No internal notes for this member.</p>
                                <Button type="dashed" block>Add Note</Button>
                            </div>
                        </div>
                    </div>

                    {/* Print Signature Section (Hidden on screen) */}
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
