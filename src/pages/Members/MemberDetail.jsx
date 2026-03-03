import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Button, Timeline } from 'antd';
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
import SidebarLayout from '../../Layouts/SidebarLayout';
import './MemberDetail.css';

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock Data - In a real app, fetch based on ID
    const member = {
        name: "Sarah Jenkins",
        role: "Worship Leader",
        status: "Active",
        email: "sarah.jenkins@example.com",
        phone: "+1 (555) 123-4567",
        address: "123 Faith Lane, Springfield, IL 62704",
        joinedDate: "January 15, 2023",
        dob: "March 12, 1990",
        campus: "Main Campus",
        maritalStatus: "Married",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
        family: [
            { name: 'Michael Jenkins', relation: 'Spouse', id: '002', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
            { name: 'Emma Jenkins', relation: 'Daughter', id: '003', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' }
        ]
    };

    return (
        <SidebarLayout>
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
                        <img src={member.avatar} alt={member.name} className="member-profile-image" />
                        <div className="member-header-info">
                            <h1 className="member-name">{member.name}</h1>
                            <div className="member-role-tags">
                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 10px' }}>{member.role}</Tag>
                                <Tag color="green" style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}>{member.status}</Tag>
                                <span className="member-id">ID: #{id || '001'}</span>
                            </div>
                        </div>
                        <div className="member-actions">
                            <Button icon={<PrinterOutlined />} size="large" onClick={() => window.print()}>Print Info</Button>
                            <Button icon={<EditOutlined />} size="large">Edit Profile</Button>
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
                                    <span className="info-value">{member.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><PhoneOutlined /> Phone</span>
                                    <span className="info-value">{member.phone}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><EnvironmentOutlined /> Address</span>
                                    <span className="info-value">{member.address}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><CalendarOutlined /> Date of Birth</span>
                                    <span className="info-value">{member.dob}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><UserOutlined /> Marital Status</span>
                                    <span className="info-value">{member.maritalStatus}</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Family Connections</h3>
                                <div className="family-list">
                                    {member.family.map((fam, idx) => (
                                        <div key={idx} className="family-member-item">
                                            <img src={fam.avatar} alt={fam.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{fam.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{fam.relation}</div>
                                            </div>
                                            <Button size="small" style={{ marginLeft: 'auto' }} onClick={() => navigate(`/members/details/${fam.id}`)}>View</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Ministry Involvement</h3>
                                    <Button type="primary" size="small" icon={<PlusOutlined />} style={{ background: '#1565c0' }}>Add to Ministry</Button>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Campus</span>
                                    <span className="info-value">{member.campus}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Joined Date</span>
                                    <span className="info-value">{member.joinedDate}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Baptized</span>
                                    <span className="info-value">Yes (June 2010)</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Recent Activity</h3>
                                <Timeline
                                    items={[
                                        {
                                            color: 'green',
                                            children: 'Attended Sunday Service - oct 22, 2025',
                                        },
                                        {
                                            color: 'blue',
                                            children: 'Joined "Worship Team" - Sep 15, 2025',
                                        },
                                        {
                                            color: 'gray',
                                            children: 'Updated contact information - Aug 01, 2025',
                                        },
                                        {
                                            color: 'gray',
                                            children: 'Registered as a member - Jan 15, 2023',
                                        },
                                    ]}
                                />
                            </div>
                            <div className="detail-section">
                                <h3>Notes</h3>
                                <p style={{ color: '#64748b', marginBottom: '16px' }}>No admin notes added yet.</p>
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
        </SidebarLayout>
    );
};

export default MemberDetail;
