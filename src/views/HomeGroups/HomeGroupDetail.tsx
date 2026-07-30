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
  EnvironmentOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import {
  getHomeGroup,
  deleteHomeGroup,
  getHomeGroupMembers,
  getMembersList,
  addHomeGroupMember,
} from '../../services/api';
import type { HomeGroupDetailProps, HomeGroup, HomeGroupMember, Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import './HomeGroupDetail.css';

const { Option } = Select;

const HomeGroupDetail = ({ homeGroupId: homeGroupIdProp, initialHomeGroup = null }: HomeGroupDetailProps) => {
  const params = useParams();
  const id = (homeGroupIdProp || params?.id) as string;
  const router = useRouter();
  const [homeGroup, setHomeGroup] = useState<HomeGroup | null>(initialHomeGroup);
  const [loading, setLoading] = useState(initialHomeGroup === null);
  const [groupMembers, setGroupMembers] = useState<HomeGroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [form] = Form.useForm();

  const loadHomeGroup = useCallback(async () => {
    try {
      setLoading(true);
      setHomeGroup(await getHomeGroup(id));
    } catch {
      message.error('Failed to load home group details');
      router.push('/members/home-groups');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const loadGroupMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setGroupMembers(await getHomeGroupMembers(id));
    } catch (error) {
      console.warn('Failed to load home group members:', error);
    } finally {
      setMembersLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (initialHomeGroup !== null) {
      loadGroupMembers();
      return;
    }
    loadHomeGroup();
    loadGroupMembers();
  }, [initialHomeGroup, loadHomeGroup, loadGroupMembers]);

  const openAddMemberModal = async () => {
    setIsAddModalVisible(true);
    if (allMembers.length === 0) {
      try {
        setAllMembers(await getMembersList());
      } catch {
        console.warn('Failed to load members for add modal');
      }
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Home Group?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete "${homeGroup?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteHomeGroup(id);
          message.success('Home group deleted successfully');
          router.push('/members/home-groups');
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete home group'));
        }
      },
    });
  };

  const handleAddMember = async (values: { member_id: string }) => {
    try {
      setAddingMember(true);
      await addHomeGroupMember(id, values.member_id);
      message.success('Member added successfully');
      form.resetFields();
      setIsAddModalVisible(false);
      loadGroupMembers();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to add member to home group'));
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

  if (!homeGroup) return null;

  const availableMembers = allMembers.filter(
    (m) => !groupMembers.some((mm) => mm.member_id === m.id),
  );

  return (
    <>
      <div className="ministry-detail-container">
        <Breadcrumb
          style={{ marginBottom: 16, fontSize: 14 }}
          items={[
            {
              title: (
                <a onClick={() => router.push('/members/home-groups')} style={{ color: '#1565c0', cursor: 'pointer' }}>
                  Home Groups
                </a>
              ),
            },
            { title: homeGroup.name },
          ]}
        />

        <div className="content-card-unified">
          <div className="ministry-header-section">
            <div className="ministry-icon-bg">
              <HomeOutlined />
            </div>
            <div className="ministry-info-simple">
              <h1>{homeGroup.name}</h1>
              <div className="ministry-meta-simple">
                <span>
                  <UserOutlined /> Leader:{' '}
                  <LeaderNameWithTag leader={homeGroup.leader} />
                </span>
                <span>
                  <EnvironmentOutlined /> {homeGroup.location}
                </span>
                {homeGroup.schedule && (
                  <span><CalendarOutlined /> {homeGroup.schedule}</span>
                )}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                style={{ background: '#1565c0', borderColor: '#1565c0' }}
                onClick={() => router.push(`/members/home-groups/edit/${id}`)}
              >
                Edit Home Group
              </Button>
              <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>

          <div className="ministry-content-grid">
            <div className="left-column">
              <div className="detail-section">
                <h3>About this Home Group</h3>
                <p style={{ lineHeight: 1.6, color: '#475569' }}>
                  {homeGroup.about || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="right-column">
              <div className="detail-section">
                <h3>Details</h3>
                <div className="info-row">
                  <span className="info-label"><UserOutlined /> Leader</span>
                  <span className="info-value"><LeaderNameWithTag leader={homeGroup.leader} /></span>
                </div>
                {homeGroup.leader?.email && (
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{homeGroup.leader.email}</span>
                  </div>
                )}
                {homeGroup.leader?.phone && (
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{homeGroup.leader.phone}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label"><EnvironmentOutlined /> Location</span>
                  <span className="info-value">{homeGroup.location}</span>
                </div>
                <div className="info-row">
                  <span className="info-label"><CalendarOutlined /> Schedule</span>
                  <span className="info-value">{homeGroup.schedule || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Created</span>
                  <span className="info-value">
                    {homeGroup.created_at ? new Date(homeGroup.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 8, color: '#1565c0' }} />
                Home Group Members ({groupMembers.length})
              </h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddMemberModal}
                style={{ background: '#1565c0', borderColor: '#1565c0' }}
              >
                Add Member
              </Button>
            </div>

            {membersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : groupMembers.length === 0 ? (
              <Empty description="No members assigned to this home group yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="ministry-members-grid">
                {groupMembers.map((record) => {
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
                            icon={<InfoCircleOutlined style={{ color: '#1565c0', fontSize: 18 }} />}
                            onClick={() => router.push(`/members/details/${member.id}`)}
                          />
                        </Tooltip>,
                      ]}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Card.Meta
                        avatar={<Avatar size={64} src={member.image_url} icon={<UserOutlined />} style={{ border: '2px solid #f0f2f5' }} />}
                        title={<span style={{ fontWeight: 600, fontSize: 16 }}>{member.first_name} {member.last_name}</span>}
                        description={
                          <div style={{ marginTop: 4 }}>
                            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                              <MailOutlined style={{ fontSize: 12 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.email || 'No email'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                              <PhoneOutlined style={{ fontSize: 12 }} />
                              <span>{member.phone || 'No phone'}</span>
                            </div>
                            <div style={{ marginTop: 8 }}>
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

      <Modal
        title="Add Member to Home Group"
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
              {availableMembers.map((member) => (
                <Option key={member.id} value={member.id}>
                  {member.first_name} {member.middle_name ? `${member.middle_name} ` : ''}{member.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button onClick={() => setIsAddModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addingMember} style={{ background: '#1565c0', borderColor: '#1565c0' }}>
              Add Member
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default HomeGroupDetail;
