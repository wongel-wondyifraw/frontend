'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Select, DatePicker, Button, Upload, message, Avatar, Row, Col, Radio, Typography, Divider, AutoComplete } from 'antd';
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
    EnvironmentOutlined,
    TeamOutlined,
    HeartOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import { updateMember, getMemberById, uploadMemberImage, getLocations, getMinistries, getMembersList, createLocation, uploadDocument } from '../../services/api';
import { buildMemberPayload } from '@/lib/member-payload';
import { getApiErrorMessage } from '@/lib/errors';
import { getImageUrl } from '@/lib/media-url';
import type { UploadChangeParam } from 'antd/es/upload';
import dayjs, { type Dayjs } from 'dayjs';
import type { Location, Ministry, Member } from '@/types';
import './AddMember.css';

const { Option } = Select;
const { Dragger } = Upload;

const STEPS = [
    { title: 'Personal Info' },
    { title: 'Contact & Location' },
    { title: 'Spiritual Info' },
    { title: 'Ministry Info' },
    { title: 'Review' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
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

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
    const [churchLetterFile, setChurchLetterFile] = useState<File | null>(null);
    const [memberData, setMemberData] = useState<Awaited<ReturnType<typeof getMemberById>> | null>(null);

    const [locations, setLocations] = useState<Location[]>([]);
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        getLocations('active').then(setLocations).catch(() => {});
        getMinistries({ limit: 100 }).then(res => setMinistries(res.data)).catch(() => {});
        getMembersList().then(setMembers).catch(() => {});
    }, []);

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
        const fetchMember = async () => {
            try {
                const member = await getMemberById(id);
                setMemberData(member);
            } catch (error: unknown) {
                message.error(getApiErrorMessage(error, 'Failed to fetch member details'));
                router.push('/members/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchMember();
    }, [id, router]);

    useEffect(() => {
        if (initialLoading || !memberData) return;
        form.setFieldsValue({
            first_name: memberData.first_name,
            middle_name: memberData.middle_name,
            last_name: memberData.last_name,
            email: memberData.email,
            phone: memberData.phone,
            address: memberData.address,
            date_of_birth: memberData.date_of_birth ? dayjs(memberData.date_of_birth) : null,
            marital_status: memberData.marital_status,
            gender: memberData.gender || undefined,
            status: memberData.status,
            joined_date: memberData.joined_date ? dayjs(memberData.joined_date) : null,
            baptized: memberData.baptized === true || memberData.baptized === 'true' ? 'yes' : memberData.baptized === false || memberData.baptized === 'false' ? 'no' : memberData.baptized,
            holy_spirit_baptized: memberData.holy_spirit_baptized === true || memberData.holy_spirit_baptized === 'true' ? 'yes' : 'no',
            telegram_username: (memberData as any).telegram_username,
            // Use format if salvation_date exists
            salvation_date: (memberData as any).salvation_date ? dayjs((memberData as any).salvation_date) : undefined,
            location_id: (memberData as any).location?.name || (memberData as any).location_id,
            interested_ministries: (memberData as any).interested_ministries || [],
        });
        if (memberData.image_url) {
            setAvatarPreview(getImageUrl(memberData.image_url));
        }
    }, [initialLoading, memberData, form]);

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

            let letterUrl: string | undefined;
            if (churchLetterFile) {
                letterUrl = await uploadDocument(churchLetterFile);
            }

            const payload = buildMemberPayload(values, imageUrl ? { image_url: imageUrl } : {});
            let finalLocationId = values.location_id;
            if (finalLocationId) {
                const existingLoc = locations.find(l => l.name.toLowerCase() === finalLocationId.toLowerCase() || l.id === finalLocationId);
                if (existingLoc) {
                    finalLocationId = existingLoc.id;
                } else {
                    const newLoc = await createLocation({ name: finalLocationId, status: 'active' });
                    finalLocationId = newLoc.id;
                }
            }

            const finalPayload = {
                ...payload,
                telegram_username: values.telegram_username,
                salvation_date: values.salvation_date ? values.salvation_date.format('YYYY-MM-DD') : undefined,
                location_id: finalLocationId,
                interested_ministries: values.interested_ministries,
                holy_spirit_baptized: values.holy_spirit_baptized === 'yes',
                ...(letterUrl ? { recommendation_letter_url: letterUrl } : {})
            };
            await updateMember(id, finalPayload);

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
                                        <Select placeholder="Select status" size="large" allowClear>
                                            <Option value="single">Single</Option>
                                            <Option value="married">Married</Option>
                                            <Option value="divorced">Divorced</Option>
                                            <Option value="widowed">Widowed</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="When did you receive Jesus as a Saviour?" name="salvation_date">
                                        <DatePicker style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* =============== STEP 2: Contact & Location =============== */}
                        <div>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <EnvironmentOutlined style={{ color: '#1565c0' }} /> Contact & Location
                            </h3>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Phone Number"
                                        name="phone"
                                        rules={[{ required: true, message: 'Phone number is required' }]}
                                    >
                                        <Input size="large" placeholder="+251 9XX XXX XXXX" prefix={<PhoneOutlined />} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Email Address"
                                        name="email"
                                        rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                                    >
                                        <Input size="large" placeholder="john@example.com" prefix={<MailOutlined />} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Telegram Username" name="telegram_username">
                                        <Input size="large" placeholder="@username" prefix="@" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Location" name="location_id">
                                        <AutoComplete
                                            options={locations.map(loc => ({ value: loc.name }))}
                                            placeholder="Search or enter location"
                                            size="large"
                                            filterOption={(inputValue, option) =>
                                                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Specific Address" name="address">
                                <Input.TextArea rows={3} placeholder="House number, Street, etc." />
                            </Form.Item>
                        </div>

                        {/* =============== STEP 3: Spiritual Info =============== */}
                        <div>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GlobalOutlined style={{ color: '#1565c0' }} /> Spiritual Info
                            </h3>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="baptized" label="Water Baptized?">
                                        <Radio.Group buttonStyle="solid" size="large">
                                            <Radio.Button value="yes">Yes</Radio.Button>
                                            <Radio.Button value="no">No</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="holy_spirit_baptized" label="Holy Spirit Baptized?">
                                        <Radio.Group buttonStyle="solid" size="large">
                                            <Radio.Button value="yes">Yes</Radio.Button>
                                            <Radio.Button value="no">No</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Church Letter">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Upload showUploadList={false} beforeUpload={(file) => {
                                                setChurchLetterFile(file);
                                                return false;
                                            }}>
                                                <Button icon={<UploadOutlined />}>Upload New Letter</Button>
                                            </Upload>
                                            {churchLetterFile ? (
                                                <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> {churchLetterFile.name}</span>
                                            ) : memberData?.recommendation_letter_url ? (
                                                <span style={{ color: '#1890ff' }}>Existing letter uploaded</span>
                                            ) : null}
                                        </div>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="joined_date" label="Joined Date">
                                        <DatePicker style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* =============== STEP 4: Ministry Info =============== */}
                        <div>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TeamOutlined style={{ color: '#1565c0' }} /> Ministry Information
                            </h3>

                            <Form.Item label="Interested Ministries" name="interested_ministries">
                                <Checkbox.Group style={{ width: '100%' }}>
                                    <Row gutter={[16, 16]}>
                                        {['Prayer', 'Worship', 'Preaching', 'Music', 'Deacons', 'Bible Study', 'Ushering', 'Youth', 'Children', 'Media/Tech', 'Evangelism'].map(name => (
                                            <Col span={8} key={name}>
                                                <Checkbox value={name}>{name}</Checkbox>
                                            </Col>
                                        ))}
                                    </Row>
                                </Checkbox.Group>
                            </Form.Item>
                        </div>

                        {/* =============== STEP 5: Review =============== */}
                        <div>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review
                            </h3>

                            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                                <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Update Summary</h4>
                                <Form.Item noStyle shouldUpdate>
                                    {() => {
                                        const values = form.getFieldsValue();
                                        return (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
                                                <div><strong>Name:</strong> {values.first_name || '—'} {values.last_name || ''}</div>
                                                <div><strong>Phone:</strong> {values.phone || '—'}</div>
                                                <div><strong>Location:</strong> {locations.find(l => l.id === values.location_id || l.name === values.location_id)?.name || values.location_id || '—'}</div>
                                                <div><strong>Water Baptized:</strong> {values.baptized || '—'}</div>
                                                <div><strong>Holy Spirit Baptized:</strong> {values.holy_spirit_baptized || '—'}</div>
                                                <div><strong>Church Letter:</strong> {churchLetterFile ? churchLetterFile.name : (memberData?.recommendation_letter_url ? 'Existing letter' : '—')}</div>
                                                <div><strong>Joined Date:</strong> {values.joined_date ? values.joined_date.format('YYYY-MM-DD') : '—'}</div>
                                                <div><strong>Salvation Date:</strong> {values.salvation_date ? values.salvation_date.format('YYYY-MM-DD') : '—'}</div>
                                                <div><strong>Interested Ministries:</strong> {values.interested_ministries?.length ? `${values.interested_ministries.length} selected` : 'None'}</div>
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