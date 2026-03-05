import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, message, Row, Col, Spin, Card, Steps, Avatar } from 'antd';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { updateMinistry, getMinistry, getMembers } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const EditMinistry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ministryData, membersData] = await Promise.all([
                    getMinistry(id),
                    getMembers(),
                ]);
                setMembers(membersData);
                form.setFieldsValue({
                    name: ministryData.name,
                    about: ministryData.about,
                    schedule: ministryData.schedule,
                    leader_id: ministryData.leader_id || undefined,
                });
            } catch (error) {
                message.error(error.message || 'Failed to load ministry details');
                navigate('/ministries/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, form, navigate]);

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
            message.success('Ministry updated successfully');
            navigate('/ministries/manage');
        } catch (error) {
            console.error('Update Ministry Error:', error);
            message.error(error.message || 'Failed to update ministry');
        } finally {
            setLoading(false);
        }
    };

    const getStepBackground = () => {
        switch (currentStep) {
            case 0: return { background: '#f8fafc', border: 'none' };
            case 1: return { background: '#f0f9ff', border: '1px solid #bae6fd' };
            case 2: return { background: '#e6f7ff', border: '1px solid #91d5ff' };
            default: return { background: '#f8fafc', border: 'none' };
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
                    <p>Update ministry information and leadership.</p>
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
                                    { title: 'Review & Update' },
                                ]}
                            />

                            {/* STEP 1: Ministry Information */}
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

                            {/* STEP 2: Leadership & Schedule */}
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

                            {/* STEP 3: Review & Update */}
                            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Changes
                                </h3>
                                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Ministry Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            const leader = members.find(m => m.id === values.leader_id);
                                            const leaderName = leader
                                                ? `${leader.first_name} ${leader.middle_name ? leader.middle_name + ' ' : ''}${leader.last_name}`
                                                : 'Not assigned';
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Ministry Name:</strong> {values.name || '—'}</div>
                                                    <div><strong>Leader:</strong> {leaderName}</div>
                                                    <div><strong>Schedule:</strong> {values.schedule || '—'}</div>
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
                            {currentStep < 2 && (
                                <Button type="primary" onClick={next} size="large" style={{ background: '#1565c0' }}>
                                    Next Step
                                </Button>
                            )}
                            {currentStep === 2 && (
                                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#1565c0' }}>
                                    Confirm Update
                                </Button>
                            )}
                        </div>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditMinistry;
