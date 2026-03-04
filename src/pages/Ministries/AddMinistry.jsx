import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, message, Steps, Card, Row, Col } from 'antd';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { createMinistry, getMembers } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const AddMinistry = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [members, setMembers] = useState([]);

    // Fetch members for the leader dropdown
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await getMembers();
                setMembers(data);
            } catch (error) {
                console.error('Failed to load members for leader selection');
            }
        };
        fetchMembers();
    }, []);

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

    const prev = () => setCurrentStep(currentStep - 1);

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

            await createMinistry(ministryData);
            message.success('Ministry created successfully!');
            navigate('/ministries/manage');
        } catch (error) {
            console.error('Creation Error:', error);
            message.error(error.message || 'Failed to create ministry');
        } finally {
            setLoading(false);
        }
    };

    const getStepBackground = () => {
        switch (currentStep) {
            case 0: return { background: '#faf5ff', border: 'none' };
            case 1: return { background: '#f3e8ff', border: '1px solid #d8b4fe' };
            case 2: return { background: '#ede9fe', border: '1px solid #c4b5fd' };
            default: return { background: '#faf5ff', border: 'none' };
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
                                    { title: 'Schedule & Leader' },
                                    { title: 'Review' },
                                ]}
                            />

                            {/* STEP 1: Ministry Info */}
                            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TeamOutlined style={{ color: '#7b1fa2' }} /> Ministry Information
                                </h3>

                                <Form.Item
                                    name="name"
                                    label="Ministry Name"
                                    rules={[{ required: true, message: 'Ministry name is required' }]}
                                >
                                    <Input size="large" placeholder="e.g. Worship Team" />
                                </Form.Item>

                                <Form.Item name="about" label="About / Description">
                                    <TextArea rows={4} placeholder="Describe the purpose and activities of this ministry..." />
                                </Form.Item>
                            </div>

                            {/* STEP 2: Schedule & Leader */}
                            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ClockCircleOutlined style={{ color: '#7b1fa2' }} /> Schedule & Leadership
                                </h3>

                                <Form.Item name="schedule" label="Schedule / Meeting Time">
                                    <Input size="large" placeholder="e.g. Every Thursday at 7:00 PM" />
                                </Form.Item>

                                <Form.Item name="leader_id" label="Assign Leader (from Members)">
                                    <Select
                                        placeholder="Select a member as leader"
                                        size="large"
                                        showSearch
                                        allowClear
                                        optionFilterProp="children"
                                    >
                                        {members.map(m => (
                                            <Option key={m.id} value={m.id}>
                                                {m.first_name} {m.last_name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* STEP 3: Review */}
                            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#7b1fa2' }} /> Review
                                </h3>

                                <div style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #e2e8f0',
                                }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Ministry Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            const leader = members.find(m => m.id === values.leader_id);
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Name:</strong> {values.name || '—'}</div>
                                                    <div><strong>Schedule:</strong> {values.schedule || '—'}</div>
                                                    <div style={{ gridColumn: '1 / -1' }}><strong>About:</strong> {values.about || '—'}</div>
                                                    <div><strong>Leader:</strong> {leader ? `${leader.first_name} ${leader.last_name}` : '—'}</div>
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <Button size="large" onClick={() => navigate(-1)}>Cancel</Button>
                            {currentStep > 0 && <Button onClick={prev} size="large">Previous</Button>}
                            {currentStep < 2 && (
                                <Button type="primary" onClick={next} size="large" style={{ background: '#7b1fa2', borderColor: '#7b1fa2' }}>
                                    Next Step
                                </Button>
                            )}
                            {currentStep === 2 && (
                                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#7b1fa2', borderColor: '#7b1fa2' }}>
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
