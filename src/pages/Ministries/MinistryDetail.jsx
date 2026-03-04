import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Avatar } from 'antd';
import {
    TeamOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    EditOutlined,
    UserOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import SidebarLayout from '../../Layouts/SidebarLayout';
import './MinistryDetail.css';

const MinistryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <SidebarLayout>
            <div className="ministry-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministries
                </Button>

                <div className="content-card-unified">
                    {/* Unified Header Section */}
                    <div className="ministry-header-section">
                        <div className="ministry-icon-bg">
                            <TeamOutlined />
                        </div>
                        <div className="ministry-info-simple">
                            <h1>Worship Team</h1>
                            <div className="ministry-meta-simple">
                                <span><UserOutlined /> Leader: David Miller</span>
                                <span><CalendarOutlined /> Meets: Thursdays</span>
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                            <Button type="primary" icon={<EditOutlined />} style={{ background: '#9333ea', borderColor: '#9333ea' }}>
                                Manage Group
                            </Button>
                        </div>
                    </div>

                    <div className="ministry-content-grid">
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>About this Ministry</h3>
                                <p style={{ lineHeight: '1.6', color: '#475569' }}>
                                    The Worship Team is dedicated to leading the congregation in praise and worship during our Sunday services and special events. We consist of vocalists, musicians, and sound technicians who share a heart for serving God through music.
                                </p>
                            </div>

                            <div className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, border: 'none' }}>Members (45)</h3>
                                    <Button size="small">Add Member</Button>
                                </div>
                                <div className="members-grid">
                                    {[1, 2, 3, 4, 5, 6].map((item) => (
                                        <div key={item} className="member-card-mini">
                                            <Avatar style={{ backgroundColor: '#a855f7' }} icon={<UserOutlined />} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>Member Name</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Vocalist</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Schedule</h3>
                                <div className="info-row">
                                    <span className="info-label"><ClockCircleOutlined /> Rehearsal</span>
                                    <span className="info-value">Thu 7:00 PM</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><ClockCircleOutlined /> Sunday Warmup</span>
                                    <span className="info-value">Sun 8:30 AM</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Location</span>
                                    <span className="info-value">Main Sanctuary</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default MinistryDetail;
