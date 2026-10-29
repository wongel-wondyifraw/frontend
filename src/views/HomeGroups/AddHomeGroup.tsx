'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Row, Col, AutoComplete, Select, TimePicker } from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberTransferList from '../../Components/common/MemberTransferList';
import {
  createHomeGroup,
  addHomeGroupMember,
  getLocations,
  createLocation,
} from '../../services/api';
import type { Location } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useToast } from '@/context/ToastContext';
import LeaderSelect, { decodeLeaderValue, displayName, type LeaderCandidate } from '../../Components/common/LeaderSelect';
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
  { title: 'Review' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const AddHomeGroup = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const [leaderCandidate, setLeaderCandidate] = useState<LeaderCandidate | null>(null);

  useEffect(() => {
    getLocations('active').then(setLocations).catch(() => {});
  }, []);

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
      showToast('error', 'Please correct the errors before proceeding.');
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

      showToast('success', 'Home group created successfully!');
      router.push('/members/home-groups');
    } catch (error: unknown) {
      showToast('error', getApiErrorMessage(error, 'Failed to create home group'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-homegroup-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}
      >
        Back to Home Groups
      </Button>

      <div className="add-homegroup-header">
        <h1>Create New Home Group</h1>
        <p>Set up a home group with a meeting location, leader, and members.</p>
      </div>

      <div className="add-homegroup-form-wrapper">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={prev}
            onCancel={() => router.back()}
            onStepClick={(step) => setCurrentStep(step)}
            submitText="Create Home Group"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
            lastStepLabel="Skip / Next"
          >
            {/* STEP 1: Home Group Information */}
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HomeOutlined style={{ color: '#1E40AF' }} /> Home Group Information
              </h3>
              <Form.Item
                name="name"
                label="Home Group Name"
                rules={[{ required: true, message: 'Home group name is required' }]}
              >
                <Input size="large" placeholder="e.g. Northside Fellowship" prefix={<HomeOutlined style={{ color: '#94a3b8' }} />} />
              </Form.Item>
              <Form.Item name="about" label="About this Home Group">
                <TextArea rows={4} placeholder="Describe the purpose, regular focus, and activities of this home group..." />
              </Form.Item>
            </div>

            {/* STEP 2: Leadership & Location */}
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#1E40AF' }} /> Leadership & Location
              </h3>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="leader_key" label="Assign Leader">
                    <LeaderSelect
                      onChange={(_val, candidate) => {
                        setLeaderCandidate(candidate || null);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
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
                      <Input size="large" prefix={<EnvironmentOutlined style={{ color: '#94a3b8' }} />} />
                    </AutoComplete>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="schedule_day" label="Meeting Day">
                    <Select
                      size="large"
                      placeholder="Select weekday"
                      allowClear
                      style={{ width: '100%' }}
                      options={WEEKDAYS.map((d) => ({ value: d, label: d }))}
                      suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="schedule_time" label="Meeting Time">
                    <TimePicker
                      size="large"
                      use12Hours
                      format="h:mm A"
                      placeholder="Select time"
                      style={{ width: '100%' }}
                      suffixIcon={<ClockCircleOutlined style={{ color: '#94a3b8' }} />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* STEP 3: Add Members (Optional) */}
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsergroupAddOutlined style={{ color: '#1E40AF' }} /> Add Members to Home Group
                <span style={{ fontWeight: 400, fontSize: 13, color: '#94a3b8' }}>(Optional)</span>
              </h3>
              <MemberTransferList
                remoteSearch
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                description="Search and check members to add them to this home group."
              />
            </div>

            {/* STEP 4: Review Home Group */}
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1E40AF' }} /> Review
              </h3>
              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid var(--border-color)',
                }}
              >
                <h4 style={{ marginBottom: 16, color: 'var(--text-main, #0f172a)' }}>Home Group Summary</h4>
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue();
                    const leader = decodeLeaderValue(values.leader_key);
                    const leaderDisplayName = leaderCandidate
                      ? `${displayName(leaderCandidate)} (${leaderCandidate.type === 'minister' ? 'Minister' : 'Member'})`
                      : leader.leader_id
                      ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected`
                      : 'Not assigned';
                    const selectedCount = selectedMemberKeys.length;
                    const scheduleStr = formatSchedule(values.schedule_day, values.schedule_time);

                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '12px 24px',
                          fontSize: 13,
                        }}
                      >
                        <div><strong>Name:</strong> {values.name || '—'}</div>
                        <div><strong>Leader:</strong> {leaderDisplayName}</div>
                        <div><strong>Location:</strong> {values.location || '—'}</div>
                        <div><strong>Schedule:</strong> {scheduleStr || '—'}</div>
                        <div><strong>Members:</strong> {selectedCount > 0 ? `${selectedCount} member(s) selected` : 'None'}</div>
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
