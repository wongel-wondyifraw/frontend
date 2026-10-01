'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, Button, Row, Col, Radio, Upload, Typography } from 'antd';
import { message } from '@/lib/app-message';
import {
  ArrowLeftOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberTransferList from '../../Components/common/MemberTransferList';
import {
  createBibleStudy, addBibleStudyMember, uploadDocument,
} from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import { BIBLE_BOOKS } from '@/lib/bible-books';
import LeaderSelect, { decodeLeaderValue } from '../../Components/common/LeaderSelect';
import './AddBibleStudy.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const STEPS = [
  { title: 'Group Info' },
  { title: 'Leadership & Location' },
  { title: 'Study Content' },
  { title: 'Add Members', content: 'Optional' },
  { title: 'Review & Create' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const AddBibleStudy = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const contentType = Form.useWatch('content_type', form);

  const next = async () => {
    try {
      if (currentStep === 0) await form.validateFields(['name']);
      else if (currentStep === 1) await form.validateFields(['location']);
      else if (currentStep === 2) {
        await form.validateFields(['content_type']);
        if (form.getFieldValue('content_type') === 'book') {
          await form.validateFields(['bible_book']);
        }
      }
      setCurrentStep(currentStep + 1);
    } catch {
      message.error('Please correct the errors before proceeding.');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let materialUrl: string | undefined;
      if (values.content_type === 'study_material' && materialFile) {
        materialUrl = await uploadDocument(materialFile);
      }

      const leader = decodeLeaderValue(values.leader_key);
      const created = await createBibleStudy({
        name: values.name,
        about: values.about || '',
        schedule: values.schedule || '',
        location: values.location,
        content_type: values.content_type,
        bible_book: values.content_type === 'book' ? values.bible_book : null,
        material_url: values.content_type === 'study_material' ? (materialUrl || null) : null,
        leader_id: leader.leader_id,
        leader_type: leader.leader_type,
      });

      if (selectedMemberKeys.length > 0 && created?.id) {
        await Promise.all(
          selectedMemberKeys.map((memberId) =>
            addBibleStudyMember(created.id, memberId).catch((err) => {
              console.warn(`Failed to add member ${memberId}:`, err);
            }),
          ),
        );
      }

      message.success('Bible study created successfully!');
      router.push('/bible-study');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to create Bible study'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-ministry-container">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}>
        Back to Bible Studies
      </Button>

      <div className="add-ministry-header">
        <h1>Create New Bible Study</h1>
        <p>Set up a study group with a book or study material, location, leader, and members.</p>
      </div>

      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ content_type: 'book' }}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={() => setCurrentStep(currentStep - 1)}
            onCancel={() => router.back()}
            submitText="Create Bible Study"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
            lastStepLabel="Skip / Next"
          >
            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOutlined style={{ color: '#1565c0' }} /> Bible Study Information
              </h3>
              <Form.Item name="name" label="Bible Study Name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input size="large" placeholder="e.g. Friday Evening Study" />
              </Form.Item>
              <Form.Item name="about" label="About this Bible Study">
                <TextArea rows={4} placeholder="Describe the purpose and focus..." />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#1565c0' }} /> Leadership & Location
              </h3>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="leader_key" label="Assign Leader">
                    <LeaderSelect />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="schedule" label="Schedule Details">
                    <Input size="large" placeholder="e.g. Every Friday 7:00 PM" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="location" label="Meeting Location" rules={[{ required: true, message: 'Location is required' }]}>
                <Input size="large" placeholder="e.g. Church hall / Host home address" prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: '#1565c0' }} /> Study Content
              </h3>
              <Form.Item name="content_type" label="Content Type" rules={[{ required: true }]}>
                <Radio.Group buttonStyle="solid" size="large">
                  <Radio.Button value="book"><BookOutlined /> Book</Radio.Button>
                  <Radio.Button value="study_material"><FileTextOutlined /> Study Material</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {contentType === 'book' && (
                <Form.Item
                  name="bible_book"
                  label="Bible Book"
                  rules={[{ required: true, message: 'Please select a Bible book' }]}
                >
                  <Select
                    placeholder="Select one of the 66 books"
                    size="large"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {BIBLE_BOOKS.map((book) => (
                      <Option key={book} value={book}>{book}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {contentType === 'study_material' && (
                <Form.Item
                  label="Attach Study Material"
                  extra="Optional. PDF, DOC, DOCX, TXT, or image files up to 15MB."
                >
                  <Upload
                    beforeUpload={(file) => {
                      setMaterialFile(file);
                      setFileList([{ uid: '-1', name: file.name, status: 'done' }]);
                      return false;
                    }}
                    onRemove={() => {
                      setMaterialFile(null);
                      setFileList([]);
                    }}
                    fileList={fileList}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>Choose File</Button>
                  </Upload>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">You can create the study without attaching a file and add it later.</Text>
                  </div>
                </Form.Item>
              )}
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsergroupAddOutlined style={{ color: '#1565c0' }} /> Add Members
                <span style={{ fontWeight: 400, fontSize: 13, color: '#94a3b8' }}>(Optional)</span>
              </h3>
              <MemberTransferList
                remoteSearch
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                description="Search and check members to add them to this Bible study."
              />
            </div>

            <div>
              <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Bible Study
              </h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid var(--border-color)' }}>
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue();
                    const leader = decodeLeaderValue(values.leader_key);
                    const leaderName = leader.leader_id
                      ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected`
                      : 'Not assigned';
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
                        <div><strong>Name:</strong> {values.name || '—'}</div>
                        <div><strong>Leader:</strong> {leaderName}</div>
                        <div><strong>Location:</strong> {values.location || '—'}</div>
                        <div><strong>Schedule:</strong> {values.schedule || '—'}</div>
                        <div><strong>Content:</strong> {values.content_type === 'book' ? `Book — ${values.bible_book || '—'}` : 'Study Material'}</div>
                        <div><strong>Material file:</strong> {materialFile?.name || 'None'}</div>
                        <div><strong>Members:</strong> {selectedMemberKeys.length}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>About:</strong> {values.about || '—'}</div>
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

export default AddBibleStudy;
