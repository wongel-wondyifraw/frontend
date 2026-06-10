'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tag, Button, Timeline, Spin, message, Avatar, Popconfirm, Card, Tooltip, List, Modal } from 'antd';
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
    PrinterOutlined,
    CheckCircleOutlined,
    FilePdfOutlined,
    TeamOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { getMemberById, deleteMember, removeMinistryMember } from '../../services/api';
import type { MemberDetailProps, Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import './MemberDetail.css';

const MemberDetail = ({ memberId: memberIdProp, initialMember = null }: MemberDetailProps) => {
    const params = useParams();
    const id = (memberIdProp || params?.id) as string;
    const router = useRouter();
    const [member, setMember] = useState<Member | null>(initialMember);
    const [loading, setLoading] = useState(initialMember === null);

    useEffect(() => {
        if (initialMember !== null) return;
        fetchMemberDetails();
    }, [id, initialMember]);

    const fetchMemberDetails = async () => {
        try {
            setLoading(true);
            const data = await getMemberById(id);
            setMember(data);
        } catch (error) {
            message.error('Failed to load member details');
            router.push('/members/manage');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMember(id);
            message.success('Member deleted successfully');
            router.push('/members/manage');
        } catch (error) {
            message.error('Failed to delete member');
        }
    };

    const handleRemoveMinistry = (ministryId: string, ministryName: string) => {
        Modal.confirm({
            title: 'Remove from Ministry',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to remove this member from "${ministryName}"?`,
            okText: 'Remove',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await removeMinistryMember(ministryId, id);
                    message.success(`Removed from ${ministryName}`);
                    fetchMemberDetails();
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to remove from ministry'));
                }
            },
        });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
        );
    }

    if (!member) return null;

    const fullName = `${member.first_name} ${member.middle_name ? member.middle_name + ' ' : ''}${member.last_name}`;

    return (
        <div className="member-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#1565c0' }}
                >
                    Back to Members
                </Button>

                <div className="content-card-unified">
                    {/* Unified Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={120}
                            src={member.image_url ? (member.image_url.startsWith('http') ? member.image_url : `http://localhost:3000${member.image_url.startsWith('/') ? '' : '/'}${member.image_url}`) : undefined}
                            icon={<UserOutlined />}
                            className="member-profile-image"
                            style={{ fontSize: '60px' }}
                        />
                        <div className="member-header-info">
                            <h1 className="member-name">{fullName}</h1>
                            <div className="member-role-tags">
                                <Tag
                                    icon={member.status === 'active' ? <CheckCircleOutlined /> : <UserOutlined />}
                                    color={member.status === 'active' ? 'success' : 'error'}
                                    style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {member.status === 'active' ? 'Active Member' : 'Inactive Member'}
                                </Tag>

                            </div>
                        </div>
                        <div className="member-actions-stacked">
                            <Button type="primary" icon={<PrinterOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => window.print()}>Print</Button>
                            <Button type="primary" icon={<EditOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => router.push(`/members/edit/${id}`)}>Edit</Button>
                            <Popconfirm
                                title="Delete Member"
                                description="Are you sure you want to delete this member?"
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
                                            <td>{member.email || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><PhoneOutlined /> Phone</th>
                                            <td>{member.phone || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><EnvironmentOutlined /> Address</th>
                                            <td>{member.address || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><CalendarOutlined /> Date of Birth</th>
                                            <td>{member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><UserOutlined /> Marital Status</th>
                                            <td>{member.marital_status || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><CheckCircleOutlined /> Baptized</th>
                                            <td>
                                                {member.baptized === true || member.baptized === 'true' ? (
                                                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: '2px 8px', borderRadius: '4px' }}>
                                                        Yes
                                                    </Tag>
                                                ) : (
                                                    <Tag color="default" style={{ padding: '2px 8px', borderRadius: '4px' }}>
                                                        No
                                                    </Tag>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><FilePdfOutlined /> Church Letter</th>
                                            <td>
                                                {member.document_url ? <a href={member.document_url.startsWith('http') ? member.document_url : `http://localhost:3000${member.document_url.startsWith('/') ? '' : '/'}${member.document_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>View Document</a> : 'N/A'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0 }}><TeamOutlined style={{ marginRight: '8px', color: '#1565c0' }} />Ministry Involvement ({member.ministry_members?.length || 0})</h3>
                                </div>

                                <div style={{ marginTop: '16px' }}>
                                    <List
                                        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
                                        dataSource={member.ministry_members || []}
                                        locale={{ emptyText: 'Not involved in any ministries.' }}
                                        renderItem={(mm) => {
                                            const isLeader = mm.ministry?.leader_id === member.id;
                                            return (
                                                <List.Item>
                                                    <Card
                                                        hoverable
                                                        className="member-card-elegant"
                                                        actions={[
                                                            <Tooltip key="view" title="View Ministry">
                                                                <Button
                                                                    type="text"
                                                                    icon={<InfoCircleOutlined style={{ color: '#1565c0', fontSize: '18px' }} />}
                                                                    onClick={() => router.push(`/ministries/details/${mm.ministry_id}`)}
                                                                />
                                                            </Tooltip>
                                                        ]}
                                                        bodyStyle={{ padding: '20px', position: 'relative' }}
                                                    >
                                                        <Tooltip title="Remove from Ministry">
                                                            <Button
                                                                type="text"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveMinistry(mm.ministry_id ?? '', mm.ministry?.name ?? 'Ministry');
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Card.Meta
                                                            avatar={<Avatar size={64} icon={<TeamOutlined />} style={{ border: '2px solid #f0f2f5', backgroundColor: '#e3f2fd', color: '#1565c0' }} />}
                                                            title={<span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--navy)' }}>{mm.ministry?.name}</span>}
                                                            description={
                                                                <div style={{ marginTop: '4px' }}>
                                                                    {isLeader && (
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <Tag
                                                                                icon={<UserOutlined />}
                                                                                color="#1565c0"
                                                                                style={{
                                                                                    fontWeight: 700,
                                                                                    borderRadius: '4px',
                                                                                    margin: '0 6px',
                                                                                    padding: '2px 10px',
                                                                                    fontSize: '11px',
                                                                                    letterSpacing: '0.05em',
                                                                                    textTransform: 'uppercase'
                                                                                }}
                                                                            >
                                                                                Ministry Leader
                                                                            </Tag>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                                                        <CalendarOutlined style={{ fontSize: '12px' }} />
                                                                        <span>{mm.ministry?.schedule || 'No schedule set'}</span>
                                                                    </div>
                                                                    <div style={{ marginTop: '8px' }}>
                                                                        <Tag color="blue" style={{ borderRadius: '4px', backgroundColor: '#e3f2fd', color: '#1565c0', borderColor: '#e3f2fd' }}>Joined: {mm.joined_at ? new Date(mm.joined_at).toLocaleDateString() : 'N/A'}</Tag>
                                                                    </div>
                                                                </div>
                                                            }
                                                        />
                                                    </Card>
                                                </List.Item>
                                            );
                                        }}
                                    />
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
                                            children: `Member registered on ${member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}`,
                                        },
                                        ...(member.ministry_members || []).map(mm => ({
                                            color: 'blue' as const,
                                            children: `Joined ${mm.ministry?.name || 'Ministry'} on ${mm.joined_at ? new Date(mm.joined_at).toLocaleDateString() : 'Unknown'}`
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
                </div>
            </div>
    );
};

export default MemberDetail;
