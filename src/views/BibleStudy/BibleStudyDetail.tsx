'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Modal, Spin, Breadcrumb, Tag, Avatar, Form, Card, Tooltip, Empty } from 'antd';
import { message } from '@/lib/app-message';
import {
  TeamOutlined, CalendarOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  PlusOutlined, InfoCircleOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
  BookOutlined, FileTextOutlined, LinkOutlined,
} from '@ant-design/icons';
import {
  getBibleStudy, deleteBibleStudy, getBibleStudyMembers, addBibleStudyMember,
} from '../../services/api';
import type { BibleStudyDetailProps, BibleStudy, BibleStudyMember } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { getImageUrl } from '@/lib/media-url';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import MemberSearchSelect from '../../Components/common/MemberSearchSelect';
import './BibleStudyDetail.css';

const BibleStudyDetail = ({ bibleStudyId: bibleStudyIdProp, initialBibleStudy = null }: BibleStudyDetailProps) => {
  const params = useParams();
  const id = (bibleStudyIdProp || params?.id) as string;
  const router = useRouter();
  const [study, setStudy] = useState<BibleStudy | null>(initialBibleStudy);
  const [loading, setLoading] = useState(initialBibleStudy === null);
  const [groupMembers, setGroupMembers] = useState<BibleStudyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [form] = Form.useForm();

  const loadStudy = useCallback(async () => {
    try {
      setLoading(true);
      setStudy(await getBibleStudy(id));
    } catch {
      message.error('Failed to load Bible study details');
      router.push('/bible-study');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const loadMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setGroupMembers(await getBibleStudyMembers(id));
    } catch (error) {
      console.warn('Failed to load Bible study members:', error);
    } finally {
      setMembersLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (initialBibleStudy !== null) {
      loadMembers();
      return;
    }
    loadStudy();
    loadMembers();
  }, [initialBibleStudy, loadStudy, loadMembers]);

  const openAddMemberModal = async () => {
    setIsAddModalVisible(true);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Bible Study?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete "${study?.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteBibleStudy(id);
          message.success('Bible study deleted successfully');
          router.push('/bible-study');
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete Bible study'));
        }
      },
    });
  };

  const handleAddMember = async (values: { member_id: string }) => {
    try {
      setAddingMember(true);
      await addBibleStudyMember(id, values.member_id);
      message.success('Member added successfully');
      form.resetFields();
      setIsAddModalVisible(false);
      loadMembers();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to add member'));
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

  if (!study) return null;

  const excludeMemberIds = groupMembers.map((mm) => mm.member_id);
  const materialHref = study.material_url ? getImageUrl(study.material_url) : null;

  return (
    <>
      <div className="ministry-detail-container">
        <Breadcrumb
          style={{ marginBottom: 16, fontSize: 14 }}
          items={[
            { title: <a onClick={() => router.push('/bible-study')} style={{ color: '#1565c0', cursor: 'pointer' }}>Bible Studies</a> },
            { title: study.name },
          ]}
        />

        <div className="content-card-unified">
          <div className="ministry-header-section">
            <div className="ministry-icon-bg"><BookOutlined /></div>
            <div className="ministry-info-simple">
              <h1>{study.name}</h1>
              <div className="ministry-meta-simple">
                <span><UserOutlined /> Leader: <LeaderNameWithTag leader={study.leader} /></span>
                <span><EnvironmentOutlined /> {study.location}</span>
                {study.schedule && <span><CalendarOutlined /> {study.schedule}</span>}
                {study.content_type === 'book' ? (
                  <Tag icon={<BookOutlined />} color="blue">{study.bible_book}</Tag>
                ) : (
                  <Tag icon={<FileTextOutlined />} color="purple">Study Material</Tag>
                )}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button type="primary" icon={<EditOutlined />} style={{ background: '#1565c0', borderColor: '#1565c0' }}
                onClick={() => router.push(`/bible-study/edit/${id}`)}>
                Edit Bible Study
              </Button>
              <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>Delete</Button>
            </div>
          </div>

          <div className="ministry-content-grid">
            <div className="left-column">
              <div className="detail-section">
                <h3>About this Bible Study</h3>
                <p style={{ lineHeight: 1.6, color: '#475569' }}>{study.about || 'No description provided.'}</p>
              </div>
              <div className="detail-section">
                <h3>Study Content</h3>
                {study.content_type === 'book' ? (
                  <div className="info-row">
                    <span className="info-label"><BookOutlined /> Bible Book</span>
                    <span className="info-value" style={{ fontWeight: 600 }}>{study.bible_book}</span>
                  </div>
                ) : (
                  <>
                    <div className="info-row">
                      <span className="info-label"><FileTextOutlined /> Type</span>
                      <span className="info-value">Study Material</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label"><LinkOutlined /> Attachment</span>
                      <span className="info-value">
                        {materialHref ? (
                          <a href={materialHref} target="_blank" rel="noopener noreferrer" style={{ color: '#1565c0', fontWeight: 600 }}>
                            View / Download Material
                          </a>
                        ) : 'No material attached'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="right-column">
              <div className="detail-section">
                <h3>Details</h3>
                <div className="info-row">
                  <span className="info-label"><UserOutlined /> Leader</span>
                  <span className="info-value"><LeaderNameWithTag leader={study.leader} /></span>
                </div>
                {study.leader?.email && (
                  <div className="info-row"><span className="info-label">Email</span><span className="info-value">{study.leader.email}</span></div>
                )}
                {study.leader?.phone && (
                  <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{study.leader.phone}</span></div>
                )}
                <div className="info-row">
                  <span className="info-label"><EnvironmentOutlined /> Location</span>
                  <span className="info-value">{study.location}</span>
                </div>
                <div className="info-row">
                  <span className="info-label"><CalendarOutlined /> Schedule</span>
                  <span className="info-value">{study.schedule || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 8, color: '#1565c0' }} />
                Members ({groupMembers.length})
              </h3>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddMemberModal}
                style={{ background: '#1565c0', borderColor: '#1565c0' }}>
                Add Member
              </Button>
            </div>
            {membersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin /></div>
            ) : groupMembers.length === 0 ? (
              <Empty description="No members assigned yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="ministry-members-grid">
                {groupMembers.map((record) => {
                  const member = record.member;
                  if (!member) return null;
                  return (
                    <Card
                      key={record.member_id}
                      hoverable
                      className="member-card-elegant"
                      actions={[
                        <Tooltip key="view" title="View Profile">
                          <Button type="text" icon={<InfoCircleOutlined style={{ color: '#1565c0', fontSize: 18 }} />}
                            onClick={() => router.push(`/members/details/${member.id}`)} />
                        </Tooltip>,
                      ]}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Card.Meta
                        avatar={<Avatar size={64} src={member.image_url} icon={<UserOutlined />} />}
                        title={<span style={{ fontWeight: 600 }}>{member.first_name} {member.last_name}</span>}
                        description={
                          <div style={{ marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                              <MailOutlined /> {member.email || 'No email'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                              <PhoneOutlined /> {member.phone || 'No phone'}
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

      <Modal title="Add Member to Bible Study" open={isAddModalVisible} onCancel={() => setIsAddModalVisible(false)} footer={null} forceRender>
        <Form form={form} layout="vertical" onFinish={handleAddMember}>
          <Form.Item name="member_id" label="Select Member" rules={[{ required: true }]}>
            <MemberSearchSelect excludeIds={excludeMemberIds} placeholder="Type to search members" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setIsAddModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addingMember} style={{ background: '#1565c0' }}>Add Member</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default BibleStudyDetail;
