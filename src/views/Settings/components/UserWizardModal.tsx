'use client';
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Switch, Avatar, Upload, Modal, Select } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { UploadChangeParam } from 'antd/es/upload';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import StepperWizard from '@/Components/common/StepperWizard';
import { getAvatarUrl } from '@/lib/media-url';
import { getRoles } from '@/services/api';
import type { Role, User } from '@/types';

const USER_WIZARD_STEPS = [{ title: 'Personal' }, { title: 'Account' }, { title: 'Role' }];

const USER_WIZARD_BACKGROUNDS = [
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
  { background: 'var(--bg-card)', border: 'none' },
];

interface UserWizardModalProps {
  open: boolean;
  editingUser: User | null;
  userForm: FormInstance;
  currentStep: number;
  wizardAvatarPreview: string | null;
  submitting?: boolean;
  onCancel: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onWizardAvatarChange: (info: UploadChangeParam) => void;
  onAfterOpenChange?: (open: boolean) => void;
  uploadPercent?: number;
  uploadingAvatar?: boolean;
}

const UserWizardModal = ({
  open,
  editingUser,
  userForm,
  currentStep,
  wizardAvatarPreview,
  submitting = false,
  onCancel,
  onNext,
  onPrev,
  onSubmit,
  onWizardAvatarChange,
  onAfterOpenChange,
  uploadPercent = 0,
  uploadingAvatar,
}: UserWizardModalProps) => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  const roleOptions = roles
    .filter((r) => r.key !== 'member')
    .map((r) => ({ value: r.key, label: r.name }));

  return (
    <Modal
      title={editingUser ? 'Edit user' : 'New user'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
      destroyOnHidden
      afterOpenChange={onAfterOpenChange}
      mask={{ closable: false }}
    >
      <div style={{ padding: '8px 0 0' }}>
        <Form form={userForm} layout="vertical" onFinish={onSubmit} preserve={false}>
          <StepperWizard
            steps={USER_WIZARD_STEPS}
            currentStep={currentStep}
            onNext={onNext}
            onPrev={onPrev}
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
                      onChange={onWizardAvatarChange}
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
                    { min: 6, message: 'At least 6 characters' },
                  ]}
                >
                  <Input.Password placeholder="Set initial password" autoComplete="new-password" />
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
    </Modal>
  );
};

export default UserWizardModal;
