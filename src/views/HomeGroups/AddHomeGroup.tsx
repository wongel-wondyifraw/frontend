'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Row, Col, AutoComplete, Select, TimePicker, Space } from 'antd';
import { message } from '@/lib/app-message';
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
  createHomeGroup,
  getMembersList,
  addHomeGroupMember,
  getLocations,
  createLocation,
} from '../../services/api';
import type { Member, Location } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import LeaderSelect, { decodeLeaderValue } from '../../Components/common/LeaderSelect';
import { type Dayjs } from 'dayjs';
import './AddHomeGroup.css';

const { TextArea } = Input;

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function formatSchedule(day?: string, time?: Dayjs | null): string {
  if (!day && !time) return '';
  const timeLabel = time ? time.format('h:mm A') : '';
  if (day && timeLabel) return `Every ${day} ${timeLabel}`;
  if (day) return `Every ${day}`;
  return timeLabel;
}

const STEPS = [
  { title: 'Group Info' },
  { title: 'Leadership & Location' },
  { title: 'Add Members', content: 'Optional' },
  { title: 'Review & Create' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const AddHomeGroup = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);

  useEffect(() => {
    loadMembers();
    getLocations('active').then(setLocations).catch(() => {});
  }, []);

  const loadMembers = async () => {
    try {
      setMembers(await getMembersList());
    } catch {
      message.error('Failed to load members');
    }
  };

  const resolveLocationName = async (raw?: string): Promise<string | undefined> => {
    const trimmed = raw?.trim();
    if (!trimmed) return undefined;
    const existing = locations.find(
      (l) => l.name.toLowerCase() === trimmed.toLowerCase() || l.id === trimmed,
    );
    if (existing) return existing.name;
    const created = await createLocation({ name: trimmed, status: 'active' });
    setLocations((prev) => [...prev, created]);
    return created.name;
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
      const locationName = await resolveLocationName(values.location);
      const created = await createHomeGroup({
        name: values.name,
        about: values.about || '',
        schedule: formatSchedule(values.schedule_day, values.schedule_time),
        location: locationName,
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
                <Col xs={24} md={12}>
                  <Form.Item name="leader_key" label="Assign Leader">
                    <LeaderSelect />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Meeting Schedule">
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item name="schedule_day" noStyle>
                        <Select
                          size="large"
                          placeholder="Day"
                          allowClear
                          style={{ width: '45%' }}
                          options={WEEKDAYS.map((d) => ({ value: d, label: d }))}
                        />
                      </Form.Item>
                      <Form.Item name="schedule_time" noStyle>
                        <TimePicker
                          size="large"
                          use12Hours
                          format="h:mm A"
                          placeholder="Time"
                          style={{ width: '55%' }}
                          suffixIcon={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />}
                        />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="location"
                label="Meeting Location"
                rules={[{ required: true, message: 'Location is required' }]}
                extra="Search an existing location or type a new one to add it."
              >
                <AutoComplete
                  options={locations.map((loc) => ({ value: loc.name }))}
                  placeholder="Search or enter location"
                  style={{ width: '100%' }}
                  filterOption={(inputValue, option) =>
                    String(option?.value ?? '').toUpperCase().includes(inputValue.toUpperCase())
                  }
                  allowClear
                >
                  <Input size="large" prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} />
                </AutoComplete>
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
                description="Search and check members to add them to this home group."
              />
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Home Group
              </h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid var(--border-color)', marginTop: 16 }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
                        <div><strong>Name:</strong> {values.name || '—'}</div>
                        <div><strong>Leader:</strong> {leaderName}</div>
                        <div><strong>Location:</strong> {values.location || '—'}</div>
                        <div>
                          <strong>Schedule:</strong>{' '}
                          {formatSchedule(values.schedule_day, values.schedule_time) || '—'}
                        </div>
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
