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
import LeaderSelect, { decodeLeaderValue, encodeLeaderValue } from '../../Components/common/LeaderSelect';
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
  { title: 'Review & Update' },
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
                <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Manage Members
              </h3>
              <MemberTransferList
                remoteSearch
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                description="Search and check members to update who belongs to this home group."
              />
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Changes
              </h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid var(--border-color)', marginTop: 16 }}>
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue();
                    const leader = decodeLeaderValue(values.leader_key);
                    const leaderName = leader.leader_id
                      ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected`
                      : 'Not assigned';
                    const selectedCount = selectedMemberKeys.length;
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
                        <div><strong>Name:</strong> {values.name || '—'}</div>
                        <div><strong>Leader:</strong> {leaderName}</div>
                        <div><strong>Location:</strong> {values.location || '—'}</div>
                        <div>
                          <strong>Schedule:</strong>{' '}
                          {formatSchedule(values.schedule_day, values.schedule_time) || '—'}
                        </div>
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
