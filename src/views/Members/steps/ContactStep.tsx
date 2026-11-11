'use client';

import React from 'react';
import { Form, Input, Row, Col, AutoComplete } from 'antd';
import { Mail, MapPin, Phone } from 'lucide-react';
import NameInput from '@/Components/common/NameInput';
import type { Location } from '@/types';

interface ContactStepProps {
  locations: Location[];
}

export default function ContactStep({ locations }: ContactStepProps) {
  return (
    <div id="member-step-contact" className="wizard-step-contact">
      <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={18} style={{ color: '#1E40AF' }} />
        <span>Contact &amp; Location</span>
      </h3>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Phone number is required' }]}
          >
            <Input
              size="large"
              placeholder="+251 9XX XXX XXXX"
              prefix={<Phone size={15} style={{ color: '#64748b' }} />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input
              size="large"
              placeholder="john@example.com"
              prefix={<Mail size={15} style={{ color: '#64748b' }} />}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Telegram Username" name="telegram_username">
            <Input size="large" placeholder="@username" prefix="@" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Location" name="location_id">
            <AutoComplete
              options={locations.map((loc) => ({ value: loc.name }))}
              filterOption={(inputValue, option) =>
                String(option?.value ?? '')
                  .toUpperCase()
                  .includes(inputValue.toUpperCase())
              }
              allowClear
            >
              <NameInput
                mode="title"
                size="large"
                placeholder="Search or enter location"
              />
            </AutoComplete>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Facebook" name="facebook_username">
            <Input size="large" placeholder="Optional handle or URL" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Instagram" name="instagram_username">
            <Input size="large" placeholder="Optional @username" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="WhatsApp" name="whatsapp_number">
            <Input size="large" placeholder="Optional number" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Specific Address" name="address">
        <Input.TextArea rows={3} placeholder="House number, Street, etc." />
      </Form.Item>
    </div>
  );
}

