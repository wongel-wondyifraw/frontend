import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Button, Timeline, Spin, message, Avatar, Popconfirm } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    TeamOutlined,
    BookOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import './MinisterDetail.css';

// Hardcoded ministers data
const MINISTERS_DATA = {
    '1': {
        id: '1', first_name: 'Pastor', middle_name: 'David', last_name: 'Bekele',
        title: 'Senior Pastor', email: 'david.bekele@church.com',
        phone: '+251 911 000 001', address: 'Addis Ababa, Ethiopia',
        date_of_birth: '1980-03-15', marital_status: 'Married',
        ordination_date: '2018-06-15', status: 'active', department: 'Pastoral',
        bio: 'Senior pastor with 20 years of ministry experience. Committed to shepherding the congregation and community outreach.',
        created_at: '2020-01-10',
    },
    '2': {
        id: '2', first_name: 'Evangelist', middle_name: '', last_name: 'Almaz Tesfaye',
        title: 'Youth Evangelist', email: 'almaz.t@church.com',
        phone: '+251 922 000 002', address: 'Hawassa, Ethiopia',
        date_of_birth: '1995-07-20', marital_status: 'Single',
        ordination_date: '2021-03-20', status: 'active', department: 'Youth',
        bio: 'Passionate about reaching the younger generation with the gospel.',
        created_at: '2021-04-01',
    },
    '3': {
        id: '3', first_name: 'Deacon', middle_name: 'Yohannes', last_name: 'Girma',
        title: 'Deacon', email: 'yohannes.g@church.com',
        phone: '+251 933 000 003', address: 'Bahir Dar, Ethiopia',
        date_of_birth: '1975-11-10', marital_status: 'Married',
        ordination_date: '2019-11-10', status: 'active', department: 'Administration',
        bio: 'Dedicated to church administration and community service.',
        created_at: '2019-12-01',
    },
    '4': {
        id: '4', first_name: 'Pastor', middle_name: '', last_name: 'Meron Hailu',
        title: 'Associate Pastor', email: 'meron.h@church.com',
        phone: '+251 944 000 004', address: 'Adama, Ethiopia',
        date_of_birth: '1988-01-05', marital_status: 'Married',
        ordination_date: '2022-01-05', status: 'inactive', department: 'Worship',
        bio: 'Leads worship ministry and music programs.',
        created_at: '2022-02-01',
    },
    '5': {
        id: '5', first_name: 'Elder', middle_name: 'Samuel', last_name: 'Habtamu',
        title: 'Church Elder', email: 'samuel.h@church.com',
        phone: '+251 955 000 005', address: 'Dire Dawa, Ethiopia',
        date_of_birth: '1970-08-25', marital_status: 'Married',
        ordination_date: '2017-08-25', status: 'active', department: 'Pastoral',
        bio: 'Long-serving elder with deep community ties and a heart for discipleship.',
        created_at: '2017-09-01',
    },
};

const MinisterDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [minister, setMinister] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching from backend
        const data = MINISTERS_DATA[id];
        if (data) {
            setMinister(data);
        } else {
            message.error('Minister not found');
            navigate('/ministers/manage');
        }
        setLoading(false);
    }, [id, navigate]);

    const handleDelete = () => {
        message.success('Minister deleted successfully');
        navigate('/ministers/manage');
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

    if (!minister) return null;

    const fullName = `${minister.first_name} ${minister.middle_name ? minister.middle_name + ' ' : ''}${minister.last_name}`;
    const initial = (minister.first_name || '?').charAt(0).toUpperCase();

    return (
        <DashboardLayout>
            <div className="member-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#1565c0' }}
                >
                    Back to Ministers
                </Button>

                <div className="content-card-unified">
                    {/* Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={120}
                            className="member-profile-image"
                            style={{ backgroundColor: '#1565c0', fontWeight: 600, fontSize: '48px' }}
                        >
                            {initial}
                        </Avatar>
                        <div className="member-header-info">
                            <h1 className="member-name">{fullName}</h1>
                            <div className="member-role-tags">
                                <Tag
                                    icon={minister.status === 'active' ? <CheckCircleOutlined /> : <UserOutlined />}
                                    color={minister.status === 'active' ? 'success' : 'error'}
                                    style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {minister.status === 'active' ? 'Active' : 'Inactive'}
                                </Tag>
                                <Tag
                                    icon={<TeamOutlined />}
                                    color="blue"
                                    style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {minister.title}
                                </Tag>
                            </div>
                        </div>
                        <div className="member-actions-stacked">
                            <Button type="primary" icon={<PrinterOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => window.print()}>Print</Button>
                            <Button type="primary" icon={<EditOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => navigate(`/ministers/edit/${id}`)}>Edit</Button>
                            <Popconfirm
                                title="Delete Minister"
                                description="Are you sure you want to delete this minister?"
                                onConfirm={handleDelete}
                                okText="Yes"
                                cancelText="No"
                                placement="bottomRight"
                            >
                                <Button type="primary" danger icon={<DeleteOutlined />} size="middle">Delete</Button>
                            </Popconfirm>
                        </div>
                    </div>

                    <div className="member-details-grid">
                        {/* Left Column */}
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>Personal Information</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th><MailOutlined /> Email</th>
                                            <td>{minister.email || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><PhoneOutlined /> Phone</th>
                                            <td>{minister.phone || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><EnvironmentOutlined /> Address</th>
                                            <td>{minister.address || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><CalendarOutlined /> Date of Birth</th>
                                            <td>{minister.date_of_birth ? new Date(minister.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><UserOutlined /> Marital Status</th>
                                            <td>{minister.marital_status || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section">
                                <h3><TeamOutlined style={{ marginRight: '8px', color: '#1565c0' }} />Ministry Information</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th><BookOutlined /> Title</th>
                                            <td>{minister.title || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><TeamOutlined /> Department</th>
                                            <td>
                                                {minister.department ? (
                                                    <Tag color="blue" style={{ borderRadius: '12px' }}>{minister.department}</Tag>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><CalendarOutlined /> Ordained</th>
                                            <td>{minister.ordination_date ? new Date(minister.ordination_date).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {minister.bio && (
                                <div className="detail-section">
                                    <h3><BookOutlined style={{ marginRight: '8px', color: '#1565c0' }} />Biography</h3>
                                    <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '14px' }}>{minister.bio}</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Activity Timeline</h3>
                                <Timeline
                                    items={[
                                        {
                                            color: 'green',
                                            children: `Registered on ${new Date(minister.created_at).toLocaleDateString()}`,
                                        },
                                        {
                                            color: 'blue',
                                            children: `Ordained on ${minister.ordination_date ? new Date(minister.ordination_date).toLocaleDateString() : 'N/A'}`,
                                        },
                                        {
                                            color: 'purple',
                                            children: `Assigned to ${minister.department || 'N/A'} department`,
                                        },
                                    ]}
                                />
                            </div>
                            <div className="detail-section">
                                <h3>Notes</h3>
                                <p style={{ color: '#64748b', marginBottom: '16px' }}>No internal notes for this minister.</p>
                                <Button type="dashed" block>Add Note</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MinisterDetail;
