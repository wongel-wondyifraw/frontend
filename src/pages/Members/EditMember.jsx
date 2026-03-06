import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Upload, message, Row, Col, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    GlobalOutlined,
    PaperClipOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import { updateMember, getMemberById, API_BASE_URL } from '../../services/api';
import dayjs from 'dayjs';
import './AddMember.css';

const { Option } = Select;

const STEPS = [
    { title: 'Personal Info' },
    { title: 'Church Details' },
    { title: 'Attachments & Review' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f0f9ff', border: '1px solid #bae6fd' },
    { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

const EditMember = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const member = await getMemberById(id);
                form.setFieldsValue({
                    first_name: member.first_name,
                    middle_name: member.middle_name,
                    last_name: member.last_name,
                    email: member.email,
                    phone: member.phone,
                    address: member.address,
                    date_of_birth: member.date_of_birth ? dayjs(member.date_of_birth) : null,
                    marital_status: member.marital_status,
                    status: member.status,
                    joined_date: member.joined_date ? dayjs(member.joined_date) : null,
                    baptized: member.baptized,
                });
            } catch (error) {
                message.error(error.message || 'Failed to fetch member details');
                navigate('/members/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchMember();
    }, [id, form, navigate]);

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    // Clickable step navigation with validation
    const handleStepClick = async (step) => {
        if (currentStep === 0 && step > 0) {
            try {
                await form.validateFields(['first_name', 'last_name', 'phone']);
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
                await form.validateFields(['first_name', 'last_name', 'phone']);
            }
            setCurrentStep(currentStep + 1);
        } catch (error) {
            message.error('Please correct the errors before proceeding.');
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('first_name', values.first_name);
            formData.append('last_name', values.last_name);
            formData.append('phone', values.phone);
            formData.append('status', values.status);
            formData.append('baptized', values.baptized);

            // Handle Dates correctly
            if (values.date_of_birth) formData.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
            if (values.joined_date) formData.append('joined_date', values.joined_date.format('YYYY-MM-DD'));

            // Handle Image (Ensure key matches your Multer @FileInterceptor)
            if (values.profileImage?.[0]?.originFileObj) {
                formData.append('file', values.profileImage[0].originFileObj);
            }

            await updateMember(id, formData);

            message.success('Member updated successfully');
            navigate('/members/manage');
        } catch (error) {
            message.error(error.message || 'Failed to update member');
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
            <div className="add-member-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Members
                </Button>

                <div className="add-member-header">
                    <h1>Edit Member Details</h1>
                    <p>Update personal information and contact details.</p>
                </div>

                <div className="content-card-unified">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ status: 'active' }}
                    >
                        <StepperWizard
                            steps={STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            onCancel={() => navigate(-1)}
                            submitText="Update Member"
                            submitLoading={loading}
                            stepBackgrounds={STEP_BACKGROUNDS}
                            onStepClick={handleStepClick}
                        >
                            {/* =============== STEP 1: Personal Information =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserOutlined style={{ color: '#1565c0' }} /> Personal Information
                                </h3>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="first_name"
                                            label="First Name"
                                            rules={[{ required: true, message: 'Please enter first name' }]}
                                        >
                                            <Input placeholder="John" size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="middle_name" label="Middle Name">
                                            <Input placeholder="Optional" size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="lastName"
                                            label="Last Name"
                                            rules={[{ required: true, message: 'Please enter last name' }]}
                                        >
                                            <Input placeholder="Doe" size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="phone"
                                            label="Phone Number"
                                            rules={[{ required: true, message: 'Please enter phone number' }]}
                                        >
                                            <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+251 9XX XXX XXXX" size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="email"
                                            label="Email Address"
                                            rules={[
                                                { type: 'email', message: 'Please enter a valid email' }
                                            ]}
                                        >
                                            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="john@example.com" size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="address" label="Address">
                                            <Input prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />} placeholder="123 Church St, City, State" size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item name="dob" label="Date of Birth">
                                            <DatePicker style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="maritalStatus" label="Marital Status">
                                            <Select placeholder="Select status" size="large">
                                                <Option value="single">Single</Option>
                                                <Option value="married">Married</Option>
                                                <Option value="divorced">Divorced</Option>
                                                <Option value="widowed">Widowed</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* =============== STEP 2: Church Details =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GlobalOutlined style={{ color: '#1565c0' }} /> Church Details
                                </h3>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item name="role" label="Role" initialValue="Member">
                                            <Select size="large">
                                                <Option value="Member">Member</Option>
                                                <Option value="Volunteer">Volunteer</Option>
                                                <Option value="Leader">Leader</Option>
                                                <Option value="Staff">Staff</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="status" label="Membership Status">
                                            <Select size="large">
                                                <Option value="active">Active</Option>
                                                <Option value="inactive">Inactive</Option>
                                                <Option value="visitor">Visitor</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item name="joinedDate" label="Joined Date">
                                            <DatePicker style={{ width: '100%' }} size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="baptized" label="Baptized?">
                                            <Select size="large">
                                                <Option value="yes">Yes</Option>
                                                <Option value="no">No</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="ministry" label="Assign to Ministry (Optional)">
                                    <Select placeholder="Select ministries" mode="multiple" size="large">
                                        <Option value="worship">Worship Team</Option>
                                        <Option value="kids">Kids Church</Option>
                                        <Option value="ushers">Ushers</Option>
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* =============== STEP 3: Attachments & Review =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <PaperClipOutlined style={{ color: '#1565c0' }} /> Attachments & Review
                                </h3>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item name="profileImage" label="Profile Image" valuePropName="fileList" getValueFromEvent={normFile}>
                                            <Upload beforeUpload={() => false} listType="picture" maxCount={1}>
                                                <Button icon={<UploadOutlined />}>Upload Profile Picture</Button>
                                            </Upload>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="churchLetter" label="Church Letter / Transfer Certificate (Optional)">
                                            <Upload maxCount={1}>
                                                <Button icon={<UploadOutlined />}>Upload Document</Button>
                                            </Upload>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Review Summary */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #e2e8f0',
                                    marginTop: '16px'
                                }}>
                                    <h4 style={{ marginBottom: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircleOutlined style={{ color: '#1565c0' }} /> Update Summary
                                    </h4>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const values = form.getFieldsValue();
                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                    <div><strong>Name:</strong> {values.first_name || '—'} {values.middle_name || ''} {values.last_name || ''}</div>
                                                    <div><strong>Phone:</strong> {values.phone || '—'}</div>
                                                    <div><strong>Email:</strong> {values.email || '—'}</div>
                                                    <div><strong>Address:</strong> {values.address || '—'}</div>
                                                    <div><strong>Date of Birth:</strong> {values.dob ? values.dob.format('YYYY-MM-DD') : '—'}</div>
                                                    <div><strong>Marital Status:</strong> {values.maritalStatus || '—'}</div>
                                                    <div><strong>Role:</strong> {values.role || '—'}</div>
                                                    <div><strong>Status:</strong> {values.status || '—'}</div>
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

export default EditMember;