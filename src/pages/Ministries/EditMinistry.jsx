import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, message, Row, Col, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberTransferList from '../../Components/common/MemberTransferList';
import { updateMinistry, getMinistry, getMembers, getMinistryMembers, addMinistryMember, removeMinistryMember } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const STEPS = [
    { title: 'Ministry Info' },
    { title: 'Leadership & Schedule' },
    { title: 'Manage Members' },
    { title: 'Review & Update' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f0f9ff', border: '1px solid #bae6fd' },
    { background: '#f0fdf4', border: '1px solid #bbf7d0' },
    { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const EditMinistry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedMemberKeys, setSelectedMemberKeys] = useState([]);
    const initialMemberKeysRef = useRef([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ministryData, membersData, ministryMembersData] = await Promise.all([
                    getMinistry(id),
                    getMembers(),
                    getMinistryMembers(id),
                ]);
                setMembers(membersData);
                form.setFieldsValue({
                    name: ministryData.name,
                    about: ministryData.about,
                    schedule: ministryData.schedule,
                    leader_id: ministryData.leader_id || undefined,
                });

                // Pre-populate selected members from existing ministry members
                const existingKeys = ministryMembersData.map(mm => mm.member_id);
                setSelectedMemberKeys(existingKeys);
                initialMemberKeysRef.current = existingKeys;
            } catch (error) {
                message.error(error.message || 'Failed to load ministry details');
                navigate('/ministries/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, form, navigate]);

    const handleStepClick = async (step) => {
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
            const ministryData = {
                name: values.name,
                about: values.about || '',
                schedule: values.schedule || '',
                leader_id: values.leader_id || null,
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
            navigate('/ministries/manage');
        } catch (error) {
            console.error('Update Ministry Error:', error);
            message.error(error.message || 'Failed to update ministry');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="add-ministry-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministries
                </Button>

                <div className="add-ministry-header">
                    <h1>Edit Ministry Details</h1>
                    <p>Update ministry information, leadership, and members.</p>
                </div>

                <div className="content-card-unified">
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <StepperWizard
                            steps={STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            onCancel={() => navigate(-1)}
                            submitText="Confirm Update"
                            submitLoading={loading}
                            stepBackgrounds={STEP_BACKGROUNDS}
                            onStepClick={handleStepClick}
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
                                    <Col span={12}>
                                        <Form.Item name="leader_id" label="Assign Leader">
                                            <Select
                                                placeholder="Select a member as leader"
                                                size="large"
                                                showSearch
                                                allowClear
                                                optionFilterProp="children"
                                                filterOption={(input, option) =>
                                                    option.children.toLowerCase().includes(input.toLowerCase())
                                                }
                                            >
                                                {members.map(member => (
                                                    <Option key={member.id} value={member.id}>
                                                        {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="schedule" label="Schedule Details">
                                            <Input size="large" placeholder="e.g. Every Thursday 7:00 PM" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* STEP 3: Manage Members */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Manage Members
                                </h3>
                                <MemberTransferList
                                    members={members}
                                    selectedKeys={selectedMemberKeys}
                                    onChange={setSelectedMemberKeys}
                                    titles={['Available Members', 'Current Members']}
                                    description="Move members between the lists to add or remove them from this ministry."
                                />
                            </div>

                            {/* STEP 4: Review & Update */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Changes
                                </h3>
                                <div style={{
                                    background: '#fff', borderRadius: '8px', padding: '20px',
                                    border: '1px solid #e2e8f0', marginTop: '16px'
                                }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Ministry Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            const leader = members.find(m => m.id === values.leader_id);
                                            const leaderName = leader
                                                ? `${leader.first_name} ${leader.middle_name ? leader.middle_name + ' ' : ''}${leader.last_name}`
                                                : 'Not assigned';
                                            const selectedNames = selectedMemberKeys.map(key => {
                                                const m = members.find(mem => mem.id === key);
                                                return m ? `${m.first_name} ${m.last_name}` : key;
                                            });
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Ministry Name:</strong> {values.name || '—'}</div>
                                                    <div><strong>Leader:</strong> {leaderName}</div>
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
        </DashboardLayout>
    );
};

export default EditMinistry;
