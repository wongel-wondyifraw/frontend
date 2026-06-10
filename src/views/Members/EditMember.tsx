'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Select, DatePicker, Button, Upload, message, Row, Col, Spin, Radio,Avatar } from 'antd';
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
    InboxOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import { updateMember, getMemberById, API_BASE_URL } from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import type { UploadChangeParam } from 'antd/es/upload';
import dayjs, { type Dayjs } from 'dayjs';
import './AddMember.css';

const { Option } = Select;
const { Dragger } = Upload;

const STEPS = [
    { title: 'Personal Info' },
    { title: 'Contact & Address' },
    { title: 'Membership Details' },
    { title: 'Review' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
];

const EditMember = () => {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

// Function to handle image preview
const handleAvatarChange = (info: UploadChangeParam) => {
    const file = info.file;
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result as string);
        reader.readAsDataURL(file as unknown as Blob);
        
        // Update the form field manually so onFinish gets it
        form.setFieldsValue({ profileImage: [info.file] });
    }
};

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
            } catch (error: unknown) {
                message.error(getApiErrorMessage(error, 'Failed to fetch member details'));
                router.push('/members/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchMember();
    }, [id, form, router]);

    const normFile = (e: { fileList?: unknown[] } | unknown[]) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    // Clickable step navigation with validation
    const handleStepClick = async (step: number) => {
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

    const onFinish = async (values: Record<string, unknown> & {
        date_of_birth?: Dayjs;
        joined_date?: Dayjs;
        profileImage?: { originFileObj?: File }[];
    }) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('first_name', values.first_name as string);
            formData.append('last_name', values.last_name as string);
            formData.append('phone', values.phone as string);
            formData.append('status', values.status as string);
            formData.append('baptized', values.baptized as string);

            // Handle Dates correctly
            if (values.date_of_birth) formData.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
            if (values.joined_date) formData.append('joined_date', values.joined_date.format('YYYY-MM-DD'));

            // Handle Image (Ensure key matches your Multer @FileInterceptor)
            if (values.profileImage?.[0]?.originFileObj) {
                formData.append('file', values.profileImage[0].originFileObj);
            }

            await updateMember(id, formData);

            message.success('Member updated successfully');
            router.push('/members/manage');
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to update member'));
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
        <div className="add-member-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
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
                            onCancel={() => router.back()}
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

                                {/* Avatar + Name fields side by side */}
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
                                                <Input size="large" placeholder="John" />
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
                                                placeholder="john@example.com"
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
                            {/* =============== STEP 3: Membership Status =============== */}
                             <div>
    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GlobalOutlined style={{ color: '#1565c0' }} /> Church Details
    </h3>

    <Row gutter={24}>
        <Col span={12}>
            <Form.Item name="status" label="Membership Status">
                <Radio.Group buttonStyle="solid" size="large">
                    <Radio.Button value="active">Active</Radio.Button>
                    <Radio.Button value="inactive">Inactive</Radio.Button>
                </Radio.Group>
            </Form.Item>
        </Col>
        
        <Col span={12}>
            <Form.Item name="baptized" label="Baptized?">
                <Radio.Group buttonStyle="solid" size="large">
                    <Radio.Button value="yes">Yes</Radio.Button>
                    <Radio.Button value="no">No</Radio.Button>
                </Radio.Group>
            </Form.Item>
        </Col>
    </Row>

    <Row gutter={24}>
        <Col span={24}>
            <Form.Item name="joined_date" label="Joined Date">
                <DatePicker style={{ width: '100%' }} size="large" />
            </Form.Item>
        </Col>
    </Row>

    {/* Drag and Drop File Upload */}
    <Row gutter={24}>
        <Col span={24}>
            <Form.Item
                label="Church Letter (Optional)"
                name="church_letter"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            >
                <Dragger 
                    name="file" 
                    multiple={false} 
                    beforeUpload={() => false} // Stops auto-upload to server
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag church letter to this area to upload</p>
                    <p className="ant-upload-hint">Support for a single PDF or Image file.</p>
                </Dragger>
            </Form.Item>
        </Col>
    </Row>
</div>


                            {/* =============== STEP 4:Review =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Membership Status
                                </h3>


                                {/* Review Summary */}
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
                        </StepperWizard>
                    </Form>
                </div>
            </div>
    );
};

export default EditMember;