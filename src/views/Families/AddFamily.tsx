'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message } from 'antd';
import { ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import { createFamily } from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import SpouseSelect, { decodeLeaderValue } from '../../Components/common/SpouseSelect';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import './AddFamily.css';

const AddFamilyContent = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const husband = decodeLeaderValue(values.husband);
      const wife = decodeLeaderValue(values.wife);
      if (!husband.leader_id || !husband.leader_type || !wife.leader_id || !wife.leader_type) {
        message.error('Select both husband and wife');
        return;
      }
      if (husband.leader_id === wife.leader_id && husband.leader_type === wife.leader_type) {
        message.error('Husband and wife must be different people');
        return;
      }

      setLoading(true);
      const created = await createFamily({
        name: values.name || undefined,
        notes: values.notes || undefined,
        husband_id: husband.leader_id,
        husband_type: husband.leader_type,
        wife_id: wife.leader_id,
        wife_type: wife.leader_type,
      });
      message.success('Family created. Single spouses were marked married if needed.');
      router.push(`/families/details/${created.id}`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to create family'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-ministry-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/families')}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}
      >
        Back to Families
      </Button>

      <div className="add-ministry-card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ color: '#1565c0' }} /> Create Family
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Select husband and wife from male and female members or ministers. You can add children on the family detail page.
        </p>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Family name">
            <Input size="large" placeholder="Optional — defaults to spouse last name" />
          </Form.Item>
          <Form.Item
            name="husband"
            label="Husband"
            rules={[{ required: true, message: 'Select husband' }]}
            extra="Male members and ministers only"
          >
            <SpouseSelect gender="male" placeholder="Select husband" />
          </Form.Item>
          <Form.Item
            name="wife"
            label="Wife"
            rules={[{ required: true, message: 'Select wife' }]}
            extra="Female members and ministers only"
          >
            <SpouseSelect gender="female" placeholder="Select wife" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: -8 }}>
            If either spouse is currently single, their marital status is set to married automatically.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button onClick={() => router.push('/families')}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#1565c0' }}>
              Create Family
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

const AddFamily = () => (
  <PermissionGate permission="families.create">
    <AddFamilyContent />
  </PermissionGate>
);

export default AddFamily;
