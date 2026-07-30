'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, message, Modal, Spin, Breadcrumb, Tag, Avatar, Form, Select, Card, Tooltip, Empty } from 'antd';
import {
    TeamOutlined,
    CalendarOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    MailOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { getMinistry, deleteMinistry, getMinistryMembers, getMembersList, addMinistryMember } from '../../services/api';
import type { MinistryDetailProps, Ministry, MinistryMember, Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import './MinistryDetail.css';

const { Option } = Select;

const MinistryDetail = ({ ministryId: ministryIdProp, initialMinistry = null }: MinistryDetailProps) => {
    const params = useParams();
    const id = (ministryIdProp || params?.id) as string;
    const router = useRouter();
    const [ministry, setMinistry] = useState<Ministry | null>(initialMinistry);
    const [loading, setLoading] = useState(initialMinistry === null);
    const [ministryMembers, setMinistryMembers] = useState<MinistryMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // Add Member Modal State
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [addingMember, setAddingMember] = useState(false);
    const [form] = Form.useForm();

    const loadMinistry = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMinistry(id);
            setMinistry(data);
        } catch (error) {
            message.error('Failed to load ministry details');
            router.push('/ministries/manage');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const loadMinistryMembers = useCallback(async () => {
        try {
            setMembersLoading(true);
            const data = await getMinistryMembers(id);
            setMinistryMembers(data);
        } catch (error) {
            console.warn('Failed to load ministry members:', error);
        } finally {
            setMembersLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (initialMinistry !== null) {
            loadMinistryMembers();
            return;
        }
        loadMinistry();
        loadMinistryMembers();
    }, [initialMinistry, loadMinistry, loadMinistryMembers]);

    const loadAllMembers = async () => {
        try {
            const data = await getMembersList();
            setAllMembers(data);
        } catch (error) {
            console.warn('Failed to load members for add modal:', error);
        }
    };

    const openAddMemberModal = async () => {
        setIsAddModalVisible(true);
        if (allMembers.length === 0) {
            await loadAllMembers();
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete Ministry?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete "${ministry?.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMinistry(id);
                    message.success('Ministry deleted successfully');
                    router.push('/ministries/manage');
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to delete ministry'));
                }
            },
        });
    };

    const handleAddMember = async (values: { member_id: string }) => {
        try {
            setAddingMember(true);
            await addMinistryMember(id, values.member_id);
            message.success('Member added successfully');
            form.resetFields();
            setIsAddModalVisible(false);
            loadMinistryMembers();
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to add member to ministry'));
        } finally {
            setAddingMember(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!ministry) return null;

    // Filter out members that are already in the ministry
    const availableMembers = allMembers.filter(
        m => !ministryMembers.some(mm => mm.member_id === m.id)
    );

    return (
        <>
        <div className="ministry-detail-container">
                {/* Breadcrumb */}
                <Breadcrumb
                    style={{ marginBottom: '16px', fontSize: '14px' }}
                    items={[
                        {
                            title: <a onClick={() => router.push('/ministries/manage')} style={{ color: '#1565c0', cursor: 'pointer' }}>Ministries</a>,
                        },
                        {
                            title: ministry.name,
                        },
                    ]}
                />

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
                                    <UserOutlined /> Leader:{' '}
                                    <LeaderNameWithTag leader={ministry.leader} />
                                </span>
                                {ministry.schedule && (
                                    <span><CalendarOutlined /> {ministry.schedule}</span>
                                )}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                style={{ background: '#1565c0', borderColor: '#1565c0' }}
                                onClick={() => router.push(`/ministries/edit/${id}`)}
                            >
                                Edit Ministry
                            </Button>
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="ministry-content-grid">
                        <div className="left-column">
                            <div className="detail-section">
                                <h3>About this Ministry</h3>
                                <p style={{ lineHeight: '1.6', color: '#475569' }}>
                                    {ministry.about || 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="detail-section">
                                <h3>Details</h3>
                                <div className="info-row">
                                    <span className="info-label"><UserOutlined /> Leader</span>
                                    <span className="info-value"><LeaderNameWithTag leader={ministry.leader} /></span>
                                </div>
                                {ministry.leader?.email && (
                                    <div className="info-row">
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{ministry.leader.email}</span>
                                    </div>
                                )}
                                {ministry.leader?.phone && (
                                    <div className="info-row">
                                        <span className="info-label">Phone</span>
                                        <span className="info-value">{ministry.leader.phone}</span>
                                    </div>
                                )}
                                <div className="info-row">
                                    <span className="info-label"><CalendarOutlined /> Schedule</span>
                                    <span className="info-value">{ministry.schedule || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Created</span>
                                    <span className="info-value">
                                        {ministry.created_at ? new Date(ministry.created_at).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members Section - Sophisticated Card Layout */}
                    <div className="detail-section" style={{ marginTop: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}><TeamOutlined style={{ marginRight: '8px', color: '#1565c0' }} />Ministry Members ({ministryMembers.length})</h3>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openAddMemberModal}
                                style={{ background: '#1565c0', borderColor: '#1565c0' }} // Changed to Consistent Blue
                            >
                                Add Member
                            </Button>
                        </div>

                        {membersLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                <Spin />
                            </div>
                        ) : ministryMembers.length === 0 ? (
                            <Empty description="No members assigned to this ministry yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <div className="ministry-members-grid">
                                {ministryMembers.map((record) => {
                                    const member = record.member;
                                    if (!member) return null;
                                    return (
                                        <Card
                                            key={record.member_id || member.id}
                                            hoverable
                                            className="member-card-elegant"
                                            actions={[
                                                <Tooltip key="view" title="View Profile">
                                                    <Button
                                                        type="text"
                                                        icon={<InfoCircleOutlined style={{ color: '#1565c0', fontSize: '18px' }} />}
                                                        onClick={() => router.push(`/members/details/${member.id}`)}
                                                    />
                                                </Tooltip>
                                            ]}
                                            styles={{ body: { padding: '20px' } }}
                                        >
                                            <Card.Meta
                                                avatar={<Avatar size={64} src={member.image_url} icon={<UserOutlined />} style={{ border: '2px solid #f0f2f5' }} />}
                                                title={<span style={{ fontWeight: 600, fontSize: '16px' }}>{member.first_name} {member.last_name}</span>}
                                                description={
                                                    <div style={{ marginTop: '4px' }}>
                                                        <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                                            <MailOutlined style={{ fontSize: '12px' }} />
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {member.email || 'No email'}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                                            <PhoneOutlined style={{ fontSize: '12px' }} />
                                                            <span>{member.phone || 'No phone'}</span>
                                                        </div>
                                                        <div style={{ marginTop: '8px' }}>
                                                            <Tag color="blue">Joined: {record.joined_at ? new Date(record.joined_at).toLocaleDateString() : 'N/A'}</Tag>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            <Modal
                title="Add Member to Ministry"
                open={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                footer={null}
                forceRender
            >
                <Form form={form} layout="vertical" onFinish={handleAddMember}>
                    <Form.Item
                        name="member_id"
                        label="Select Member"
                        rules={[{ required: true, message: 'Please select a member to add' }]}
                    >
                        <Select
                            placeholder="Search and select a member"
                            size="large"
                            showSearch
                            allowClear
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {availableMembers.map(member => (
                                <Option key={member.id} value={member.id}>
                                    {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                        <Button onClick={() => setIsAddModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={addingMember} style={{ background: '#1565c0', borderColor: '#1565c0' }}>
                            Add Member
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

export default MinistryDetail;
