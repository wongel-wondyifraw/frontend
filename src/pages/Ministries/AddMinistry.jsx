import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, message, Steps, Card, Row, Col, Transfer } from 'antd';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { createMinistry, getMembers, addMinistryMember } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

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
            message.error('Failed to load members for leader selection');
        }
    };

    // Step validation before advancing
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

    // Transfer component data
    const transferDataSource = members.map(m => ({
        key: m.id,
        title: `${m.first_name} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name}`,
        description: m.email || m.phone || '',
    }));

    const handleTransferChange = (targetKeys) => {
        setSelectedMemberKeys(targetKeys);
    };

    // Submit handler
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

    const getStepBackground = () => {
        switch (currentStep) {
            case 0: return { background: '#f8fafc', border: 'none' };
            case 1: return { background: '#f0f9ff', border: '1px solid #bae6fd' };
            case 2: return { background: '#f0fdf4', border: '1px solid #bbf7d0' };
            case 3: return { background: '#e6f7ff', border: '1px solid #91d5ff' };
            default: return { background: '#f8fafc', border: 'none' };
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
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Card
                            bordered={false}
                            className="wizard-card"
                            style={{
                                ...getStepBackground(),
                                transition: 'background-color 0.3s ease, border 0.3s ease',
                                borderRadius: '12px',
                            }}
                        >
                            <Steps
                                current={currentStep}
                                style={{ marginBottom: '32px' }}
                                items={[
                                    { title: 'Ministry Info' },
                                    { title: 'Leadership & Schedule' },
                                    { title: 'Add Members', description: 'Optional' },
                                    { title: 'Review & Create' },
                                ]}
                            />

                            {/* =============== STEP 1: Ministry Information =============== */}
                            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
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

                            {/* =============== STEP 2: Leadership & Schedule =============== */}
                            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
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

                            {/* =============== STEP 3: Add Members (Optional) =============== */}
                            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Add Members to Ministry
                                    <span style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>(Optional)</span>
                                </h3>

                                <p style={{ color: '#64748b', marginBottom: '16px' }}>
                                    Select members from the left side and move them to the right to add them to this ministry.
                                </p>

                                <Transfer
                                    dataSource={transferDataSource}
                                    targetKeys={selectedMemberKeys}
                                    onChange={handleTransferChange}
                                    render={item => item.title}
                                    showSearch
                                    filterOption={(inputValue, option) =>
                                        option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                                        option.description.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                    listStyle={{
                                        width: '100%',
                                        height: 320,
                                    }}
                                    titles={['Available Members', 'Selected Members']}
                                    style={{ width: '100%' }}
                                />

                                <div style={{ marginTop: '12px', color: '#64748b', fontSize: '12px' }}>
                                    {selectedMemberKeys.length} member(s) selected
                                </div>
                            </div>

                            {/* =============== STEP 4: Review & Create =============== */}
                            <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Ministry
                                </h3>

                                <div style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #e2e8f0',
                                    marginTop: '16px'
                                }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Ministry Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            const leader = members.find(m => m.id === values.leader_id);
                                            const leaderName = leader
                                                ? `${leader.first_name} ${leader.middle_name ? leader.middle_name + ' ' : ''}${leader.last_name}`
                                                : 'Not assigned';
                                            const selectedMemberNames = selectedMemberKeys.map(key => {
                                                const m = members.find(mem => mem.id === key);
                                                return m ? `${m.first_name} ${m.last_name}` : key;
                                            });
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Ministry Name:</strong> {values.name || '—'}</div>
                                                    <div><strong>Leader:</strong> {leaderName}</div>
                                                    <div><strong>Schedule:</strong> {values.schedule || '—'}</div>
                                                    <div><strong>Members:</strong> {selectedMemberNames.length > 0 ? selectedMemberNames.join(', ') : 'None'}</div>
                                                    <div style={{ gridColumn: '1 / -1' }}><strong>About:</strong> {values.about || '—'}</div>
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <Button size="large" onClick={() => navigate(-1)}>Cancel</Button>
                            {currentStep > 0 && (
                                <Button onClick={prev} size="large">Previous</Button>
                            )}
                            {currentStep < 3 && (
                                <Button type="primary" onClick={next} size="large" style={{ background: '#1565c0' }}>
                                    {currentStep === 2 ? 'Skip / Next' : 'Next Step'}
                                </Button>
                            )}
                            {currentStep === 3 && (
                                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#1565c0' }}>
                                    Create Ministry
                                </Button>
                            )}
                        </div>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddMinistry;
