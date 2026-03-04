import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Upload, message, Avatar, Steps, Card, Row, Col, Breadcrumb } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { getMember, updateMember, API_BASE_URL } from '../../services/api';
import dayjs from 'dayjs';
import './AddMember.css';

const { Option } = Select;

const EditMember = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [memberName, setMemberName] = useState('');

    // Fetch member data
    useEffect(() => {
        const fetchMember = async () => {
            try {
                const member = await getMember(id);
                setMemberName(`${member.first_name} ${member.last_name}`);
                form.setFieldsValue({
                    first_name: member.first_name,
                    middle_name: member.middle_name,
                    last_name: member.last_name,
                    email: member.email,
                    phone: member.phone,
                    address: member.address,
                    date_of_birth: member.date_of_birth ? dayjs(member.date_of_birth) : null,
                    marital_status: member.marital_status,
                    status: member.status || 'active',
                });
                if (member.image_url) {
                    setAvatarPreview(`${API_BASE_URL}/${member.image_url.replace(/^\//, '')}`);
                }
            } catch (error) {
                message.error(error.message || 'Failed to fetch member details');
                navigate('/members/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchMember();
    }, [id, form, navigate]);

    // Step navigation — no validation on edit, let users jump freely
    const goToStep = (step) => {
        setCurrentStep(step);
    };

    const next = () => setCurrentStep(currentStep + 1);
    const prev = () => setCurrentStep(currentStep - 1);

    // Avatar handling
    const handleAvatarChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    // Submit handler
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const memberData = {
                first_name: values.first_name,
                last_name: values.last_name,
                middle_name: values.middle_name || '',
                email: values.email || '',
                phone: values.phone || '',
                address: values.address || '',
                date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
                marital_status: values.marital_status || '',
                status: values.status || 'active',
            };

            await updateMember(id, memberData);
            message.success('Member updated successfully!');
            navigate('/members/manage');
        } catch (error) {
            console.error('Update Error:', error);
            message.error(error.message || 'Failed to update member');
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#94A3B8' }}>
                    Loading member data...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="add-member-container">
                <Breadcrumb style={{ marginBottom: '16px' }} items={[
                    { title: <a onClick={() => navigate('/members/manage')}>Members</a> },
                    { title: <a onClick={() => navigate(`/members/details/${id}`)}>{memberName}</a> },
                    { title: 'Edit' },
                ]} />

                <div className="add-member-header">
                    <h1>Edit Member</h1>
                    <p>Update the member's information. Click on any step to jump directly to it.</p>
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
                                    { title: 'Personal Info' },
                                    { title: 'Contact & Address' },
                                    { title: 'Status & Review' },
                                ]}
                            />

                            {/* STEP 1: Personal Information */}
                            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserOutlined style={{ color: '#1565c0' }} /> Personal Information
                                </h3>

                                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'flex-start' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Avatar
                                            size={100}
                                            src={avatarPreview}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f2f5', border: '2px solid #d9d9d9' }}
                                        />
                                        <div style={{ marginTop: '8px' }}>
                                            <Upload showUploadList={false} beforeUpload={() => false} onChange={handleAvatarChange}>
                                                <Button size="small" icon={<UploadOutlined />}>Photo</Button>
                                            </Upload>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <Form.Item label="First Name" name="first_name" rules={[{ required: true, message: 'First name is required' }]}>
                                                <Input size="large" placeholder="John" />
                                            </Form.Item>
                                            <Form.Item label="Middle Name" name="middle_name">
                                                <Input size="large" placeholder="Optional" />
                                            </Form.Item>
                                        </div>
                                        <Form.Item label="Last Name" name="last_name" rules={[{ required: true, message: 'Last name is required' }]}>
                                            <Input size="large" placeholder="Doe" />
                                        </Form.Item>
                                    </div>
                                </div>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Date of Birth" name="date_of_birth">
                                            <DatePicker style={{ width: '100%' }} size="large" placeholder="Select date" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Marital Status" name="marital_status">
                                            <Select placeholder="Select status" size="large" allowClear>
                                                <Option value="single">Single</Option>
                                                <Option value="married">Married</Option>
                                                <Option value="divorced">Divorced</Option>
                                                <Option value="widowed">Widowed</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* STEP 2: Contact & Address */}
                            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <PhoneOutlined style={{ color: '#1565c0' }} /> Contact & Address
                                </h3>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Phone Number" name="phone" rules={[{ required: true, message: 'Phone number is required' }]}>
                                            <Input size="large" placeholder="+251 9XX XXX XXXX" prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Email Address" name="email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
                                            <Input size="large" placeholder="john@example.com" prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Address" name="address">
                                    <Input size="large" placeholder="123 Church St, City, State" prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />} />
                                </Form.Item>
                            </div>

                            {/* STEP 3: Status & Review */}
                            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Membership Status
                                </h3>

                                <Form.Item label="Membership Status" name="status" rules={[{ required: true, message: 'Please select a status' }]}>
                                    <Select size="large" placeholder="Select membership status">
                                        <Option value="active">Active</Option>
                                        <Option value="inactive">Inactive</Option>
                                    </Select>
                                </Form.Item>

                                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Update Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Name:</strong> {values.first_name || '—'} {values.middle_name || ''} {values.last_name || ''}</div>
                                                    <div><strong>Phone:</strong> {values.phone || '—'}</div>
                                                    <div><strong>Email:</strong> {values.email || '—'}</div>
                                                    <div><strong>Address:</strong> {values.address || '—'}</div>
                                                    <div><strong>Date of Birth:</strong> {values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : '—'}</div>
                                                    <div><strong>Marital Status:</strong> {values.marital_status || '—'}</div>
                                                    <div><strong>Status:</strong> {values.status || '—'}</div>
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                </div>
                            </div>
                        </Card>

                        {/* Wizard Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <Button size="large" onClick={() => navigate(-1)}>Cancel</Button>
                            {currentStep > 0 && <Button onClick={prev} size="large">Previous</Button>}
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

export default EditMember;
