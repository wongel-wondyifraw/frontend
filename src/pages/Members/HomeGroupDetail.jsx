import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Avatar, Tag } from 'antd';
import {
    ArrowLeftOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    UserOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    PlusOutlined
} from '@ant-design/icons';
import SidebarLayout from '../../Layouts/SidebarLayout';
import './HomeGroupDetail.css';

const HomeGroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock Data based on ID
    const group = {
        name: "North Hills Fellowship",
        leader: "John Doe",
        day: "Wednesday",
        time: "19:00",
        location: "North Hills Community Center",
        address: "123 North Hills Blvd, Springfield",
        description: "A community group focused on deep bible study and fellowship for families in the North Hills area.",
        members: [
            { name: "Alice Johnson", role: "Member" },
            { name: "Bob Smith", role: "Member" },
            { name: "Charlie Brown", role: "Co-Leader" },
            { name: "Diana Prince", role: "Member" },
        ]
    };

    return (
        <SidebarLayout>
            <div className="home-group-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/members/home-groups')}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#1565c0' }}
                >
                    Back to Home Groups
                </Button>

                <div className="content-card-unified">
                    {/* Header */}
                    <div className="group-header-section">
                        <div className="group-icon-bg">
                            <TeamOutlined />
                        </div>
                        <div className="group-header-info">
                            <h1>{group.name}</h1>
                            <div className="group-meta">
                                <span><UserOutlined /> Leader: {group.leader}</span>
                                <span><CalendarOutlined /> {group.day}s at {group.time}</span>
                                <span><EnvironmentOutlined /> {group.location}</span>
                            </div>
                        </div>
                        <div className="group-actions">
                            <Button icon={<EditOutlined />} size="large">Edit Group</Button>
                            <Button icon={<DeleteOutlined />} danger size="large">Delete</Button>
                        </div>
                    </div>

                    <div className="group-detail-grid">
                        {/* Left Column: Info & Members */}
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>About the Group</h3>
                                <p style={{ color: '#334155', lineHeight: '1.6' }}>{group.description}</p>
                            </div>

                            <div className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3>Members ({group.members.length})</h3>
                                    <Button type="primary" size="small" icon={<PlusOutlined />} style={{ background: '#1565c0' }}>Add Member</Button>
                                </div>
                                <div className="members-list">
                                    {group.members.map((member, idx) => (
                                        <div key={idx} className="member-item">
                                            <Avatar style={{ backgroundColor: '#e3f2fd', color: '#1565c0' }} icon={<UserOutlined />} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{member.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{member.role}</div>
                                            </div>
                                            <Button type="link" size="small">View</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Map & Location */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Location Map</h3>
                                <div className="map-container">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=1%20Grafton%20Street,%20Dublin,%20Ireland+(My%20Business%20Name)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        title="Home Group Location"
                                    ></iframe>
                                    <div className="map-overlay-label">{group.location}</div>
                                </div>

                                <div className="info-row">
                                    <span className="info-label"><EnvironmentOutlined /> Address</span>
                                    <span className="info-value">{group.address}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><ClockCircleOutlined /> Time</span>
                                    <span className="info-value">{group.day}, {group.time}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default HomeGroupDetail;
