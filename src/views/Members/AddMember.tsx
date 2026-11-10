'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Form, Select, Button, Avatar, Row, Col } from 'antd';
import { ArrowLeft, Trash2, Upload as UploadIcon, User } from 'lucide-react';
import StepperWizard from '../../Components/common/StepperWizard';
import NameInput from '@/Components/common/NameInput';
import CalendarDateInput from '@/Components/common/CalendarDateInput';
import { normalizeTitleInitials } from '@/lib/name-normalizer';
import {
  createMember,
  uploadMemberImage,
  getLocations,
  getMinistries,
  createLocation,
  uploadDocument,
} from '../../services/api';
import {
  buildMemberPayload,
  validateImageFile,
  validateDocumentFile,
} from '@/lib/member-payload';
import { upsertMemberFamily } from '@/lib/member-family';
import { getApiErrorMessage } from '@/lib/errors';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import type { Location, Ministry } from '@/types';
import './AddMember.css';

const { Option } = Select;

const StepLoadingFallback = () => (
  <div className="wizard-step-loading">Loading step...</div>
);

const DynamicMemberFamilySection = dynamic(
  () => import('@/Components/Members/MemberFamilySection'),
  {
    loading: () => <div className="wizard-step-loading">Loading family fields...</div>,
  },
);

const DynamicContactStep = dynamic(() => import('./steps/ContactStep'), {
  loading: StepLoadingFallback,
});

const DynamicProfessionalStep = dynamic(
  () => import('./steps/ProfessionalStep'),
  {
    loading: StepLoadingFallback,
  },
);

const DynamicSpiritualStep = dynamic(() => import('./steps/SpiritualStep'), {
  loading: StepLoadingFallback,
});

const DynamicMinistryStep = dynamic(() => import('./steps/MinistryStep'), {
  loading: StepLoadingFallback,
});

const DynamicReviewStep = dynamic(() => import('./steps/ReviewStep'), {
  loading: StepLoadingFallback,
});

const DynamicUploadProgressBar = dynamic(
  () =>
    import('@/Components/common/UploadProgressBar').then(
      (mod) => mod.UploadProgressBar,
    ),
);

const STEP_PREFETCHERS: Record<number, () => Promise<unknown>> = {
  1: () => import('./steps/ContactStep'),
  2: () => import('./steps/ProfessionalStep'),
  3: () => import('./steps/SpiritualStep'),
  4: () => import('./steps/MinistryStep'),
  5: () => import('./steps/ReviewStep'),
};

const STEPS = [
  { title: 'Personal Info' },
  { title: 'Contact & Location' },
  { title: 'Professional' },
  { title: 'Spiritual Info' },
  { title: 'Ministry Info' },
  { title: 'Review' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({
  background: 'var(--bg-card)',
  border: 'none',
}));

const AddMember = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [form] = Form.useForm();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    undefined,
  );
  const [churchLetterFile, setChurchLetterFile] = useState<File | null>(null);
  const [letterUrl, setLetterUrl] = useState<string | undefined>(undefined);

  const [locations, setLocations] = useState<Location[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const locationsFetchedRef = useRef(false);
  const ministriesFetchedRef = useRef(false);

  const maritalStatus = Form.useWatch('marital_status', form);
  const [familySectionNeeded, setFamilySectionNeeded] = useState(false);

  if (maritalStatus && !familySectionNeeded) {
    setFamilySectionNeeded(true);
  }

  useEffect(() => {
    if (!user) return;
    if (currentStep >= 1 && !locationsFetchedRef.current) {
      locationsFetchedRef.current = true;
      getLocations('active')
        .then(setLocations)
        .catch(() => {
          locationsFetchedRef.current = false;
        });
    }
    if (currentStep >= 3 && !ministriesFetchedRef.current) {
      ministriesFetchedRef.current = true;
      getMinistries({ limit: 100 })
        .then((res) => setMinistries(res.data))
        .catch(() => {
          ministriesFetchedRef.current = false;
        });
    }
  }, [user, currentStep]);

  const prefetchNextStep = useCallback(() => {
    const conn =
      typeof navigator !== 'undefined'
        ? (navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection
        : undefined;
    if (conn?.saveData) return;
    STEP_PREFETCHERS[currentStep + 1]?.().catch(() => {});
  }, [currentStep]);

  useEffect(() => {
    const conn =
      typeof navigator !== 'undefined'
        ? (navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection
        : undefined;
    if (conn?.saveData) return;

    const timer = window.setTimeout(() => {
      STEP_PREFETCHERS[currentStep + 1]?.().catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [currentStep]);

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['first_name', 'last_name', 'gender']);
        const status = form.getFieldValue('marital_status');
        const skipSpouse = form.getFieldValue('skip_spouse_info');
        if (status === 'married' && !skipSpouse) {
          await form.validateFields(['spouse_from_church']);
          if (form.getFieldValue('spouse_from_church') === 'yes') {
            await form.validateFields(['internal_spouse_id']);
          } else if (form.getFieldValue('spouse_from_church') === 'no') {
            await form.validateFields(['external_spouse_name']);
          }
        }
      } else if (currentStep === 1) {
        await form.validateFields(['phone']);
      }
      setCurrentStep((prevStep) => prevStep + 1);
    } catch {
      showToast('error', 'Please correct the errors before proceeding.');
    }
  };

  const prev = () => setCurrentStep((prevStep) => Math.max(prevStep - 1, 0));

  const handleAvatarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      showToast('error', err);
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(undefined);
  };

  const handleLetterSelect = (file: File) => {
    const err = validateDocumentFile(file);
    if (err) {
      showToast('error', err);
      return false;
    }
    setChurchLetterFile(file);
    setLetterUrl(undefined);
    return false;
  };

  const clearLetter = () => {
    setChurchLetterFile(null);
    setLetterUrl(undefined);
  };

  const resolveLocationId = async (raw?: string) => {
    if (!raw?.trim()) return undefined;
    const existing = locations.find(
      (l) => l.name.toLowerCase() === raw.toLowerCase() || l.id === raw,
    );
    if (existing) return existing.id;
    const created = await createLocation({
      name: normalizeTitleInitials(raw.trim()),
      status: 'active',
    });
    return created.id;
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('error', 'Please wait while your session is verified.');
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);
      setUploading(true);

      let imageUrl: string | undefined;
      if (avatarFile) {
        imageUrl = await uploadMemberImage(avatarFile, setUploadPercent);
      }

      let recommendationLetterUrl = letterUrl;
      if (churchLetterFile) {
        recommendationLetterUrl = await uploadDocument(
          churchLetterFile,
          setUploadPercent,
        );
      }
      setUploading(false);

      const locationId = await resolveLocationId(values.location_id);
      const payload = buildMemberPayload({
        ...values,
        location_id: locationId,
        image_url: imageUrl,
        recommendation_letter_url: recommendationLetterUrl,
      });

      const createdMember = await createMember(payload);

      try {
        await upsertMemberFamily(createdMember.id, values);
      } catch (familyError: unknown) {
        showToast(
          'error',
          getApiErrorMessage(
            familyError,
            'Member saved, but family could not be created. Update family from Family Management.',
          ),
        );
        router.push('/members/manage');
        return;
      }

      showToast('success', 'Member registered successfully! Needs approval.');
      router.push('/members/manage');
    } catch (error: unknown) {
      console.error(error);
      showToast(
        'error',
        getApiErrorMessage(error, 'Registration failed. Please try again.'),
      );
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  return (
    <div id="add-member-page" className="add-member-container">
      <Button
        type="text"
        icon={<ArrowLeft size={16} />}
        onClick={() => router.back()}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}
      >
        Back to Members
      </Button>

      <div className="add-member-header">
        <h1>New Member Registration</h1>
        <p>Complete all steps to register a new church member.</p>
      </div>

      <div className="add-member-form-wrapper">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'pending',
            has_children: false,
            baptized: 'no',
            holy_spirit_baptized: 'no',
            member_type: 'existing',
            skip_spouse_info: false,
          }}
        >
          <StepperWizard
            lazyMount
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onNextIntent={prefetchNextStep}
            onPrev={prev}
            onCancel={() => router.back()}
            onStepClick={(step) => setCurrentStep(step)}
            submitText={user ? 'Confirm Registration' : 'Verifying session...'}
            submitLoading={loading || uploading}
            submitDisabled={!user}
            stepBackgrounds={STEP_BACKGROUNDS}
          >
            {/* STEP 1: Personal */}
            <div id="member-step-personal" className="wizard-step-personal">
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} style={{ color: '#1E40AF' }} />
                <span>Personal Information</span>
              </h3>

              <div className="member-identity-row">
                <div className="member-avatar-block">
                  <Avatar
                    size={128}
                    src={avatarPreview}
                    icon={<User size={44} strokeWidth={1.6} />}
                    style={{
                      backgroundColor: '#f0f2f5',
                      border: '2px solid #d9d9d9',
                    }}
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarInputChange}
                    aria-label="Upload member photo"
                  />
                  <div className="member-avatar-actions">
                    <Button
                      size="small"
                      icon={<UploadIcon size={14} />}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Photo
                    </Button>
                    {avatarPreview && (
                      <Button
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={clearAvatar}
                        aria-label="Remove photo"
                      />
                    )}
                  </div>
                  {uploading ? (
                    <DynamicUploadProgressBar active percent={uploadPercent} />
                  ) : null}
                </div>
                <div className="member-name-fields">
                  <div className="member-name-grid">
                    <Form.Item
                      label="First Name"
                      name="first_name"
                      rules={[
                        { required: true, message: 'First name is required' },
                      ]}
                    >
                      <NameInput mode="person" size="large" placeholder="John" />
                    </Form.Item>
                    <Form.Item label="Middle Name" name="middle_name">
                      <NameInput
                        mode="person"
                        size="large"
                        placeholder="Optional"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label="Last Name"
                    name="last_name"
                    rules={[
                      { required: true, message: 'Last name is required' },
                    ]}
                  >
                    <NameInput mode="person" size="large" placeholder="Doe" />
                  </Form.Item>
                </div>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Date of Birth" name="date_of_birth">
                    <CalendarDateInput allowPartial disableFuture size="large" />
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
                <Col xs={24} md={12}>
                  <Form.Item
                    label="When did you receive Jesus as a Saviour?"
                    name="salvation_date"
                  >
                    <CalendarDateInput allowPartial disableFuture size="large" />
                  </Form.Item>
                </Col>
              </Row>
              {familySectionNeeded ? <DynamicMemberFamilySection /> : null}
            </div>

            {/* STEP 2: Contact */}
            <DynamicContactStep locations={locations} />

            {/* STEP 3: Professional */}
            <DynamicProfessionalStep />

            {/* STEP 4: Spiritual */}
            <DynamicSpiritualStep
              uploading={uploading}
              uploadPercent={uploadPercent}
              churchLetterFile={churchLetterFile}
              letterUrl={letterUrl}
              onLetterSelect={handleLetterSelect}
              onClearLetter={clearLetter}
            />

            {/* STEP 5: Ministry */}
            <DynamicMinistryStep ministries={ministries} />

            {/* STEP 6: Review */}
            <DynamicReviewStep
              churchLetterFile={churchLetterFile}
              letterUrl={letterUrl}
            />
          </StepperWizard>
        </Form>
      </div>
    </div>
  );
};

export default AddMember;
