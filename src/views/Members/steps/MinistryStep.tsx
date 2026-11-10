'use client';

import React from 'react';
import { Form, Row, Col, Checkbox } from 'antd';
import { Users } from 'lucide-react';
import type { Ministry } from '@/types';

const FALLBACK_MINISTRIES = [
  'Prayer',
  'Worship',
  'Preaching',
  'Music',
  'Deacons',
  'Bible Study',
  'Ushering',
  'Youth',
  'Children',
  'Media/Tech',
  'Evangelism',
];

interface MinistryStepProps {
  ministries: Ministry[];
}

export default function MinistryStep({ ministries }: MinistryStepProps) {
  const options = ministries.length
    ? ministries.map((m) => m.name)
    : FALLBACK_MINISTRIES;

  return (
    <div id="member-step-ministry" className="wizard-step-ministry">
      <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={18} style={{ color: '#1E40AF' }} />
        <span>Ministry Information</span>
      </h3>
      <Form.Item label="Interested Ministries" name="interested_ministries">
        <Checkbox.Group style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            {options.map((name) => (
              <Col xs={24} sm={12} md={8} key={name}>
                <Checkbox value={name}>{name}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Form.Item>
    </div>
  );
}

