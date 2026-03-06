import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, message, Row, Col } from 'antd';
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
import { createMinistry, getMembers, addMinistryMember } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const STEPS = [
    { title: 'Ministry Info' },
    { title: 'Leadership & Schedule' },
    { title: 'Add Members', description: 'Optional' },
    { title: 'Review & Create' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f0f9ff', border: '1px solid #bae6fd' },
    { background: '#f0fdf4', border: '1px solid #bbf7d0' },
    { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const AddMinistry = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [members, setMembers] = useState([]);
    const [selectedMemberKeys, setSelectedMemberKeys] = useState([]);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const data = await getMembers();
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

            const ministryData = {
                name: values.name,
                about: values.about || '',
                schedule: values.schedule || '',
                leader_id: values.leader_id || null,
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
            navigate('/ministries/manage');
        } catch (error) {
            console.error('Create Ministry Error:', error);
            message.error(error.message || 'Failed to create ministry');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1>Create New Ministry</h1>
                    <p>Complete all steps to set up a new ministry group.</p>
                </div>

                <div className="content-card-unified">
                    <Form autoComplete="off" form={form} layout="vertical" onFinish={handleSubmit}>
                        <StepperWizard
                            steps={STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            onCancel={() => navigate(-1)}
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
                                    titles={['Available Members', 'Selected Members']}
                                    description="Select members from the left and move them to the right to add them to this ministry."
                                />
                            </div>

                            {/* STEP 4: Review & Create */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Ministry
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

export default AddMinistry;
