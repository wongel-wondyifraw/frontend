'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, Button, Row, Col } from 'antd';
import { message } from '@/lib/app-message';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberTransferList from '../../Components/common/MemberTransferList';
import { createMinistry, getMembersList, addMinistryMember } from '../../services/api';
import type { Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import LeaderSelect, { decodeLeaderValue } from '../../Components/common/LeaderSelect';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const STEPS = [
    { title: 'Ministry Info' },
    { title: 'Leadership & Schedule' },
    { title: 'Add Members', content: 'Optional' },
    { title: 'Review & Create' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const AddMinistry = () => {
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
            const data = await getMembersList();
            setMembers(data);
        } catch (error) {
            message.error('Failed to load members');
        }
    };

    const next = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields(['name']);
            }
            setCurrentStep(currentStep + 1);
        } catch (error) {
            message.error('Please correct the errors before proceeding.');
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const leader = decodeLeaderValue(values.leader_key);
            const ministryData = {
                name: values.name,
                about: values.about || '',
                schedule: values.schedule || '',
                leader_id: leader.leader_id,
                leader_type: leader.leader_type,
            };

            const createdMinistry = await createMinistry(ministryData);

            // Add selected members to ministry_members table
            if (selectedMemberKeys.length > 0 && createdMinistry?.id) {
                const addPromises = selectedMemberKeys.map(memberId =>
                    addMinistryMember(createdMinistry.id, memberId).catch(err => {
                        console.warn(`Failed to add member ${memberId}:`, err);
                    })
                );
                await Promise.all(addPromises);
            }

            message.success('Ministry created successfully!');
            router.push('/ministries/manage');
        } catch (error: unknown) {
            console.error('Create Ministry Error:', error);
            message.error(getApiErrorMessage(error, 'Failed to create ministry'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-ministry-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministries
                </Button>

                <div className="add-ministry-header">
                    <h1>Create New Ministry</h1>
                    <p>Complete all steps to set up a new ministry group.</p>
                </div>

                <div className="content-card-unified">
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <StepperWizard
                            steps={STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            onCancel={() => router.back()}
                            submitText="Create Ministry"
                            submitLoading={loading}
                            stepBackgrounds={STEP_BACKGROUNDS}
                            lastStepLabel="Skip / Next"
                        >
                            {/* STEP 1: Ministry Information */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TeamOutlined style={{ color: '#1565c0' }} /> Ministry Information
                                </h3>
                                <Row gutter={24}>
                                    <Col span={24}>
                                        <Form.Item
                                            name="name"
                                            label="Ministry Name"
                                            rules={[{ required: true, message: 'Ministry name is required' }]}
                                        >
                                            <Input size="large" placeholder="e.g. Worship Team" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="about" label="About this Ministry">
                                    <TextArea rows={4} placeholder="Describe the purpose and activities..." />
                                </Form.Item>
                            </div>

                            {/* STEP 2: Leadership & Schedule */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserOutlined style={{ color: '#1565c0' }} /> Leadership & Schedule
                                </h3>
                                <Row gutter={24}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="leader_key" label="Assign Leader">
                                            <LeaderSelect />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="schedule" label="Schedule Details">
                                            <Input size="large" placeholder="e.g. Every Thursday 7:00 PM" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* STEP 3: Add Members (Optional) */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Add Members to Ministry
                                    <span style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>(Optional)</span>
                                </h3>
                                <MemberTransferList
                                    members={members}
                                    selectedKeys={selectedMemberKeys}
                                    onChange={setSelectedMemberKeys}
                                    description="Search and check members to add them to this ministry."
                                />
                            </div>

                            {/* STEP 4: Review & Create */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Ministry
                                </h3>
                                <div style={{
                                    background: '#fff', borderRadius: '8px', padding: '20px',
                                    border: '1px solid var(--border-color)', marginTop: '16px'
                                }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Ministry Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            const leader = decodeLeaderValue(values.leader_key);
                                            const leaderLabel = leader.leader_id
                                                ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected`
                                                : 'Not assigned';
                                            const selectedNames = selectedMemberKeys.map(key => {
                                                const m = members.find(mem => mem.id === key);
                                                return m ? `${m.first_name} ${m.last_name}` : key;
                                            });
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Ministry Name:</strong> {values.name || '—'}</div>
                                                    <div><strong>Leader:</strong> {leaderLabel}</div>
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

export default AddMinistry;
