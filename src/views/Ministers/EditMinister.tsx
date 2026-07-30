'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Form, Input, Select, DatePicker, Button, Upload, message, Row, Col, Spin, Radio, Avatar,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, UploadOutlined, MailOutlined, PhoneOutlined,
  HomeOutlined, GlobalOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import { updateMinister, getMinisterById, uploadMemberImage } from '../../services/api';
import { buildMinisterPayload } from '@/lib/minister-payload';
import { getApiErrorMessage } from '@/lib/errors';
import type { UploadChangeParam } from 'antd/es/upload';
import type { Minister } from '@/types';
import dayjs, { type Dayjs } from 'dayjs';
import './AddMinister.css';

const { Option } = Select;

const STEPS = [
  { title: 'Personal Info' },
  { title: 'Contact & Address' },
  { title: 'Role Details' },
  { title: 'Review' },
];

const STEP_BACKGROUNDS = [
  { background: '#f8fafc', border: 'none' },
  { background: '#f8fafc', border: 'none' },
  { background: '#f8fafc', border: 'none' },
  { background: '#f8fafc', border: 'none' },
];

const EditMinister = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [ministerData, setMinisterData] = useState<Minister | null>(null);

  const handleAvatarChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setAvatarFile(file as File);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file as Blob);
    }
  };

  useEffect(() => {
    const fetchMinister = async () => {
      try {
        const minister = await getMinisterById(id);
        setMinisterData(minister);
      } catch (error: unknown) {
        message.error(getApiErrorMessage(error, 'Failed to fetch minister details'));
        router.push('/ministers/manage');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchMinister();
  }, [id, router]);

  useEffect(() => {
    if (initialLoading || !ministerData) return;
    form.setFieldsValue({
      first_name: ministerData.first_name,
      middle_name: ministerData.middle_name,
      last_name: ministerData.last_name,
      email: ministerData.email,
      phone: ministerData.phone,
      address: ministerData.address,
      date_of_birth: ministerData.date_of_birth ? dayjs(ministerData.date_of_birth) : null,
      marital_status: ministerData.marital_status,
      gender: ministerData.gender || undefined,
      status: ministerData.status,
      title: ministerData.title,
      joined_date: ministerData.joined_date ? dayjs(ministerData.joined_date) : null,
    });
    if (ministerData.image_url) setAvatarPreview(ministerData.image_url);
  }, [initialLoading, ministerData, form]);

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['first_name', 'last_name']);
      } else if (currentStep === 1) {
        await form.validateFields(['phone']);
      }
      setCurrentStep(currentStep + 1);
    } catch {
      message.error('Please correct the errors before proceeding.');
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  const onFinish = async (values: Record<string, unknown> & {
    date_of_birth?: Dayjs;
    joined_date?: Dayjs;
  }) => {
    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (avatarFile) {
        imageUrl = await uploadMemberImage(avatarFile);
      }
      const payload = buildMinisterPayload(values, imageUrl ? { image_url: imageUrl } : {});
      delete payload.email;
      await updateMinister(id, payload);
      message.success('Minister updated successfully');
      router.push('/ministers/manage');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update minister'));
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
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}>
        Back to Ministers
      </Button>
      <div className="add-member-header">
        <h1>Edit Minister</h1>
        <p>Update minister profile details. Login email cannot be changed here.</p>
      </div>
      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={prev}
            onCancel={() => router.back()}
            submitText="Save Changes"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
          >
            <div>
              <h3 style={{ marginBottom: 20 }}><UserOutlined style={{ color: '#1565c0' }} /> Personal Information</h3>
              <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar size={100} src={avatarPreview} icon={<UserOutlined />} style={{ backgroundColor: '#f0f2f5', border: '2px solid #d9d9d9' }} />
                  <div style={{ marginTop: 8 }}>
                    <Upload showUploadList={false} beforeUpload={() => false} onChange={handleAvatarChange}>
                      <Button size="small" icon={<UploadOutlined />}>Photo</Button>
                    </Upload>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item label="Middle Name" name="middle_name">
                      <Input size="large" />
                    </Form.Item>
                  </div>
                  <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
                    <Input size="large" />
                  </Form.Item>
                </div>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Date of Birth" name="date_of_birth">
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
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
                <Col span={12}>
                  <Form.Item label="Marital Status" name="marital_status">
                    <Select allowClear size="large">
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
              <h3 style={{ marginBottom: 20 }}><PhoneOutlined style={{ color: '#1565c0' }} /> Contact & Address</h3>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Email Address" name="email">
                    <Input size="large" disabled prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Phone Number" name="phone" rules={[{ required: true }]}>
                    <Input size="large" prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Address" name="address">
                <Input size="large" prefix={<HomeOutlined />} />
              </Form.Item>
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}><GlobalOutlined style={{ color: '#1565c0' }} /> Role Details</h3>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="title" label="Title / Designation">
                    <Input size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
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
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}><CheckCircleOutlined style={{ color: '#1565c0' }} /> Review</h3>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const values = form.getFieldsValue();
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                      <div><strong>Name:</strong> {values.first_name} {values.last_name}</div>
                      <div><strong>Email:</strong> {values.email}</div>
                      <div><strong>Phone:</strong> {values.phone || '—'}</div>
                      <div><strong>Title:</strong> {values.title || '—'}</div>
                      <div><strong>Status:</strong> {values.status || '—'}</div>
                    </div>
                  );
                }}
              </Form.Item>
            </div>
          </StepperWizard>
        </Form>
      </div>
    </div>
  );
};

export default EditMinister;
