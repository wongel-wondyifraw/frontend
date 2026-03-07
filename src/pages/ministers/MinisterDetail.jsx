import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Button, Timeline, Spin, message, Avatar, Popconfirm, Switch } from 'antd';
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
    StopOutlined,
    KeyOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMinisterById, deleteMinister, updateUser, API_BASE_URL } from '../../services/api';
import './MinisterDetail.css';

const MinisterDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [minister, setMinister] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => {
        fetchMinisterDetails();
    }, [id]);

    const fetchMinisterDetails = async () => {
        try {
            setLoading(true);
            const data = await getMinisterById(id);
            setMinister(data);
        } catch (error) {
            message.error('Failed to load minister details');
            navigate('/ministers/manage');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMinister(minister.minister_id);
            message.success('Minister deleted successfully');
            navigate('/ministers/manage');
        } catch (error) {
            message.error('Failed to delete minister');
        }
    };

    const toggleAccountStatus = async (checked) => {
        if (!minister?.user_id) return;
        try {
            setStatusLoading(true);
            await updateUser(minister.user_id, { is_active: checked });
            message.success(`Account has been ${checked ? 'activated' : 'deactivated'}`);
            setMinister(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    is_active: checked
                }
            }));
        } catch (error) {
            message.error('Failed to update account status');
        } finally {
            setStatusLoading(false);
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

    if (!minister) return null;

    const { user, member } = minister;
    const fullName = `${user?.first_name || ''} ${user?.middle_name || ''} ${user?.last_name || ''}`.trim();
    const initial = (user?.first_name || '?').charAt(0).toUpperCase();
    const avatarUrl = user?.avatar_url ? `${API_BASE_URL}/${user.avatar_url.replace(/^\//, '')}` : null;

    return (
        <DashboardLayout>
            <div className="member-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/ministers/manage')}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#1565c0' }}
                >
                    Back to Ministers
                </Button>

                <div className="content-card-unified">
                    {/* Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={120}
                            src={avatarUrl}
                            className="member-profile-image"
                            style={{ backgroundColor: '#1565c0', fontWeight: 600, fontSize: '48px' }}
                        >
                            {!avatarUrl && initial}
                        </Avatar>
                        <div className="member-header-info">
                            <h1 className="member-name">{fullName}</h1>
                            <div className="member-role-tags">
                                <Tag
                                    icon={user?.is_active ? <CheckCircleOutlined /> : <StopOutlined />}
                                    color={user?.is_active ? 'success' : 'error'}
                                    style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {user?.is_active ? 'Active Account' : 'Inactive Account'}
                                </Tag>
                                <Tag
                                    icon={<TeamOutlined />}
                                    color="blue"
                                    style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {user?.title || 'Minister'}
                                </Tag>
                            </div>
                        </div>
                        <div className="member-actions-stacked">
                            <Button type="primary" icon={<PrinterOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => window.print()}>Print</Button>
                            <Button type="primary" icon={<EditOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => navigate(`/ministers/edit/${id}`)}>Edit</Button>
                            <Popconfirm
                                title="Delete Minister"
                                description="Are you sure you want to delete this minister? This will also delete their user account."
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
                                <h3>Account Configuration</h3>
                                <div style={{
                                    padding: '24px',
                                    background: '#f8fafc',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '24px'
                                }}>
                                    {/* Status Toggle */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingBottom: '20px',
                                        borderBottom: '1px solid #e2e8f0'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px', fontSize: '15px' }}>Minister Account Access</div>
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                Enable or disable this minister's ability to log into the system.
                                            </div>
                                        </div>
                                        <Switch
                                            checked={user?.is_active}
                                            onChange={toggleAccountStatus}
                                            loading={statusLoading}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', flexWrap: 'wrap' }}>
                                        <Button
                                            type="primary"
                                            size="middle"
                                            icon={<KeyOutlined />}
                                            style={{ backgroundColor: '#1565c0', borderRadius: '6px', fontWeight: 500 }}
                                            onClick={() => message.info('Reset password modal will open')}
                                        >
                                            Reset Password
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="middle"
                                            icon={<EditOutlined />}
                                            style={{ backgroundColor: '#1565c0', borderRadius: '6px', fontWeight: 500 }}
                                            onClick={() => navigate(`/ministers/edit/${id}`)}
                                        >
                                            Edit Account
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="middle"
                                            icon={<ArrowUpOutlined />}
                                            style={{ backgroundColor: '#1565c0', borderRadius: '6px', fontWeight: 500 }}
                                            onClick={() => message.info('Promote minister modal will open')}
                                        >
                                            Promote
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Personal & Contact Information</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th><MailOutlined /> Email (Login)</th>
                                            <td>{user?.email || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><PhoneOutlined /> Phone</th>
                                            <td>{member?.phone || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><EnvironmentOutlined /> Address</th>
                                            <td>{member?.address || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><CalendarOutlined /> Date of Birth</th>
                                            <td>{member?.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><UserOutlined /> Marital Status</th>
                                            <td>{member?.marital_status || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Activity Timeline</h3>
                                <Timeline
                                    items={[
                                        ...((user?.created_at ? [{
                                            color: 'green',
                                            children: `User account created on ${new Date(user.created_at).toLocaleDateString()}`,
                                        }] : [])),
                                        ...((member?.created_at ? [{
                                            color: 'blue',
                                            children: `Member registered on ${new Date(member.created_at).toLocaleDateString()}`,
                                        }] : []))
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
