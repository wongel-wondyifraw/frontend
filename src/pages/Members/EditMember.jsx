import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Upload, message, Row, Col, Spin, Radio, Avatar } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    GlobalOutlined,
    CheckCircleOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import { updateMember, getMemberById, API_BASE_URL } from '../../services/api';
import dayjs from 'dayjs';
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
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [existingDocumentUrl, setExistingDocumentUrl] = useState(null);

    // Handle new avatar selection
    const handleAvatarChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    // Fetch existing member data on mount
    useEffect(() => {
        const fetchMember = async () => {
            try {
                const member = await getMemberById(id);

                // Set the existing avatar preview from the database
                if (member.image_url) {
                    setAvatarPreview(`${API_BASE_URL}/${member.image_url.replace(/^\//, '')}`);
                }

                // Track existing document
                if (member.document_url) {
                    setExistingDocumentUrl(member.document_url);
                }

                // Convert baptized boolean to string for the Radio.Group
                let baptizedValue = undefined;
                if (member.baptized === true) baptizedValue = 'yes';
                else if (member.baptized === false) baptizedValue = 'no';

                form.setFieldsValue({
                    first_name: member.first_name,
                    middle_name: member.middle_name || '',
                    last_name: member.last_name,
                    email: member.email || '',
                    phone: member.phone || '',
                    address: member.address || '',
                    date_of_birth: member.date_of_birth ? dayjs(member.date_of_birth) : null,
                    marital_status: member.marital_status || undefined,
                    status: member.status || 'active',
                    joined_date: member.joined_date ? dayjs(member.joined_date) : null,
                    baptized: baptizedValue,
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

    // Clickable step navigation with validation
    const handleStepClick = async (step) => {
        if (currentStep === 0 && step > 0) {
            try {
                await form.validateFields(['first_name', 'last_name']);
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

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const formData = new FormData();

            // Append all text fields (skip files and dates for custom handling)
            const skipKeys = ['avatar', 'church_letter', 'date_of_birth', 'joined_date'];
            Object.keys(values).forEach(key => {
                if (!skipKeys.includes(key) && values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            // Dates
            if (values.date_of_birth) formData.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
            if (values.joined_date) formData.append('joined_date', values.joined_date.format('YYYY-MM-DD'));

            // Avatar file (only if a new one was selected)
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            // Document file (only if a new one was selected)
            if (documentFile) {
                formData.append('document', documentFile);
            } else if (values.church_letter?.file) {
                formData.append('document', values.church_letter.file.originFileObj || values.church_letter.file);
            }

            await updateMember(id, formData);
            message.success('Member updated successfully');
            navigate('/members/manage');
        } catch (error) {
            console.error(error);
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

    // Get the first letter for avatar fallback
    const firstNameValue = form.getFieldValue('first_name') || '';
    const initial = firstNameValue.charAt(0).toUpperCase() || '?';

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
                        onFinish={handleSubmit}
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

                                {/* Avatar + Name fields side by side */}
                                <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'flex-start' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Avatar
                                            size={100}
                                            src={avatarPreview}
                                            style={{ backgroundColor: '#1565c0', fontWeight: 600, fontSize: '36px', border: '2px solid #d9d9d9' }}
                                        >
                                            {initial}
                                        </Avatar>
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
                                        <Form.Item label="Church Letter (Optional)" name="church_letter">
                                            <Dragger
                                                name="file"
                                                multiple={false}
                                                beforeUpload={() => false}
                                            >
                                                <p className="ant-upload-drag-icon">
                                                    <InboxOutlined />
                                                </p>
                                                <p className="ant-upload-text">Click or drag church letter to this area to upload</p>
                                                <p className="ant-upload-hint">Support for a single PDF or Image file.</p>
                                            </Dragger>
                                        </Form.Item>
                                        {existingDocumentUrl && (
                                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '-16px' }}>
                                                Existing document on file. Upload a new one to replace it.
                                            </p>
                                        )}
                                    </Col>
                                </Row>
                            </div>

                            {/* =============== STEP 4: Review =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Changes
                                </h3>

                                {/* Review Summary */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    border: '1px solid #e2e8f0',
                                    marginTop: '16px'
                                }}>
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
                                                    <div><strong>Baptized:</strong> {values.baptized === 'yes' ? 'Yes' : values.baptized === 'no' ? 'No' : '—'}</div>
                                                    <div><strong>Joined:</strong> {values.joined_date ? values.joined_date.format('YYYY-MM-DD') : '—'}</div>
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