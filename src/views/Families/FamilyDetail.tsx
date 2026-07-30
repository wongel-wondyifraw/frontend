'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  addFamilyChild,
  deleteFamily,
  deleteFamilyChild,
  getFamilyById,
  updateFamilyChild,
} from '../../services/api';
import type { Family, FamilyChild, FamilyDetailProps } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { LeaderNameWithTag, leaderDisplayName } from '../../Components/common/LeaderLabel';
import { useCan } from '@/Components/auth/Can';
import './FamilyDetail.css';

function ageGroupLabel(age: number) {
  if (age < 10) return 'Below 10';
  if (age <= 19) return 'Teenage';
  return 'Above 20';
}

function spousePath(id: string, type?: string) {
  return type === 'minister' ? `/ministers/details/${id}` : `/members/details/${id}`;
}

const FamilyDetail = ({ familyId: familyIdProp, initialFamily = null }: FamilyDetailProps) => {
  const params = useParams();
  const id = (familyIdProp || params?.id) as string;
  const router = useRouter();
  const canUpdate = useCan('families.update');
  const canDelete = useCan('families.delete');

  const [family, setFamily] = useState<Family | null>(initialFamily);
  const [loading, setLoading] = useState(initialFamily === null);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<FamilyChild | null>(null);
  const [childSubmitting, setChildSubmitting] = useState(false);
  const [childForm] = Form.useForm();

  const loadFamily = useCallback(async () => {
    try {
      setLoading(true);
      setFamily(await getFamilyById(id));
    } catch {
      message.error('Failed to load family details');
      router.push('/families');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (initialFamily !== null) return;
    loadFamily();
  }, [initialFamily, loadFamily]);

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Family?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Delete "${family?.name || 'this family'}" and all children records?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteFamily(id);
          message.success('Family deleted');
          router.push('/families');
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete family'));
        }
      },
    });
  };

  const openAddChild = () => {
    setEditingChild(null);
    setChildModalOpen(true);
  };

  const openEditChild = (child: FamilyChild) => {
    setEditingChild(child);
    setChildModalOpen(true);
  };

  const syncChildForm = (open: boolean) => {
    if (!open) return;
    if (editingChild) {
      childForm.setFieldsValue({ name: editingChild.name, age: editingChild.age });
    } else {
      childForm.resetFields();
    }
  };

  const submitChild = async () => {
    try {
      const values = await childForm.validateFields();
      setChildSubmitting(true);
      if (editingChild) {
        await updateFamilyChild(id, editingChild.id, values);
        message.success('Child updated');
      } else {
        await addFamilyChild(id, values);
        message.success('Child added');
      }
      setChildModalOpen(false);
      await loadFamily();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to save child'));
    } finally {
      setChildSubmitting(false);
    }
  };

  const handleDeleteChild = (child: FamilyChild) => {
    Modal.confirm({
      title: 'Remove child?',
      content: `Remove ${child.name} from this family?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteFamilyChild(id, child.id);
          message.success('Child removed');
          await loadFamily();
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to remove child'));
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

  if (!family) return null;

  const children = family.children || [];

  const childColumns: ColumnsType<FamilyChild> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      render: (age: number) => (
        <Space>
          <span>{age}</span>
          <Tag>{ageGroupLabel(age)}</Tag>
        </Space>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_: unknown, record: FamilyChild) =>
        canUpdate ? (
          <Space>
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} onClick={() => openEditChild(record)} />
            </Tooltip>
            <Tooltip title="Remove">
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteChild(record)} />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      <div className="ministry-detail-container">
        <Breadcrumb
          style={{ marginBottom: 16, fontSize: 14 }}
          items={[
            {
              title: (
                <a onClick={() => router.push('/families')} style={{ color: '#1565c0', cursor: 'pointer' }}>
                  Families
                </a>
              ),
            },
            { title: family.name || 'Family' },
          ]}
        />

        <div className="content-card-unified">
          <div className="ministry-header-section">
            <div className="ministry-icon-bg">
              <TeamOutlined />
            </div>
            <div className="ministry-info-simple">
              <h1>{family.name || 'Family'}</h1>
              <div className="ministry-meta-simple">
                <span>
                  <ManOutlined /> Husband: <LeaderNameWithTag leader={family.husband} />
                </span>
                <span>
                  <WomanOutlined /> Wife: <LeaderNameWithTag leader={family.wife} />
                </span>
                <span>
                  <UserOutlined /> {children.length} child{children.length === 1 ? '' : 'ren'}
                </span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canUpdate && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  style={{ background: '#1565c0', borderColor: '#1565c0' }}
                  onClick={() => router.push(`/families/edit/${id}`)}
                >
                  Edit Family
                </Button>
              )}
              {canDelete && (
                <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="ministry-content-grid">
            <div className="left-column">
              <div className="detail-section">
                <h3>Spouses</h3>
                <div className="ministry-members-grid">
                  {family.husband && (
                    <Card
                      hoverable
                      className="member-card-elegant"
                      onClick={() => router.push(spousePath(family.husband_id, family.husband_type))}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Card.Meta
                        avatar={<Avatar size={56} icon={<ManOutlined />} style={{ background: '#e3f2fd', color: '#1565c0' }} />}
                        title={leaderDisplayName(family.husband)}
                        description={
                          <Space wrap>
                            <Tag>Husband</Tag>
                            <Tag color={family.husband.type === 'minister' ? 'purple' : 'blue'}>
                              {family.husband.type === 'minister' ? 'Minister' : 'Member'}
                            </Tag>
                          </Space>
                        }
                      />
                    </Card>
                  )}
                  {family.wife && (
                    <Card
                      hoverable
                      className="member-card-elegant"
                      onClick={() => router.push(spousePath(family.wife_id, family.wife_type))}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Card.Meta
                        avatar={<Avatar size={56} icon={<WomanOutlined />} style={{ background: '#fce7f3', color: '#be185d' }} />}
                        title={leaderDisplayName(family.wife)}
                        description={
                          <Space wrap>
                            <Tag>Wife</Tag>
                            <Tag color={family.wife.type === 'minister' ? 'purple' : 'blue'}>
                              {family.wife.type === 'minister' ? 'Minister' : 'Member'}
                            </Tag>
                          </Space>
                        }
                      />
                    </Card>
                  )}
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="detail-section">
                <h3>Details</h3>
                <div className="info-row">
                  <span className="info-label">Family name</span>
                  <span className="info-value">{family.name || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Notes</span>
                  <span className="info-value">{family.notes || 'No notes'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Created</span>
                  <span className="info-value">
                    {family.created_at ? new Date(family.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 8, color: '#1565c0' }} />
                Children ({children.length})
              </h3>
              {canUpdate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openAddChild}
                  style={{ background: '#1565c0', borderColor: '#1565c0' }}
                >
                  Add Child
                </Button>
              )}
            </div>

            {children.length === 0 ? (
              <Empty description="No children added yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                rowKey="id"
                columns={childColumns}
                dataSource={children}
                pagination={false}
                size="middle"
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        title={editingChild ? 'Edit Child' : 'Add Child'}
        open={childModalOpen}
        onCancel={() => setChildModalOpen(false)}
        onOk={submitChild}
        confirmLoading={childSubmitting}
        okText={editingChild ? 'Save' : 'Add'}
        destroyOnHidden
        afterOpenChange={syncChildForm}
      >
        <Form form={childForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Child name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item name="age" label="Age" rules={[{ required: true, message: 'Age is required' }]}>
            <InputNumber min={0} max={120} style={{ width: '100%' }} placeholder="Age in years" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FamilyDetail;
