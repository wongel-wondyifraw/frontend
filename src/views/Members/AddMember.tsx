'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, DatePicker, Button, Upload, message, Avatar, Row, Col, Radio, Typography, Divider, Checkbox, AutoComplete } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    GlobalOutlined,
    InboxOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    HeartOutlined,
    DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import { createMember, createFamily, addFamilyChild, uploadMemberImage, getLocations, getMinistries, getMembersList, createLocation, uploadDocument } from '../../services/api';
import { buildMemberPayload } from '@/lib/member-payload';
import { getApiErrorMessage } from '@/lib/errors';
import type { UploadChangeParam } from 'antd/es/upload';
import type { Location, Ministry, Member } from '@/types';
import './AddMember.css';

const { Dragger } = Upload;
const { Option } = Select;
const { Title, Text } = Typography;

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

const AddMember = () => {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
    const [churchLetterFile, setChurchLetterFile] = useState<File | null>(null);

    const [locations, setLocations] = useState<Location[]>([]);
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        getLocations('active').then(setLocations).catch(() => {});
        getMinistries({ limit: 100 }).then(res => setMinistries(res.data)).catch(() => {});
        getMembersList().then(setMembers).catch(() => {});
    }, []);

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

            let letterUrl: string | undefined;
            if (churchLetterFile) {
                letterUrl = await uploadDocument(churchLetterFile);
            }

            // Map values to payload, especially handling the new fields
            const payload = buildMemberPayload(values, imageUrl ? { image_url: imageUrl } : {});
            
            // Map additional fields manually before sending (since buildMemberPayload might not have all new ones)
            let finalLocationId = values.location_id;
            if (finalLocationId) {
                const existingLoc = locations.find(l => l.name.toLowerCase() === finalLocationId.toLowerCase());
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
                recommendation_letter_url: letterUrl,
            };

            const createdMember = await createMember(finalPayload);
            
            // Handle automatic family creation for single parents
            if (values.has_children && values.children && values.children.length > 0 && ['single', 'divorced', 'widowed'].includes(values.marital_status)) {
                const familyPayload = {
                    name: `${values.last_name} Family`,
                    husband_id: values.gender === 'male' ? createdMember.id : undefined,
                    husband_type: values.gender === 'male' ? 'member' : undefined,
                    wife_id: values.gender === 'female' ? createdMember.id : undefined,
                    wife_type: values.gender === 'female' ? 'member' : undefined,
                };
                const createdFamily = await createFamily(familyPayload);
                
                for (const c of values.children) {
                    await addFamilyChild(createdFamily.id, {
                        name: c.name,
                        date_of_birth: c.date_of_birth ? c.date_of_birth.format('YYYY-MM-DD') : undefined,
                    } as any);
                }
            }
            
            // Handle automatic family creation for married members
            if (values.marital_status === 'married' && values.spouse_from_church) {
                const familyPayload: any = {
                    name: `${values.last_name} Family`,
                    husband_id: values.gender === 'male' ? createdMember.id : undefined,
                    husband_type: values.gender === 'male' ? 'member' : undefined,
                    wife_id: values.gender === 'female' ? createdMember.id : undefined,
                    wife_type: values.gender === 'female' ? 'member' : undefined,
                };

                if (values.spouse_from_church === 'yes' && values.internal_spouse_id) {
                    if (values.gender === 'male') {
                        familyPayload.wife_id = values.internal_spouse_id;
                        familyPayload.wife_type = 'member';
                    } else {
                        familyPayload.husband_id = values.internal_spouse_id;
                        familyPayload.husband_type = 'member';
                    }
                    familyPayload.spouse_status = 'registered';
                } else if (values.spouse_from_church === 'no') {
                    familyPayload.spouse_status = 'external';
                    familyPayload.external_spouse_name = values.external_spouse_name;
                    familyPayload.external_spouse_phone = values.external_spouse_phone;
                    familyPayload.external_spouse_church = values.external_spouse_church;
                }
                
                await createFamily(familyPayload);
            }

            message.success('Member registered successfully! Needs approval.');
            router.push('/members/manage');
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
                Back to Members
            </Button>

            <div className="add-member-header">
                <h1>New Member Registration</h1>
                <p>Complete all steps to register a new church member.</p>
            </div>

            <div className="content-card-unified">
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'pending', has_children: false, baptized: 'no', holy_spirit_baptized: 'no' }}>
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
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => prevValues.marital_status !== currentValues.marital_status || prevValues.has_children !== currentValues.has_children || prevValues.spouse_from_church !== currentValues.spouse_from_church}
                            >
                                {({ getFieldValue }) => {
                                    const status = getFieldValue('marital_status');
                                    const hasChildren = getFieldValue('has_children');
                                    const spouseFromChurch = getFieldValue('spouse_from_church');
                                    
                                    if (status === 'single' || status === 'divorced' || status === 'widowed') {
                                        return (
                                            <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                                                <Form.Item name="has_children" valuePropName="checked" style={{ marginBottom: hasChildren ? '16px' : 0 }}>
                                                    <Checkbox>Have children?</Checkbox>
                                                </Form.Item>

                                                {hasChildren && (
                                                    <Form.List name="children">
                                                        {(fields, { add, remove }) => (
                                                            <>
                                                                {fields.map(({ key, name, ...restField }) => (
                                                                    <Row gutter={16} key={key} style={{ marginBottom: 8 }} align="middle">
                                                                        <Col span={10}>
                                                                            <Form.Item
                                                                                {...restField}
                                                                                name={[name, 'name']}
                                                                                rules={[{ required: true, message: 'Missing child name' }]}
                                                                                style={{ marginBottom: 0 }}
                                                                            >
                                                                                <Input placeholder="Child Name" />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={10}>
                                                                            <Form.Item
                                                                                {...restField}
                                                                                name={[name, 'date_of_birth']}
                                                                                style={{ marginBottom: 0 }}
                                                                            >
                                                                                <DatePicker placeholder="Date of Birth" style={{ width: '100%' }} />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col span={4}>
                                                                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                                        </Col>
                                                                    </Row>
                                                                ))}
                                                                <Form.Item style={{ marginBottom: 0, marginTop: '8px' }}>
                                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                                        Add Child
                                                                    </Button>
                                                                </Form.Item>
                                                            </>
                                                        )}
                                                    </Form.List>
                                                )}
                                            </div>
                                        );
                                    } else if (status === 'married') {
                                        return (
                                            <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                                                <Form.Item name="spouse_from_church" label="Is your spouse from this church?" rules={[{ required: true }]}>
                                                    <Radio.Group>
                                                        <Radio value="yes">Yes</Radio>
                                                        <Radio value="no">No</Radio>
                                                    </Radio.Group>
                                                </Form.Item>
                                                
                                                {spouseFromChurch === 'yes' && (
                                                    <Form.Item label="Select Spouse" name="internal_spouse_id" rules={[{ required: true, message: 'Please select your spouse' }]}>
                                                        <Select placeholder="Select Member" size="large" showSearch optionFilterProp="children" allowClear>
                                                            {members.map(m => (
                                                                <Option key={m.id} value={m.id}>{m.first_name} {m.last_name}</Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                )}
                                                
                                                {spouseFromChurch === 'no' && (
                                                    <Row gutter={16}>
                                                        <Col span={8}>
                                                            <Form.Item label="Spouse Name" name="external_spouse_name" rules={[{ required: true }]}>
                                                                <Input size="large" placeholder="Full Name" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={8}>
                                                            <Form.Item label="Spouse Phone" name="external_spouse_phone">
                                                                <Input size="large" placeholder="Phone Number" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={8}>
                                                            <Form.Item label="Local Church" name="external_spouse_church">
                                                                <Input size="large" placeholder="Name of Church" />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            </Form.Item>
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
                                                <Button icon={<UploadOutlined />}>Upload Letter</Button>
                                            </Upload>
                                            {churchLetterFile && <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> {churchLetterFile.name}</span>}
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

                            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ marginBottom: '16px', color: '#0f172a' }}>Registration Summary</h4>
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
                                                <div><strong>Church Letter:</strong> {churchLetterFile ? churchLetterFile.name : '—'}</div>
                                                <div><strong>Joined Date:</strong> {values.joined_date ? values.joined_date.format('YYYY-MM-DD') : '—'}</div>
                                                <div><strong>Salvation Date:</strong> {values.salvation_date ? values.salvation_date.format('YYYY-MM-DD') : '—'}</div>
                                                <div><strong>Interested Ministries:</strong> {values.interested_ministries?.length ? `${values.interested_ministries.length} selected` : 'None'}</div>
                                                <div><strong>Marital Status:</strong> {values.marital_status || '—'}</div>
                                                <div><strong>Children:</strong> {values.has_children && values.children ? `${values.children.length} added` : 'None'}</div>
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

export default AddMember;
