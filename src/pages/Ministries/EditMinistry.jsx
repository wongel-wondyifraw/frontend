import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, message, Steps, Card, Breadcrumb } from 'antd';
import {
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMinistry, updateMinistry, getMembers } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const EditMinistry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [members, setMembers] = useState([]);
    const [ministryName, setMinistryName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ministry, membersData] = await Promise.all([
                    getMinistry(id),
                    getMembers(),
                ]);
                setMinistryName(ministry.name);
                setMembers(membersData);
                form.setFieldsValue({
                    name: ministry.name,
                    about: ministry.about,
                    schedule: ministry.schedule,
                    leader_id: ministry.leader_id || undefined,
                });
            } catch (error) {
                message.error(error.message || 'Failed to fetch ministry details');
                navigate('/ministries/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, form, navigate]);

    const goToStep = (step) => setCurrentStep(step);
    const next = () => setCurrentStep(currentStep + 1);
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

            await updateMinistry(id, ministryData);
            message.success('Ministry updated successfully!');
            navigate('/ministries/manage');
        } catch (error) {
            console.error('Update Error:', error);
            message.error(error.message || 'Failed to update ministry');
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

    if (initialLoading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#94A3B8' }}>
                    Loading ministry data...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="add-ministry-container">
                <Breadcrumb style={{ marginBottom: '16px' }} items={[
                    { title: <a onClick={() => navigate('/dashboard')}><HomeOutlined /></a> },
                    { title: <a onClick={() => navigate('/ministries/manage')}>Ministries</a> },
                    { title: <a onClick={() => navigate(`/ministries/details/${id}`)}>{ministryName}</a> },
                    { title: 'Edit' },
                ]} />

                <div className="add-ministry-header">
                    <h1>Edit Ministry</h1>
                    <p>Update the ministry's information. Click on any step to jump directly to it.</p>
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
                                onChange={goToStep}
                                style={{ marginBottom: '32px', cursor: 'pointer' }}
                                items={[
                                    { title: 'Ministry Info' },
                                    { title: 'Schedule & Leader' },
                                    { title: 'Review' },
                                ]}
                            />

                            {/* STEP 1 */}
                            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TeamOutlined style={{ color: '#7b1fa2' }} /> Ministry Information
                                </h3>

                                <Form.Item name="name" label="Ministry Name" rules={[{ required: true, message: 'Ministry name is required' }]}>
                                    <Input size="large" placeholder="e.g. Worship Team" />
                                </Form.Item>

                                <Form.Item name="about" label="About / Description">
                                    <TextArea rows={4} placeholder="Describe the purpose and activities..." />
                                </Form.Item>
                            </div>

                            {/* STEP 2 */}
                            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ClockCircleOutlined style={{ color: '#7b1fa2' }} /> Schedule & Leadership
                                </h3>

                                <Form.Item name="schedule" label="Schedule / Meeting Time">
                                    <Input size="large" placeholder="e.g. Every Thursday at 7:00 PM" />
                                </Form.Item>

                                <Form.Item name="leader_id" label="Assign Leader (from Members)">
                                    <Select placeholder="Select a member as leader" size="large" showSearch allowClear optionFilterProp="children">
                                        {members.map(m => (
                                            <Option key={m.id} value={m.id}>
                                                {m.first_name} {m.last_name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* STEP 3 */}
                            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#7b1fa2' }} /> Review
                                </h3>

                                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Update Summary</h4>
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
