'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, Button, message, Row, Col } from 'antd';
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
import { createHomeGroup, getMembersList, addHomeGroupMember } from '../../services/api';
import type { Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import LeaderSelect, { decodeLeaderValue } from '../../Components/common/LeaderSelect';
import './AddHomeGroup.css';

const { Option } = Select;
const { TextArea } = Input;

const STEPS = [
  { title: 'Group Info' },
  { title: 'Leadership & Location' },
  { title: 'Add Members', content: 'Optional' },
  { title: 'Review & Create' },
];

const STEP_BACKGROUNDS = [
  { background: '#f8fafc', border: 'none' },
  { background: '#f0f9ff', border: '1px solid #bae6fd' },
  { background: '#f0fdf4', border: '1px solid #bbf7d0' },
  { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const AddHomeGroup = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setMembers(await getMembersList());
    } catch {
      message.error('Failed to load members');
    }
  };

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['name']);
      } else if (currentStep === 1) {
        await form.validateFields(['location']);
      }
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
      const created = await createHomeGroup({
        name: values.name,
        about: values.about || '',
        schedule: values.schedule || '',
        location: values.location,
        leader_id: leader.leader_id,
        leader_type: leader.leader_type,
      });

      if (selectedMemberKeys.length > 0 && created?.id) {
        await Promise.all(
          selectedMemberKeys.map((memberId) =>
            addHomeGroupMember(created.id, memberId).catch((err) => {
              console.warn(`Failed to add member ${memberId}:`, err);
            }),
          ),
        );
      }

      message.success('Home group created successfully!');
      router.push('/members/home-groups');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to create home group'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-ministry-container">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}>
        Back to Home Groups
      </Button>

      <div className="add-ministry-header">
        <h1>Create New Home Group</h1>
        <p>Set up a home group with a meeting location, leader, and members.</p>
      </div>

      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={prev}
            onCancel={() => router.back()}
            submitText="Create Home Group"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
            lastStepLabel="Skip / Next"
          >
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HomeOutlined style={{ color: '#1565c0' }} /> Home Group Information
              </h3>
              <Form.Item name="name" label="Home Group Name" rules={[{ required: true, message: 'Home group name is required' }]}>
                <Input size="large" placeholder="e.g. Northside Fellowship" />
              </Form.Item>
              <Form.Item name="about" label="About this Home Group">
                <TextArea rows={4} placeholder="Describe the purpose and activities..." />
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
                    <Input size="large" placeholder="e.g. Every Friday 7:00 PM" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="location"
                label="Meeting Location"
                rules={[{ required: true, message: 'Location is required' }]}
                extra="Where this home group meets (address or place name)."
              >
                <Input size="large" placeholder="e.g. 123 Oak Street, Living Room" prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Add Members to Home Group
                <span style={{ fontWeight: 400, fontSize: 13, color: '#94a3b8' }}>(Optional)</span>
              </h3>
              <MemberTransferList
                members={members}
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                titles={['Available Members', 'Selected Members']}
                description="Select members from the left and move them to the right to add them to this home group."
              />
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Home Group
              </h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid #e2e8f0', marginTop: 16 }}>
                <h4 style={{ marginBottom: 16, color: '#0f172a' }}>Home Group Summary</h4>
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

export default AddHomeGroup;
