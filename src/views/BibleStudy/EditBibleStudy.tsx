'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Select, Button, Row, Col, Radio, Upload, Spin, Typography } from 'antd';
import { message } from '@/lib/app-message';
import {
  ArrowLeftOutlined, BookOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined,
  UsergroupAddOutlined, EnvironmentOutlined, FileTextOutlined, UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import StepperWizard from '../../Components/common/StepperWizard';
import MemberTransferList from '../../Components/common/MemberTransferList';
import {
  updateBibleStudy, getBibleStudy, getBibleStudyMembers,
  addBibleStudyMember, removeBibleStudyMember, uploadDocument,
} from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import { BIBLE_BOOKS } from '@/lib/bible-books';
import LeaderSelect, { decodeLeaderValue, encodeLeaderValue } from '../../Components/common/LeaderSelect';
import './AddBibleStudy.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const STEPS = [
  { title: 'Group Info' },
  { title: 'Leadership & Location' },
  { title: 'Study Content' },
  { title: 'Manage Members' },
  { title: 'Review & Update' },
];

const STEP_BACKGROUNDS = STEPS.map(() => ({ background: 'var(--bg-card)', border: 'none' }));

const EditBibleStudy = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const initialMemberKeysRef = useRef<string[]>([]);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [existingMaterialUrl, setExistingMaterialUrl] = useState<string | null>(null);
  const contentType = Form.useWatch('content_type', form);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [study, studyMembers] = await Promise.all([
          getBibleStudy(id),
          getBibleStudyMembers(id),
        ]);
        form.setFieldsValue({
          name: study.name,
          about: study.about,
          schedule: study.schedule,
          location: study.location,
          content_type: study.content_type,
          bible_book: study.bible_book || undefined,
          leader_key: encodeLeaderValue(study.leader_id, study.leader_type || study.leader?.type),
        });
        setExistingMaterialUrl(study.material_url || null);
        if (study.material_url) {
          const name = study.material_url.split('/').pop() || 'Attached material';
          setFileList([{ uid: '-1', name, status: 'done', url: study.material_url }]);
        }
        const keys = studyMembers.map((m) => m.member_id);
        setSelectedMemberKeys(keys);
        initialMemberKeysRef.current = keys;
      } catch (error: unknown) {
        message.error(getApiErrorMessage(error, 'Failed to load Bible study'));
        router.push('/bible-study');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id, router, form]);

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

      let materialUrl = existingMaterialUrl;
      if (values.content_type === 'study_material' && materialFile) {
        materialUrl = await uploadDocument(materialFile, setUploadPercent);
      }

      const leader = decodeLeaderValue(values.leader_key);
      await updateBibleStudy(id, {
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

      const initialKeys = initialMemberKeysRef.current;
      const toAdd = selectedMemberKeys.filter((k) => !initialKeys.includes(k));
      const toRemove = initialKeys.filter((k) => !selectedMemberKeys.includes(k));

      await Promise.all([
        ...toAdd.map((memberId) => addBibleStudyMember(id, memberId).catch(() => undefined)),
        ...toRemove.map((memberId) => removeBibleStudyMember(id, memberId).catch(() => undefined)),
      ]);

      message.success('Bible study updated successfully');
      router.push('/bible-study');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update Bible study'));
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
    <div className="add-ministry-container">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16, paddingLeft: 0, color: '#64748b' }}>
        Back to Bible Studies
      </Button>
      <div className="add-ministry-header">
        <h1>Edit Bible Study</h1>
        <p>Update content, location, leadership, and members.</p>
      </div>
      <div className="content-card-unified">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <StepperWizard
            steps={STEPS}
            currentStep={currentStep}
            onNext={next}
            onPrev={() => setCurrentStep(currentStep - 1)}
            onCancel={() => router.back()}
            submitText="Confirm Update"
            submitLoading={loading}
            stepBackgrounds={STEP_BACKGROUNDS}
            lastStepLabel="Skip / Next"
          >
            <div>
              <h3 style={{ marginBottom: 20 }}><BookOutlined style={{ color: '#1565c0' }} /> Bible Study Information</h3>
              <Form.Item name="name" label="Bible Study Name" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
              <Form.Item name="about" label="About this Bible Study">
                <TextArea rows={4} />
              </Form.Item>
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}><UserOutlined style={{ color: '#1565c0' }} /> Leadership & Location</h3>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item name="leader_key" label="Assign Leader">
                    <LeaderSelect />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="schedule" label="Schedule Details">
                    <Input size="large" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="location" label="Meeting Location" rules={[{ required: true }]}>
                <Input size="large" prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}><FileTextOutlined style={{ color: '#1565c0' }} /> Study Content</h3>
              <Form.Item name="content_type" label="Content Type" rules={[{ required: true }]}>
                <Radio.Group buttonStyle="solid" size="large">
                  <Radio.Button value="book"><BookOutlined /> Book</Radio.Button>
                  <Radio.Button value="study_material"><FileTextOutlined /> Study Material</Radio.Button>
                </Radio.Group>
              </Form.Item>
              {contentType === 'book' && (
                <Form.Item name="bible_book" label="Bible Book" rules={[{ required: true, message: 'Please select a Bible book' }]}>
                  <Select showSearch size="large" optionFilterProp="children"
                    filterOption={(input, option) => String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                    {BIBLE_BOOKS.map((book) => <Option key={book} value={book}>{book}</Option>)}
                  </Select>
                </Form.Item>
              )}
              {contentType === 'study_material' && (
                <Form.Item label="Attach Study Material" extra="Optional. Leave as-is to keep the current file, or upload a replacement.">
                  <Upload
                    beforeUpload={(file) => {
                      setMaterialFile(file);
                      setFileList([{ uid: '-1', name: file.name, status: 'done' }]);
                      return false;
                    }}
                    onRemove={() => {
                      setMaterialFile(null);
                      setExistingMaterialUrl(null);
                      setFileList([]);
                    }}
                    fileList={fileList}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>Choose File</Button>
                  </Upload>
                  <UploadProgressBar active={loading && Boolean(materialFile)} percent={uploadPercent} />
                  {!materialFile && existingMaterialUrl && (
                    <div style={{ marginTop: 8 }}><Text type="secondary">Current file kept unless you upload a new one.</Text></div>
                  )}
                </Form.Item>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}><UsergroupAddOutlined style={{ color: '#1565c0' }} /> Manage Members</h3>
              <MemberTransferList
                remoteSearch
                selectedKeys={selectedMemberKeys}
                onChange={setSelectedMemberKeys}
                description="Search and check members to update who belongs to this Bible study."
              />
            </div>
            <div>
              <h3 style={{ marginBottom: 20 }}><CheckCircleOutlined style={{ color: '#1565c0' }} /> Review Changes</h3>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const values = form.getFieldsValue();
                  const leader = decodeLeaderValue(values.leader_key);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 24px', fontSize: 13 }}>
                      <div><strong>Name:</strong> {values.name || '—'}</div>
                      <div><strong>Leader:</strong> {leader.leader_id ? `${leader.leader_type === 'minister' ? 'Minister' : 'Member'} selected` : 'Not assigned'}</div>
                      <div><strong>Location:</strong> {values.location || '—'}</div>
                      <div><strong>Content:</strong> {values.content_type === 'book' ? `Book — ${values.bible_book || '—'}` : 'Study Material'}</div>
                      <div><strong>Members:</strong> {selectedMemberKeys.length}</div>
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

export default EditBibleStudy;
