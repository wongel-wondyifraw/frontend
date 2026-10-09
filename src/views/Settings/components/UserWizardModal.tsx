'use client';
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Switch, Avatar, Upload, Modal, Select } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import StepperWizard from '@/Components/common/StepperWizard';
import { getAvatarUrl } from '@/lib/media-url';
import { getRoles } from '@/services/api';
import PasswordStrengthMeter from '@/Components/common/PasswordStrengthMeter';
import type { Role, User } from '@/types';

const USER_WIZARD_STEPS = [{ title: 'Personal' }, { title: 'Account' }, { title: 'Role' }];

const USER_WIZARD_BACKGROUNDS = [
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
];

export type UserWizardValues = {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  password?: string;
  role: string;
  title?: string;
  is_active?: boolean;
};

interface UserWizardModalProps {
  open: boolean;
  editingUser: User | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: UserWizardValues, avatarFile: File | null) => void;
  uploadPercent?: number;
  uploadingAvatar?: boolean;
}

const UserWizardForm = ({
  editingUser,
  submitting = false,
  onSubmit,
  uploadPercent = 0,
  uploadingAvatar,
}: Omit<UserWizardModalProps, 'open' | 'onCancel'>) => {
  const [userForm] = Form.useForm<UserWizardValues>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardAvatar, setWizardAvatar] = useState<File | null>(null);
  const [wizardAvatarPreview, setWizardAvatarPreview] = useState<string | null>(null);

  const initialValues: Partial<UserWizardValues> = editingUser
    ? {
        first_name: editingUser.first_name,
        middle_name: editingUser.middle_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        role: editingUser.role,
        title: editingUser.title ?? undefined,
        is_active: editingUser.is_active !== undefined ? editingUser.is_active : true,
      }
    : { is_active: true };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRoles();
        if (!cancelled) setRoles(data);
      } catch {
        if (!cancelled) {
          setRoles([
            { id: 'admin', key: 'admin', name: 'Admin', is_system: true, permissions: [] },
            { id: 'minister', key: 'minister', name: 'Minister', is_system: true, permissions: [] },
            { id: 'staff', key: 'staff', name: 'Staff', is_system: true, permissions: [] },
          ] as Role[]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await userForm.validateFields(['first_name', 'last_name']);
      } else if (currentStep === 1) {
        await userForm.validateFields(editingUser ? ['email'] : ['email', 'password']);
      } else if (currentStep === 2) {
        await userForm.validateFields(['role']);
        const role = userForm.getFieldValue('role');
        if (role === 'minister' || role === 'staff') {
          await userForm.validateFields(['title']);
        }
      }
      setCurrentStep((step) => step + 1);
    } catch {
      // message.error('Please correct the errors before continuing.');
    }
  };

  const handlePrev = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleWizardAvatarChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setWizardAvatar(file as File);
      const reader = new FileReader();
      reader.onload = (e) => setWizardAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file as File);
    }
  };

  const handleSubmit = (values: UserWizardValues) => {
    onSubmit(values, wizardAvatar);
  };

  const roleOptions = roles
    .filter((r) => r.key !== 'member')
    .map((r) => ({ value: r.key, label: r.name }));

  return (
      <div style={{ padding: '8px 0 0' }}>
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
          initialValues={initialValues}
        >
          <StepperWizard
            steps={USER_WIZARD_STEPS}
            currentStep={currentStep}
            onNext={handleNext}
            onPrev={handlePrev}
            submitText={editingUser ? 'Save changes' : 'Create user'}
            submitLoading={submitting}
            stepBackgrounds={USER_WIZARD_BACKGROUNDS}
            showCancel={false}
          >
            <div>
              <h3 className="settings-section-title">Personal profile</h3>
              <div className="settings-wizard-profile">
                <div className="settings-wizard-avatar">
                  <Avatar
                    size={96}
                    src={wizardAvatarPreview || getAvatarUrl(editingUser?.avatar_url)}
                    icon={<UserOutlined />}
                    className="settings-avatar"
                  />
                  <div style={{ marginTop: 8 }}>
                    <Upload
                      showUploadList={false}
                      accept="image/jpeg,image/png,image/webp"
                      beforeUpload={() => false}
                      onChange={handleWizardAvatarChange}
                    >
                      <Button size="small" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                    <UploadProgressBar
                      active={Boolean(uploadingAvatar)}
                      percent={uploadPercent}
                    />
                  </div>
                </div>
                <div className="settings-wizard-fields">
                  <div className="settings-wizard-name-grid">
                    <Form.Item
                      label="First name"
                      name="first_name"
                      rules={[{ required: true, message: 'First name is required' }]}
                    >
                      <Input placeholder="John" />
                    </Form.Item>
                    <Form.Item label="Middle name" name="middle_name">
                      <Input placeholder="Optional" />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label="Last name"
                    name="last_name"
                    rules={[{ required: true, message: 'Last name is required' }]}
                  >
                    <Input placeholder="Doe" />
                  </Form.Item>
                </div>
              </div>
            </div>

            <div>
              <h3 className="settings-section-title">Account setup</h3>
              <Form.Item
                label="Email address"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
                extra={
                  editingUser
                    ? 'Email cannot be changed after creation.'
                    : 'Email cannot be changed later — enter carefully.'
                }
              >
                <Input placeholder="user@example.com" disabled={!!editingUser} autoComplete="off" />
              </Form.Item>

              {!editingUser && (
                <Form.Item
                  label="Temporary password"
                  name="password"
                  rules={[
                    { required: true, message: 'Password is required' },
                    { min: 8, message: 'At least 8 characters' },
                    { pattern: /[A-Z]/, message: 'Needs at least 1 uppercase letter' },
                    { pattern: /[a-z]/, message: 'Needs at least 1 lowercase letter' },
                    { pattern: /[0-9]/, message: 'Needs at least 1 number' },
                  ]}
                >
                  <Input.Password placeholder="Set initial password" autoComplete="new-password" />
                </Form.Item>
              )}
              
              {!editingUser && (
                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.password !== curr.password}>
                  {({ getFieldValue }) => (
                    <PasswordStrengthMeter password={getFieldValue("password")} />
                  )}
                </Form.Item>
              )}
            </div>

            <div>
              <h3 className="settings-section-title">Role & designation</h3>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Assign a role' }]}
              >
                <Select
                  placeholder="Select an access level"
                  options={
                    roleOptions.length
                      ? roleOptions
                      : [
                          { value: 'admin', label: 'Admin' },
                          { value: 'minister', label: 'Minister' },
                          { value: 'staff', label: 'Staff' },
                        ]
                  }
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.role !== cur.role}
              >
                {({ getFieldValue }) => {
                  const role = getFieldValue('role');
                  return role === 'minister' || role === 'staff' ? (
                    <Form.Item
                      label="Title / designation"
                      name="title"
                      rules={[{ required: true, message: 'Title is required for this role' }]}
                    >
                      <Input placeholder="e.g. Senior Pastor, IT Manager" />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item label="Account active" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </StepperWizard>
        </Form>
      </div>
  );
};

const UserWizardModal = ({
  open,
  editingUser,
  submitting = false,
  onCancel,
  onSubmit,
  uploadPercent = 0,
  uploadingAvatar,
}: UserWizardModalProps) => {
  return (
    <Modal
      title={editingUser ? 'Edit user' : 'New user'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
      destroyOnHidden
      forceRender
      mask={{ closable: false }}
    >
      {open ? (
        <UserWizardForm
          key={editingUser?.id ?? 'new'}
          editingUser={editingUser}
          submitting={submitting}
          onSubmit={onSubmit}
          uploadPercent={uploadPercent}
          uploadingAvatar={uploadingAvatar}
        />
      ) : null}
    </Modal>
  );
};

export default UserWizardModal;
