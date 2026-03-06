import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Upload, message, Avatar, Row, Col, Radio } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import '../Members/AddMember.css';

const { Option } = Select;

const STEPS = [
    { title: 'Personal Info' },
    { title: 'Contact & Address' },
    { title: 'Ministry Details' },
    { title: 'Review' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
];

const AddMinister = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const next = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields(['first_name', 'last_name']);
            } else if (currentStep === 1) {
                await form.validateFields(['phone']);
            }
            setCurrentStep(currentStep + 1);
        } catch (error) {
            message.error('Please correct the errors before proceeding.');
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleAvatarChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            setLoading(true);
            // Prototype: simulate save
            setTimeout(() => {
                setLoading(false);
                message.success('Minister registered successfully!');
                navigate('/ministers/manage');
            }, 1000);
        } catch (error) {
            message.error('Please complete all required fields.');
        }
    };

    return (
        <DashboardLayout>
            <div className="add-member-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministers
                </Button>

                <div className="add-member-header">
                    <h1>New Minister Registration</h1>
                    <p>Complete all steps to register a new minister.</p>
                </div>

                <div className="content-card-unified">
                    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active' }}>
                        <StepperWizard
                            steps={STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            onCancel={() => navigate(-1)}
                            submitText="Confirm Registration"
                            submitLoading={loading}
                            stepBackgrounds={STEP_BACKGROUNDS}
                        >
                            {/* =============== STEP 1: Personal Information =============== */}
                            <div>
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
                                            <Form.Item
                                                label="First Name"
                                                name="first_name"
                                                rules={[{ required: true, message: 'First name is required' }]}
                                            >
                                                <Input size="large" placeholder="First Name" />
                                            </Form.Item>
                                            <Form.Item label="Middle Name" name="middle_name">
                                                <Input size="large" placeholder="Optional" />
                                            </Form.Item>
                                        </div>
                                        <Form.Item
                                            label="Last Name"
                                            name="last_name"
                                            rules={[{ required: true, message: 'Last name is required' }]}
                                        >
                                            <Input size="large" placeholder="Last Name" />
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

                            {/* =============== STEP 2: Contact & Address =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <PhoneOutlined style={{ color: '#1565c0' }} /> Contact & Address
                                </h3>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Phone Number"
                                            name="phone"
                                            rules={[{ required: true, message: 'Phone number is required' }]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="+251 9XX XXX XXXX"
                                                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Email Address"
                                            name="email"
                                            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="minister@church.com"
                                                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Address" name="address">
                                    <Input
                                        size="large"
                                        placeholder="123 Church St, City, State"
                                        prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />}
                                    />
                                </Form.Item>
                            </div>

                            {/* =============== STEP 3: Ministry Details =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GlobalOutlined style={{ color: '#1565c0' }} /> Ministry Details
                                </h3>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="title"
                                            label="Minister Title"
                                            rules={[{ required: true, message: 'Title is required' }]}
                                        >
                                            <Select placeholder="Select title" size="large">
                                                <Option value="Senior Pastor">Senior Pastor</Option>
                                                <Option value="Associate Pastor">Associate Pastor</Option>
                                                <Option value="Youth Evangelist">Youth Evangelist</Option>
                                                <Option value="Deacon">Deacon</Option>
                                                <Option value="Church Elder">Church Elder</Option>
                                                <Option value="Worship Leader">Worship Leader</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="department" label="Department">
                                            <Select placeholder="Select department" size="large" allowClear>
                                                <Option value="Pastoral">Pastoral</Option>
                                                <Option value="Youth">Youth</Option>
                                                <Option value="Worship">Worship</Option>
                                                <Option value="Administration">Administration</Option>
                                                <Option value="Education">Education</Option>
                                                <Option value="Outreach">Outreach</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item name="status" label="Status">
                                            <Radio.Group buttonStyle="solid" size="large">
                                                <Radio.Button value="active">Active</Radio.Button>
                                                <Radio.Button value="inactive">Inactive</Radio.Button>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="ordination_date" label="Ordination Date">
                                            <DatePicker style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="bio" label="Short Biography (Optional)">
                                    <Input.TextArea rows={3} placeholder="Brief description of the minister's background and calling..." />
                                </Form.Item>
                            </div>

                            {/* =============== STEP 4: Review =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Registration
                                </h3>

                                <div style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #e2e8f0',
                                    marginTop: '16px'
                                }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Registration Summary</h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Name:</strong> {values.first_name || '—'} {values.middle_name || ''} {values.last_name || ''}</div>
                                                    <div><strong>Title:</strong> {values.title || '—'}</div>
                                                    <div><strong>Phone:</strong> {values.phone || '—'}</div>
                                                    <div><strong>Email:</strong> {values.email || '—'}</div>
                                                    <div><strong>Department:</strong> {values.department || '—'}</div>
                                                    <div><strong>Status:</strong> {values.status || '—'}</div>
                                                    <div><strong>Address:</strong> {values.address || '—'}</div>
                                                    <div><strong>Ordination:</strong> {values.ordination_date ? values.ordination_date.format('YYYY-MM-DD') : '—'}</div>
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

export default AddMinister;
