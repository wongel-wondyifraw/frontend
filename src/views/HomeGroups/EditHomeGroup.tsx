'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Button, Row, Col, Spin, AutoComplete, Select, TimePicker, Space } from 'antd';
import { message } from '@/lib/app-message';
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
  updateHomeGroup,
  getHomeGroup,
  getHomeGroupMembers,
  addHomeGroupMember,
  removeHomeGroupMember,
  getLocations,
  createLocation,
} from '../../services/api';
import type { Location } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import LeaderSelect, { decodeLeaderValue, encodeLeaderValue, displayName, type LeaderCandidate } from '../../Components/common/LeaderSelect';
import dayjs, { type Dayjs } from 'dayjs';
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

function parseSchedule(schedule?: string | null): { schedule_day?: string; schedule_time?: Dayjs } {
  if (!schedule?.trim()) return {};
  const day = WEEKDAYS.find((d) => schedule.toLowerCase().includes(d.toLowerCase()));
  const timeMatch = schedule.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  const schedule_time = timeMatch ? dayjs(timeMatch[1], ['h:mm A', 'hh:mm A']) : undefined;
  return {
    schedule_day: day,
    schedule_time: schedule_time?.isValid() ? schedule_time : undefined,
  };
}

const STEPS = [
  { title: 'Group Info' },
  { title: 'Leadership & Location' },
  { title: 'Manage Members' },
  { title: 'Review' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const EditHomeGroup = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const initialMemberKeysRef = useRef<string[]>([]);
  const [leaderCandidate, setLeaderCandidate] = useState<LeaderCandidate | null>(null);
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
        const [group, groupMembers, locs] = await Promise.all([
          getHomeGroup(id),
          getHomeGroupMembers(id),
          getLocations('active').catch(() => [] as Location[]),
        ]);
        setLocations(locs);
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

  useEffect(() => {
    if (initialLoading || !groupData) return;
    const parsed = parseSchedule(groupData.schedule);
    form.setFieldsValue({
      name: groupData.name,
      about: groupData.about,
      schedule_day: parsed.schedule_day,
      schedule_time: parsed.schedule_time,
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
      const locationName = await resolveLocationName(values.location);
      await updateHomeGroup(id, {
        name: values.name,
        about: values.about || '',
        schedule: formatSchedule(values.schedule_day, values.schedule_time),
        location: locationName,
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
        <h1>Edit Home Group</h1>
        <p>Update location, leadership, and members.</p>
      </div>

      <div className="add-homegroup-form-wrapper">
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
            {/* STEP 1: Home Group Information */}
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HomeOutlined style={{ color: '#1E40AF' }} /> Home Group Information
              </h3>
              <Form.Item name="name" label="Home Group Name" rules={[{ required: true, message: 'Home group name is required' }]}>
                <Input size="large" />
              </Form.Item>
              <Form.Item name="about" label="About this Home Group">
                <TextArea rows={4} />
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

            {/* STEP 3: Manage Members */}
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsergroupAddOutlined style={{ color: '#1E40AF' }} /> Manage Members
              </h3>
              <MemberTransferList
                remoteSearch
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                description="Search and check members to update who belongs to this home group."
              />
            </div>

            {/* STEP 4: Review Changes */}
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

export default EditHomeGroup;
