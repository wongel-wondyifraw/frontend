'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Form, Input, Button, message, Spin } from 'antd';
import { ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import { getFamilyById, updateFamily } from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import SpouseSelect, { decodeLeaderValue, encodeLeaderValue } from '../../Components/common/SpouseSelect';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import './AddFamily.css';

const EditFamilyContent = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const family = await getFamilyById(id);
      form.setFieldsValue({
        name: family.name || '',
        notes: family.notes || '',
        husband: encodeLeaderValue(family.husband_id, family.husband_type || 'member'),
        wife: encodeLeaderValue(family.wife_id, family.wife_type || 'member'),
      });
    } catch {
      message.error('Failed to load family');
      router.push('/families');
    } finally {
      setLoading(false);
    }
  }, [form, id, router]);

  useEffect(() => {
    load();
  }, [load]);

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

      setSaving(true);
      await updateFamily(id, {
        name: values.name || undefined,
        notes: values.notes || undefined,
        husband_id: husband.leader_id,
        husband_type: husband.leader_type,
        wife_id: wife.leader_id,
        wife_type: wife.leader_type,
      });
      message.success('Family updated');
      router.push(`/families/details/${id}`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to update family'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="add-ministry-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/families/details/${id}`)}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}
      >
        Back to Family
      </Button>

      <div className="add-ministry-card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ color: '#1565c0' }} /> Edit Family
        </h2>

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
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button onClick={() => router.push(`/families/details/${id}`)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#1565c0' }}>
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

const EditFamily = () => (
  <PermissionGate permission="families.update">
    <EditFamilyContent />
  </PermissionGate>
);

export default EditFamily;
