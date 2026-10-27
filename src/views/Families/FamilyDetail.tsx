'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  App,
  Avatar,
  Breadcrumb,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import { message } from '@/lib/app-message';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '@/Components/common/TableRowActions';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  HeartOutlined,
  RightOutlined,
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
import { leaderDisplayName } from '../../Components/common/LeaderLabel';
import { useCan } from '@/Components/auth/Can';
import './FamilyDetail.css';

function ageGroupLabel(age: number) {
  if (age < 10) return 'Below 10';
  if (age <= 19) return 'Teenage';
  return 'Above 20';
}

function spousePath(id: string | null | undefined, type?: string | null) {
  if (!id) return '#';
  return type === 'minister' ? `/ministers/details/${id}` : `/members/details/${id}`;
}

const FamilyDetail = ({ familyId: familyIdProp, initialFamily = null }: FamilyDetailProps) => {
  const params = useParams();
  const id = (familyIdProp || params?.id) as string;
  const router = useRouter();
  const canUpdate = useCan('families.update');
  const canDelete = useCan('families.delete');

  const { modal } = App.useApp();
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
    modal.confirm({
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
      childForm.setFieldsValue({ 
        name: editingChild.name, 
        age: editingChild.age, 
        date_of_birth: editingChild.date_of_birth ? editingChild.date_of_birth.substring(0, 10) : undefined 
      });
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
    modal.confirm({
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
      key: 'age',
      render: (record: FamilyChild) => {
        let displayAge = record.age ?? 0;
        if (record.date_of_birth) {
            const birthDate = new Date(record.date_of_birth);
            const today = new Date();
            let ageNum = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                ageNum--;
            }
            displayAge = ageNum;
        }
        return (
          <Space>
            <span>{displayAge}</span>
            <Tag>{ageGroupLabel(displayAge)}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Action',
            key: 'action',
            ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: FamilyChild) =>
        canUpdate ? (
          <TableRowActions
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditOutlined />,
                onClick: () => openEditChild(record),
              },
              {
                key: 'remove',
                label: 'Remove',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteChild(record),
              },
            ]}
          />
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
              <div className="family-header-meta">
                <div className="family-meta-item">
                  <TeamOutlined style={{ color: '#64748b' }} />
                  <span>{children.length} {children.length === 1 ? 'child' : 'children'}</span>
                </div>
              </div>
            </div>
            <div className="family-header-actions">
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
                <div className="spouses-stack">
                  {family.husband && (
                    <div
                      key="husband"
                      className="spouse-item clickable"
                      onClick={() => router.push(spousePath(family.husband_id, family.husband_type))}
                    >
                      <div className="spouse-info">
                        <Avatar
                          size={36}
                          icon={<ManOutlined />}
                          style={{ background: '#e3f2fd', color: '#1565c0' }}
                        />
                        <div>
                          <div className="spouse-name">
                            {leaderDisplayName(family.husband)}
                          </div>
                          <div className="spouse-meta">
                            Husband
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1565c0', fontSize: 13, fontWeight: 500 }}>
                        <span>View Profile</span>
                        <RightOutlined style={{ fontSize: 11 }} />
                      </div>
                    </div>
                  )}
                  {family.wife && (
                    <div
                      key="wife"
                      className="spouse-item clickable"
                      onClick={() => router.push(spousePath(family.wife_id, family.wife_type))}
                    >
                      <div className="spouse-info">
                        <Avatar
                          size={36}
                          icon={<WomanOutlined />}
                          style={{ background: '#fce7f3', color: '#be185d' }}
                        />
                        <div>
                          <div className="spouse-name">
                            {leaderDisplayName(family.wife)}
                          </div>
                          <div className="spouse-meta">
                            Wife
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1565c0', fontSize: 13, fontWeight: 500 }}>
                        <span>View Profile</span>
                        <RightOutlined style={{ fontSize: 11 }} />
                      </div>
                    </div>
                  )}
                  {family.spouse_status === 'external' && family.external_spouse_name && (
                    <div key="external" className="spouse-item">
                      <div className="spouse-info">
                        <Avatar
                          size={36}
                          icon={<UserOutlined />}
                          style={{ background: '#ecfeff', color: '#0891b2' }}
                        />
                        <div>
                          <div className="spouse-name">
                            {family.external_spouse_name}
                          </div>
                          <div className="spouse-meta">
                            External Spouse{family.external_spouse_phone ? ` · ${family.external_spouse_phone}` : ''}{family.external_spouse_church ? ` · ${family.external_spouse_church}` : ''}
                          </div>
                        </div>
                      </div>
                      <Tag color="cyan">External</Tag>
                    </div>
                  )}
                  {family.spouse_status === 'pending' && (!family.husband || !family.wife) && (
                    <div
                      key="pending"
                      className="spouse-item"
                      style={{ border: '1px dashed #f59e0b', background: '#fffdfa' }}
                    >
                      <div className="spouse-info">
                        <Avatar
                          size={36}
                          icon={<HeartOutlined />}
                          style={{ background: '#fffbeb', color: '#d97706' }}
                        />
                        <div>
                          <div className="spouse-name" style={{ color: '#92400e' }}>
                            {!family.husband ? 'Husband (Pending)' : 'Wife (Pending)'}
                          </div>
                          <div className="spouse-meta" style={{ color: '#b45309' }}>
                            Spouse information was skipped
                          </div>
                        </div>
                      </div>
                      <Tag color="orange">Pending</Tag>
                    </div>
                  )}
                  {family.spouse_status === 'none' && (!family.husband || !family.wife) && (
                    <div
                      key="single-parent"
                      className="spouse-item"
                      style={{ border: '1px dashed #cbd5e1', background: '#f8fafc' }}
                    >
                      <div className="spouse-info">
                        <Avatar
                          size={36}
                          icon={<UserOutlined />}
                          style={{ background: '#f1f5f9', color: '#64748b' }}
                        />
                        <div>
                          <div className="spouse-name">
                            Single Parent
                          </div>
                          <div className="spouse-meta">
                            {family.wife ? 'Single mother household' : 'Single father household'}
                          </div>
                        </div>
                      </div>
                      <Tag color={family.wife ? 'magenta' : 'blue'}>
                        {family.wife ? 'Single mom' : 'Single dad'}
                      </Tag>
                    </div>
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
                scroll={{ x: true }}
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
          <Form.Item name="date_of_birth" label="Date of Birth (Dynamic Age)">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="age" label="Age (Static fallback)">
            <InputNumber min={0} max={120} style={{ width: '100%' }} placeholder="Age in years" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FamilyDetail;
