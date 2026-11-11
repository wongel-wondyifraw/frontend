'use client';

import React from 'react';
import { Form, Select, Button, Upload, Row, Col, Radio } from 'antd';
import { CheckCircle2, Globe, Upload as UploadIcon } from 'lucide-react';
import CalendarDateInput from '@/Components/common/CalendarDateInput';
import { UploadProgressBar } from '@/Components/common/UploadProgressBar';
import { fileDisplayName, MEMBER_TYPE_OPTIONS } from '@/lib/member-payload';

interface SpiritualStepProps {
  uploading: boolean;
  uploadPercent: number;
  churchLetterFile: File | null;
  letterUrl?: string;
  onLetterSelect: (file: File) => boolean;
  onClearLetter: () => void;
}

export default function SpiritualStep({
  uploading,
  uploadPercent,
  churchLetterFile,
  letterUrl,
  onLetterSelect,
  onClearLetter,
}: SpiritualStepProps) {
  return (
    <div id="member-step-spiritual" className="wizard-step-spiritual">
      <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Globe size={18} style={{ color: '#1E40AF' }} />
        <span>Spiritual Info</span>
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
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => onLetterSelect(file)}
                      accept=".pdf,.doc,.docx,.txt,image/*"
                    >
                      <Button icon={<UploadIcon size={15} />}>Upload Letter</Button>
                    </Upload>
                    {uploading && churchLetterFile ? (
                      <UploadProgressBar active percent={uploadPercent} />
                    ) : null}
                    {(churchLetterFile || letterUrl) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            color: '#16a34a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <CheckCircle2 size={15} />
                          <span>{fileDisplayName(churchLetterFile, letterUrl)}</span>
                        </span>
                        <Button size="small" type="link" danger onClick={onClearLetter}>
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
            <CalendarDateInput allowPartial disableFuture size="large" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

