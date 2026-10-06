'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Checkbox,
  AutoComplete,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  UploadOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  IdcardOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberFamilySection from '@/Components/Members/MemberFamilySection';
import {
  updateMember,
  getMemberById,
  uploadMemberImage,
  getLocations,
  getMinistries,
  createLocation,
  uploadDocument,
  getFamilyByMember,
} from '../../services/api';
import { buildMemberPayload, validateImageFile, validateDocumentFile, fileDisplayName, MEMBER_TYPE_OPTIONS } from '@/lib/member-payload';
import { upsertMemberFamily, familyToFormValues } from '@/lib/member-family';
import { getApiErrorMessage } from '@/lib/errors';
import { getImageUrl } from '@/lib/media-url';
import { useToast } from '@/context/ToastContext';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import type { UploadChangeParam } from 'antd/es/upload';
import dayjs from 'dayjs';
import type { Location, Ministry, Member } from '@/types';
import './AddMember.css';

const { Option } = Select;

const STEPS = [
  { title: 'Personal Info' },
  { title: 'Contact & Location' },
  { title: 'Professional' },
  { title: 'Spiritual Info' },
  { title: 'Ministry Info' },
  { title: 'Review' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];

const EDUCATION_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

const EditMember = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { showToast } = useToast();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [churchLetterFile, setChurchLetterFile] = useState<File | null>(null);
  const [letterUrl, setLetterUrl] = useState<string | undefined>(undefined);
  const [memberData, setMemberData] = useState<Member | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  useEffect(() => {
    getLocations('active').then(setLocations).catch(() => {});
    getMinistries({ limit: 100 }).then((res) => setMinistries(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const member = await getMemberById(id);
        setMemberData(member);
        const family = await getFamilyByMember(id).catch(() => null);
        form.setFieldsValue({
          first_name: member.first_name,
          middle_name: member.middle_name,
          last_name: member.last_name,
          email: member.email,
          phone: member.phone,
          address: member.address,
          date_of_birth: member.date_of_birth ? dayjs(member.date_of_birth) : null,
          marital_status: member.marital_status,
          gender: member.gender || undefined,
          status: member.status,
          joined_date: member.joined_date ? dayjs(member.joined_date) : null,
          baptized: member.baptized === true || member.baptized === 'true' ? 'yes' : 'no',
          holy_spirit_baptized:
            member.holy_spirit_baptized === true || member.holy_spirit_baptized === 'true' ? 'yes' : 'no',
          telegram_username: member.telegram_username,
          facebook_username: member.facebook_username || undefined,
          instagram_username: member.instagram_username || undefined,
          whatsapp_number: member.whatsapp_number || undefined,
          member_type: member.member_type || 'existing',
          salvation_date: member.salvation_date ? dayjs(member.salvation_date) : undefined,
          location_id: (member as Member & { location?: { name?: string } }).location?.name || member.location_id,
          interested_ministries: member.interested_ministries || [],
          employment_status: member.employment_status || undefined,
          profession: member.profession || undefined,
          employer: member.employer || undefined,
          education_level: member.education_level || undefined,
          education_field: member.education_field || undefined,
          ...familyToFormValues(family, id),
        });
        if (member.image_url) setAvatarPreview(getImageUrl(member.image_url) || undefined);
        if (member.recommendation_letter_url) setLetterUrl(member.recommendation_letter_url);
      } catch (error: unknown) {
        showToast('error', getApiErrorMessage(error, 'Failed to fetch member details'));
        router.push('/members/manage');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [id, router, form, showToast]);

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['first_name', 'last_name', 'gender']);
      } else if (currentStep === 1) {
        await form.validateFields(['phone']);
      }
      setCurrentStep(currentStep + 1);
    } catch {
      showToast('error', 'Please correct the errors before proceeding.');
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  const handleAvatarChange = (info: UploadChangeParam) => {
    const file = (info.file.originFileObj || info.file) as File;
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      showToast('error', err);
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLetterSelect = (file: File) => {
    const err = validateDocumentFile(file);
    if (err) {
      showToast('error', err);
      return false;
    }
    setChurchLetterFile(file);
    return false;
  };

  const resolveLocationId = async (raw?: string) => {
    if (!raw?.trim()) return undefined;
    const existing = locations.find((l) => l.name.toLowerCase() === raw.toLowerCase() || l.id === raw);
    if (existing) return existing.id;
    const created = await createLocation({ name: raw.trim(), status: 'active' });
    return created.id;
  };

  const onFinish = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setUploading(true);

      let imageUrl = memberData?.image_url;
      if (avatarFile) imageUrl = await uploadMemberImage(avatarFile, setUploadPercent);

      let recommendationLetterUrl = letterUrl || memberData?.recommendation_letter_url;
      if (churchLetterFile) recommendationLetterUrl = await uploadDocument(churchLetterFile, setUploadPercent);
      setUploading(false);

      const locationId = await resolveLocationId(values.location_id);
      const payload = buildMemberPayload({
        ...values,
        location_id: locationId,
        image_url: imageUrl,
        recommendation_letter_url: recommendationLetterUrl,
      });

      await updateMember(id, payload);

      try {
        await upsertMemberFamily(id, values);
      } catch (familyError: unknown) {
        showToast(
          'error',
          getApiErrorMessage(familyError, 'Member updated, but family could not be synced.'),
        );
        router.push('/members/manage');
        return;
      }

      showToast('success', 'Member updated successfully');
      router.push('/members/manage');
    } catch (error: unknown) {
      showToast('error', getApiErrorMessage(error, 'Failed to update member'));
    } finally {
      setUploading(false);
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
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}>
        Back to Members
      </Button>

      <div className="add-member-header">
        <h1>Edit Member Details</h1>
        <p>Update personal information, family, and professional details.</p>
      </div>

      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={prev}
            onCancel={() => router.back()}
            submitText="Update Member"
            submitLoading={loading || uploading}
            stepBackgrounds={STEP_BACKGROUNDS}
          >
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#1E40AF' }} /> Personal Information
              </h3>
              <div className="member-identity-row">
                <div className="member-avatar-block">
                  <Avatar size={128} src={avatarPreview} icon={<UserOutlined />} style={{ backgroundColor: '#f0f2f5', border: '2px solid #d9d9d9' }} />
                  <div className="member-avatar-actions">
                    <Upload showUploadList={false} beforeUpload={() => false} onChange={handleAvatarChange} accept="image/*">
                      <Button size="small" icon={<UploadOutlined />}>Photo</Button>
                    </Upload>
                    {avatarPreview && (
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setAvatarFile(null); setAvatarPreview(undefined); }} />
                    )}
                  </div>
                  <UploadProgressBar active={uploading} percent={uploadPercent} />
                </div>
                <div className="member-name-fields">
                  <div className="member-name-grid">
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
                <Col xs={24} md={12}>
                  <Form.Item label="Date of Birth" name="date_of_birth">
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Gender" name="gender" rules={[{ required: true }]}>
                    <Select size="large">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Marital Status" name="marital_status">
                    <Select size="large" allowClear>
                      <Option value="single">Single</Option>
                      <Option value="married">Married</Option>
                      <Option value="divorced">Divorced</Option>
                      <Option value="widowed">Widowed</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="When did you receive Jesus as a Saviour?" name="salvation_date">
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <MemberFamilySection />
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined style={{ color: '#1E40AF' }} /> Contact & Location
              </h3>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Phone Number" name="phone" rules={[{ required: true }]}>
                    <Input size="large" prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Email Address" name="email" rules={[{ type: 'email' }]}>
                    <Input size="large" prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Telegram Username" name="telegram_username">
                    <Input size="large" prefix="@" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Location" name="location_id">
                    <AutoComplete
                      options={locations.map((loc) => ({ value: loc.name }))}
                      size="large"
                      filterOption={(inputValue, option) =>
                        String(option?.value ?? '').toUpperCase().includes(inputValue.toUpperCase())
                      }
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Facebook" name="facebook_username">
                    <Input size="large" placeholder="Optional" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Instagram" name="instagram_username">
                    <Input size="large" placeholder="Optional" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="WhatsApp" name="whatsapp_number">
                    <Input size="large" placeholder="Optional" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Specific Address" name="address">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IdcardOutlined style={{ color: '#1E40AF' }} /> Professional Information
              </h3>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Employment Status" name="employment_status">
                    <Select size="large" allowClear options={EMPLOYMENT_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Profession / Job title" name="profession">
                    <Input size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Employer / Organization" name="employer">
                    <Input size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Education Level" name="education_level">
                    <Select size="large" allowClear options={EDUCATION_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Field of Study" name="education_field">
                <Input size="large" />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GlobalOutlined style={{ color: '#1E40AF' }} /> Spiritual Info
              </h3>
              <Form.Item
                name="member_type"
                label="Member Type"
                rules={[{ required: true, message: 'Select member type' }]}
              >
                <Select size="large" options={MEMBER_TYPE_OPTIONS} />
              </Form.Item>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="baptized" label="Water Baptized?">
                    <Radio.Group buttonStyle="solid" size="large">
                      <Radio.Button value="yes">Yes</Radio.Button>
                      <Radio.Button value="no">No</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="holy_spirit_baptized" label="Holy Spirit Baptized?">
                    <Radio.Group buttonStyle="solid" size="large">
                      <Radio.Button value="yes">Yes</Radio.Button>
                      <Radio.Button value="no">No</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) => prev.member_type !== cur.member_type}
                  >
                    {({ getFieldValue }) => {
                      const isTransferred = getFieldValue('member_type') === 'transferred';
                      return (
                        <Form.Item
                          label="Recommendation Letter"
                          extra={
                            isTransferred
                              ? 'Optional for transferred members. If missing, this member is flagged for follow-up.'
                              : 'Optional church recommendation letter.'
                          }
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Upload showUploadList={false} beforeUpload={(file) => handleLetterSelect(file)} accept=".pdf,.doc,.docx,.txt,image/*">
                              <Button icon={<UploadOutlined />}>Upload Letter</Button>
                            </Upload>
                            <UploadProgressBar active={uploading && Boolean(churchLetterFile)} percent={uploadPercent} />
                            {(churchLetterFile || letterUrl) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#16a34a' }}>
                                  <CheckCircleOutlined /> {fileDisplayName(churchLetterFile, letterUrl)}
                                </span>
                                {letterUrl && !churchLetterFile && (
                                  <a href={getImageUrl(letterUrl) || letterUrl} target="_blank" rel="noreferrer">
                                    Open
                                  </a>
                                )}
                                <Button size="small" type="link" danger onClick={() => { setChurchLetterFile(null); setLetterUrl(undefined); }}>
                                  Remove
                                </Button>
                              </div>
                            )}
                            {isTransferred && !churchLetterFile && !letterUrl && (
                              <span style={{ color: '#d97706', fontSize: 12 }}>
                                No letter yet — will be flagged for follow-up.
                              </span>
                            )}
                          </div>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="joined_date" label="Joined Date">
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined style={{ color: '#1E40AF' }} /> Ministry Information
              </h3>
              <Form.Item label="Interested Ministries" name="interested_ministries">
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    {(ministries.length
                      ? ministries.map((m) => m.name)
                      : ['Prayer', 'Worship', 'Preaching', 'Music', 'Deacons', 'Bible Study', 'Ushering', 'Youth', 'Children', 'Media/Tech', 'Evangelism']
                    ).map((name) => (
                      <Col xs={24} sm={12} md={8} key={name}>
                        <Checkbox value={name}>{name}</Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1E40AF' }} /> Review
              </h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid var(--border-color)' }}>
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue();
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
                        <div><strong>Name:</strong> {values.first_name} {values.last_name}</div>
                        <div><strong>Phone:</strong> {values.phone || '—'}</div>
                        <div><strong>Member Type:</strong> {MEMBER_TYPE_OPTIONS.find((o) => o.value === values.member_type)?.label || values.member_type || '—'}</div>
                        <div><strong>Employment:</strong> {values.employment_status || '—'}</div>
                        <div><strong>Profession:</strong> {values.profession || '—'}</div>
                        <div><strong>Education:</strong> {values.education_level || '—'}</div>
                        <div><strong>Children:</strong> {values.has_children && values.children?.length ? values.children.length : 'None'}</div>
                        <div><strong>Church Letter:</strong> {fileDisplayName(churchLetterFile, letterUrl) || '—'}</div>
                        {values.member_type === 'transferred' && !churchLetterFile && !letterUrl && (
                          <div style={{ gridColumn: '1 / -1', color: '#d97706' }}>
                            <strong>Follow-up:</strong> Recommendation letter missing — will be flagged.
                          </div>
                        )}
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
