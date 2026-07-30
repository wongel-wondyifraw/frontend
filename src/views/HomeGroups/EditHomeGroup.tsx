'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Select, Button, message, Row, Col, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberTransferList from '../../Components/common/MemberTransferList';
import {
  updateHomeGroup,
  getHomeGroup,
  getMembersList,
  getHomeGroupMembers,
  addHomeGroupMember,
  removeHomeGroupMember,
} from '../../services/api';
import type { Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import LeaderSelect, { decodeLeaderValue, encodeLeaderValue } from '../../Components/common/LeaderSelect';
import './AddHomeGroup.css';

const { Option } = Select;
const { TextArea } = Input;

const STEPS = [
  { title: 'Group Info' },
  { title: 'Leadership & Location' },
  { title: 'Manage Members' },
  { title: 'Review & Update' },
];

const STEP_BACKGROUNDS = [
  { background: '#f8fafc', border: 'none' },
  { background: '#f0f9ff', border: '1px solid #bae6fd' },
  { background: '#f0fdf4', border: '1px solid #bbf7d0' },
  { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const EditHomeGroup = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const initialMemberKeysRef = useRef<string[]>([]);
  const [groupData, setGroupData] = useState<{
    name: string;
    about?: string;
    schedule?: string;
    location?: string;
    leader_id?: string | null;
    leader_type?: 'member' | 'minister' | null;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [group, membersData, groupMembers] = await Promise.all([
          getHomeGroup(id),
          getMembersList(),
          getHomeGroupMembers(id),
        ]);
        setMembers(membersData);
        setGroupData({
          name: group.name,
          about: group.about,
          schedule: group.schedule,
          location: group.location,
          leader_id: group.leader_id || undefined,
          leader_type: group.leader_type || group.leader?.type || undefined,
        });
        const existingKeys = groupMembers.map((mm) => mm.member_id);
        setSelectedMemberKeys(existingKeys);
        initialMemberKeysRef.current = existingKeys;
      } catch (error: unknown) {
        message.error(getApiErrorMessage(error, 'Failed to load home group details'));
        router.push('/members/home-groups');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  useEffect(() => {
    if (initialLoading || !groupData) return;
    form.setFieldsValue({
      name: groupData.name,
      about: groupData.about,
      schedule: groupData.schedule,
      location: groupData.location,
      leader_key: encodeLeaderValue(groupData.leader_id, groupData.leader_type),
    });
  }, [initialLoading, groupData, form]);

  const handleStepClick = async (step: number) => {
    if (currentStep === 0 && step > 0) {
      try {
        await form.validateFields(['name']);
      } catch {
        message.error('Please correct the errors before proceeding.');
        return;
      }
    }
    if (currentStep === 1 && step > 1) {
      try {
        await form.validateFields(['location']);
      } catch {
        message.error('Please correct the errors before proceeding.');
        return;
      }
    }
    setCurrentStep(step);
  };

  const next = async () => {
    try {
      if (currentStep === 0) await form.validateFields(['name']);
      if (currentStep === 1) await form.validateFields(['location']);
      setCurrentStep(currentStep + 1);
    } catch {
      message.error('Please correct the errors before proceeding.');
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const leader = decodeLeaderValue(values.leader_key);
      await updateHomeGroup(id, {
        name: values.name,
        about: values.about || '',
        schedule: values.schedule || '',
        location: values.location,
        leader_id: leader.leader_id,
        leader_type: leader.leader_type,
      });

      const initialKeys = initialMemberKeysRef.current;
      const toAdd = selectedMemberKeys.filter((k) => !initialKeys.includes(k));
      const toRemove = initialKeys.filter((k) => !selectedMemberKeys.includes(k));

      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map((memberId) =>
            addHomeGroupMember(id, memberId).catch((err) => {
              console.warn(`Failed to add member ${memberId}:`, err);
            }),
          ),
        );
      }
      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map((memberId) =>
            removeHomeGroupMember(id, memberId).catch((err) => {
              console.warn(`Failed to remove member ${memberId}:`, err);
            }),
          ),
        );
      }

      message.success('Home group updated successfully');
      router.push('/members/home-groups');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update home group'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="add-ministry-container">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}>
        Back to Home Groups
      </Button>

      <div className="add-ministry-header">
        <h1>Edit Home Group</h1>
        <p>Update location, leadership, and members.</p>
      </div>

      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={prev}
            onCancel={() => router.back()}
            submitText="Confirm Update"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
            onStepClick={handleStepClick}
            lastStepLabel="Skip / Next"
          >
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HomeOutlined style={{ color: '#1565c0' }} /> Home Group Information
              </h3>
              <Form.Item name="name" label="Home Group Name" rules={[{ required: true, message: 'Home group name is required' }]}>
                <Input size="large" />
              </Form.Item>
              <Form.Item name="about" label="About this Home Group">
                <TextArea rows={4} />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#1565c0' }} /> Leadership & Location
              </h3>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="leader_key" label="Assign Leader">
                    <LeaderSelect />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="schedule" label="Schedule Details">
                    <Input size="large" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="location" label="Meeting Location" rules={[{ required: true, message: 'Location is required' }]}>
                <Input size="large" prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Manage Members
              </h3>
              <MemberTransferList
                members={members}
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                titles={['Available Members', 'Current Members']}
                description="Move members between the lists to add or remove them from this home group."
              />
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Changes
              </h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid #e2e8f0', marginTop: 16 }}>
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue();
                    const leader = decodeLeaderValue(values.leader_key);
                    const leaderName = leader.leader_id
                      ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected`
                      : 'Not assigned';
                    const selectedNames = selectedMemberKeys.map((key) => {
                      const m = members.find((mem) => mem.id === key);
                      return m ? `${m.first_name} ${m.last_name}` : key;
                    });
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                        <div><strong>Name:</strong> {values.name || '—'}</div>
                        <div><strong>Leader:</strong> {leaderName}</div>
                        <div><strong>Location:</strong> {values.location || '—'}</div>
                        <div><strong>Schedule:</strong> {values.schedule || '—'}</div>
                        <div><strong>Members:</strong> {selectedNames.length > 0 ? selectedNames.join(', ') : 'None'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>About:</strong> {values.about || '—'}</div>
                      </div>
                    );
                  }}
                </Form.Item>
              </div>
            </div>
          </StepperWizard>
        </Form>
      </div>
    </div>
  );
};

export default EditHomeGroup;
