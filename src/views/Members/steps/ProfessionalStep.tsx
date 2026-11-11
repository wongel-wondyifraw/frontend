'use client';

import React from 'react';
import { Form, Select, Row, Col } from 'antd';
import { IdCard } from 'lucide-react';
import NameInput from '@/Components/common/NameInput';

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

export default function ProfessionalStep() {
  return (
    <div id="member-step-professional" className="wizard-step-professional">
      <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <IdCard size={18} style={{ color: '#1E40AF' }} />
        <span>Professional Information</span>
      </h3>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Employment Status" name="employment_status">
            <Select
              placeholder="Select status"
              size="large"
              allowClear
              options={EMPLOYMENT_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Profession / Job title" name="profession">
            <NameInput
              mode="title"
              size="large"
              placeholder="e.g. Teacher, Engineer"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Employer / Organization" name="employer">
            <NameInput mode="title" size="large" placeholder="Optional" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Education Level" name="education_level">
            <Select
              placeholder="Select level"
              size="large"
              allowClear
              options={EDUCATION_OPTIONS}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Field of Study" name="education_field">
        <NameInput
          mode="title"
          size="large"
          placeholder="e.g. Business, Theology"
        />
      </Form.Item>
    </div>
  );
}

