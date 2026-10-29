'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Button, Row, Col, Spin } from 'antd';
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
import { updateMinistry, getMinistry, getMinistryMembers, addMinistryMember, removeMinistryMember } from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import LeaderSelect, { decodeLeaderValue, encodeLeaderValue } from '../../Components/common/LeaderSelect';
import './AddMinistry.css';

const { TextArea } = Input;

const STEPS = [
    { title: 'Ministry Info' },
    { title: 'Leadership & Schedule' },
    { title: 'Manage Members' },
    { title: 'Review & Update' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const EditMinistry = () => {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
    const initialMemberKeysRef = useRef<string[]>([]);
    const [ministryData, setMinistryData] = useState<{
        name: string;
        about?: string;
        schedule?: string;
        leader_id?: string | null;
        leader_type?: 'member' | 'minister' | null;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ministry, ministryMembersData] = await Promise.all([
                    getMinistry(id),
                    getMinistryMembers(id),
                ]);
                setMinistryData({
                    name: ministry.name,
                    about: ministry.about,
                    schedule: ministry.schedule,
                    leader_id: ministry.leader_id || undefined,
                    leader_type: ministry.leader_type || ministry.leader?.type || undefined,
                });

                const existingKeys = ministryMembersData.map(mm => mm.member_id);
                setSelectedMemberKeys(existingKeys);
                initialMemberKeysRef.current = existingKeys;
            } catch (error: unknown) {
                message.error(getApiErrorMessage(error, 'Failed to load ministry details'));
                router.push('/ministries/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    useEffect(() => {
        if (initialLoading || !ministryData) return;
        form.setFieldsValue({
            name: ministryData.name,
            about: ministryData.about,
            schedule: ministryData.schedule,
            leader_key: encodeLeaderValue(ministryData.leader_id, ministryData.leader_type),
        });
    }, [initialLoading, ministryData, form]);

    const handleStepClick = async (step: number) => {
        // Validate step 0 before leaving it
        if (currentStep === 0 && step > 0) {
            try {
                await form.validateFields(['name']);
            } catch {
                message.error('Please correct the errors before proceeding.');
                return;
            }
        }
        setCurrentStep(step);
    };

    const next = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields(['name']);
            }
            setCurrentStep(currentStep + 1);
        } catch (_error) {
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
            await updateMinistry(id, ministryData);

            // Compute members to add and remove
            const initialKeys = initialMemberKeysRef.current;
            const toAdd = selectedMemberKeys.filter(k => !initialKeys.includes(k));
            const toRemove = initialKeys.filter(k => !selectedMemberKeys.includes(k));

            // Add new members
            if (toAdd.length > 0) {
                await Promise.all(
                    toAdd.map(memberId =>
                        addMinistryMember(id, memberId).catch(err => {
                            console.warn(`Failed to add member ${memberId}:`, err);
                        })
                    )
                );
            }

            // Remove old members
            if (toRemove.length > 0) {
                await Promise.all(
                    toRemove.map(memberId =>
                        removeMinistryMember(id, memberId).catch(err => {
                            console.warn(`Failed to remove member ${memberId}:`, err);
                        })
                    )
                );
            }

            message.success('Ministry updated successfully');
            router.push('/ministries/manage');
        } catch (error: unknown) {
            console.error('Update Ministry Error:', error);
            message.error(getApiErrorMessage(error, 'Failed to update ministry'));
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
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministries
                </Button>

                <div className="add-ministry-header">
                    <h1>Edit Ministry Details</h1>
                    <p>Update ministry information, leadership, and members.</p>
                </div>

                <div className="add-ministry-form-wrapper">
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
                            {/* STEP 1: Ministry Information */}
                            <div>
                                <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TeamOutlined style={{ color: '#1E40AF' }} /> Ministry Information
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
                                <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <UserOutlined style={{ color: '#1E40AF' }} /> Leadership & Schedule
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

                            {/* STEP 3: Manage Members */}
                            <div>
                                <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <UsergroupAddOutlined style={{ color: '#1E40AF' }} /> Manage Members
                                </h3>
                                <MemberTransferList
                                    remoteSearch
                                    selectedKeys={selectedMemberKeys}
                                    onChange={setSelectedMemberKeys}
                                    description="Search and check members to update who belongs to this ministry."
                                />
                            </div>

                            {/* STEP 4: Review & Update */}
                            <div>
                                <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircleOutlined style={{ color: '#1E40AF' }} /> Review Changes
                                </h3>
                                <div
                                    style={{
                                        background: 'var(--bg-card, #fff)',
                                        borderRadius: 12,
                                        padding: 20,
                                        border: '1px solid var(--border-color)',
                                    }}
                                >
                                    <h4 style={{ marginBottom: 16, color: 'var(--text-main, #0f172a)' }}>Ministry Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            const leader = decodeLeaderValue(values.leader_key);
                                            const leaderLabel = leader.leader_id
                                                ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected`
                                                : 'Not assigned';
                                            const selectedCount = selectedMemberKeys.length;
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
                                                    <div><strong>Ministry Name:</strong> {values.name || '—'}</div>
                                                    <div><strong>Leader:</strong> {leaderLabel}</div>
                                                    <div><strong>Schedule:</strong> {values.schedule || '—'}</div>
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

export default EditMinistry;
