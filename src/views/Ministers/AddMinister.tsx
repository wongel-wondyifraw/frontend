'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Upload,
  Avatar,
  Row,
  Col,
  Radio,
  Modal,
  Typography,
} from 'antd';
import { message } from '@/lib/app-message';
import {
  ArrowLeftOutlined, UserOutlined, UploadOutlined, MailOutlined, PhoneOutlined,
  HomeOutlined, CheckCircleOutlined, GlobalOutlined, CopyOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import { createMinister, uploadMemberImage } from '../../services/api';
import { buildMinisterPayload } from '@/lib/minister-payload';
import { getApiErrorMessage } from '@/lib/errors';
import type { UploadChangeParam } from 'antd/es/upload';
import './AddMinister.css';

const { Option } = Select;
const { Paragraph, Text } = Typography;

const STEPS = [
  { title: 'Personal Info' },
  { title: 'Contact & Address' },
  { title: 'Role Details' },
  { title: 'Review' },
];

const STEP_BACKGROUNDS = [
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
];

const AddMinister = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['first_name', 'last_name']);
      } else if (currentStep === 1) {
        await form.validateFields(['email', 'phone']);
      }
      setCurrentStep(currentStep + 1);
    } catch {
      message.error('Please correct the errors before proceeding.');
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  const handleAvatarChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setAvatarFile(file as File);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file as File);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let imageUrl: string | undefined;
      if (avatarFile) {
        imageUrl = await uploadMemberImage(avatarFile);
      }

      const payload = buildMinisterPayload(values, imageUrl ? { image_url: imageUrl } : {});
      const result = await createMinister(payload);

      setCredentials({
        email: result.email,
        password: result.temporary_password || '',
      });
      message.success('Minister registered successfully!');
    } catch (error) {
      console.error(error);
      message.error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-member-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
      >
        Back to Ministers
      </Button>

      <div className="add-member-header">
        <h1>New Minister Registration</h1>
        <p>Register a minister and create their login account automatically.</p>
      </div>

      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active' }}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={prev}
            onCancel={() => router.back()}
            submitText="Confirm Registration"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
          >
            <div>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined style={{ color: '#1565c0' }} /> Personal Information
              </h3>
              <div className="member-identity-row">
                <div className="member-avatar-block">
                  <Avatar
                    size={128}
                    src={avatarPreview}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#f0f2f5', border: '2px solid #d9d9d9' }}
                  />
                  <div className="member-avatar-actions">
                    <Upload showUploadList={false} beforeUpload={() => false} onChange={handleAvatarChange}>
                      <Button size="small" icon={<UploadOutlined />}>Photo</Button>
                    </Upload>
                  </div>
                </div>
                <div className="member-name-fields">
                  <div className="member-name-grid">
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
                <Col xs={24} md={12}>
                  <Form.Item label="Date of Birth" name="date_of_birth">
                    <DatePicker style={{ width: '100%' }} size="large" placeholder="Select date" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Gender"
                    name="gender"
                    rules={[{ required: true, message: 'Gender is required' }]}
                  >
                    <Select placeholder="Select gender" size="large">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
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

            <div>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneOutlined style={{ color: '#1565c0' }} /> Contact & Address
              </h3>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: 'Email is required for login' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                    extra="Used as the login username for this minister."
                  >
                    <Input size="large" placeholder="minister@example.com" prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Phone Number" name="phone" rules={[{ required: true, message: 'Phone number is required' }]}>
                    <Input size="large" placeholder="+251 9XX XXX XXXX" prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Address" name="address">
                <Input size="large" placeholder="123 Church St, City, State" prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GlobalOutlined style={{ color: '#1565c0' }} /> Role Details
              </h3>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="title" label="Title / Designation">
                    <Input size="large" placeholder="e.g. Senior Pastor, Associate Minister" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="status" label="Account Status">
                    <Radio.Group buttonStyle="solid" size="large">
                      <Radio.Button value="active">Active</Radio.Button>
                      <Radio.Button value="inactive">Inactive</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="joined_date" label="Joined Date">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
              <Text type="secondary">
                A login account with the <strong>minister</strong> role and a randomly generated password will be created automatically.
              </Text>
            </div>

            <div>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review
              </h3>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-color)' }}>
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue();
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: '13px' }}>
                        <div><strong>Name:</strong> {values.first_name || '—'} {values.middle_name || ''} {values.last_name || ''}</div>
                        <div><strong>Email:</strong> {values.email || '—'}</div>
                        <div><strong>Phone:</strong> {values.phone || '—'}</div>
                        <div><strong>Title:</strong> {values.title || '—'}</div>
                        <div><strong>Address:</strong> {values.address || '—'}</div>
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

      <Modal
        title="Minister account created"
        open={!!credentials}
        closable={false}
        mask={{ closable: false }}
        onOk={() => router.push('/ministers/manage')}
        okText="Go to Ministers"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Text>
          Share these login credentials with the minister now. The password is shown only once.
        </Text>
        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Email</Text>
            <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0, fontWeight: 600 }}>
              {credentials?.email}
            </Paragraph>
          </div>
          <div>
            <Text type="secondary">Temporary password</Text>
            <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0, fontWeight: 600 }}>
              {credentials?.password}
            </Paragraph>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddMinister;
