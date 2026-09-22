'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Input, Button, message, Spin, Select, Row, Col } from 'antd';
import { ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import { updateFamily, getFamilyById } from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import SpouseSelect, { encodeLeaderValue, decodeLeaderValue } from '../../Components/common/SpouseSelect';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import type { Family } from '@/types';
import './AddFamily.css';

const { Option } = Select;

const EditFamilyContent = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const husbandStatus = Form.useWatch('husband_status', form);
  const wifeStatus = Form.useWatch('wife_status', form);

  const loadFamily = useCallback(async () => {
    try {
      setInitialLoading(true);
      const family = await getFamilyById(id);
      
      form.setFieldsValue({
        name: family.name,
        notes: family.notes,
        husband_status: (family as any).husband_status || 'registered',
        wife_status: (family as any).wife_status || 'registered',
        husband: family.husband_id && family.husband_type ? encodeLeaderValue(family.husband_id, family.husband_type) : undefined,
        wife: family.wife_id && family.wife_type ? encodeLeaderValue(family.wife_id, family.wife_type) : undefined,
      });
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to load family'));
      router.push('/families');
    } finally {
      setInitialLoading(false);
    }
  }, [id, form, router]);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      let husbandId: string | null = null;
      let husbandType: string | null = null;
      let wifeId: string | null = null;
      let wifeType: string | null = null;

      if (values.husband_status === 'registered') {
        const husband = decodeLeaderValue(values.husband);
        if (!husband.leader_id || !husband.leader_type) {
            message.error('Select registered husband');
            return;
        }
        husbandId = husband.leader_id;
        husbandType = husband.leader_type;
      }

      if (values.wife_status === 'registered') {
        const wife = decodeLeaderValue(values.wife);
        if (!wife.leader_id || !wife.leader_type) {
            message.error('Select registered wife');
            return;
        }
        wifeId = wife.leader_id;
        wifeType = wife.leader_type;
      }

      if (husbandId && wifeId && husbandId === wifeId && husbandType === wifeType) {
        message.error('Husband and wife must be different people');
        return;
      }

      setLoading(true);
      await updateFamily(id, {
        name: values.name || null,
        notes: values.notes || null,
        husband_id: husbandId,
        husband_type: husbandType,
        husband_status: values.husband_status,
        wife_id: wifeId,
        wife_type: wifeType,
        wife_status: values.wife_status,
      });
      message.success('Family updated');
      router.push(`/families/details/${id}`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to update family'));
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
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/families/details/${id}`)}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}
      >
        Back to Family Details
      </Button>

      <div className="add-ministry-card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ color: '#1565c0' }} /> Edit Family
        </h2>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Family name">
            <Input size="large" placeholder="Optional" />
          </Form.Item>

          <Row gutter={16}>
              <Col span={8}>
                  <Form.Item name="husband_status" label="Husband Status">
                      <Select size="large">
                          <Option value="registered">Registered</Option>
                          <Option value="non_member">Non-member</Option>
                          <Option value="pending">Pending</Option>
                          <Option value="external">External</Option>
                      </Select>
                  </Form.Item>
              </Col>
              <Col span={16}>
                {husbandStatus === 'registered' ? (
                  <Form.Item
                    name="husband"
                    label="Husband"
                    rules={[{ required: true, message: 'Select husband' }]}
                  >
                    <SpouseSelect gender="male" placeholder="Select husband" />
                  </Form.Item>
                ) : (
                    <Form.Item label="Husband" extra="No member record linked.">
                        <Input size="large" disabled value="Not Registered" />
                    </Form.Item>
                )}
              </Col>
          </Row>

          <Row gutter={16}>
              <Col span={8}>
                  <Form.Item name="wife_status" label="Wife Status">
                      <Select size="large">
                          <Option value="registered">Registered</Option>
                          <Option value="non_member">Non-member</Option>
                          <Option value="pending">Pending</Option>
                          <Option value="external">External</Option>
                      </Select>
                  </Form.Item>
              </Col>
              <Col span={16}>
                {wifeStatus === 'registered' ? (
                  <Form.Item
                    name="wife"
                    label="Wife"
                    rules={[{ required: true, message: 'Select wife' }]}
                  >
                    <SpouseSelect gender="female" placeholder="Select wife" />
                  </Form.Item>
                ) : (
                    <Form.Item label="Wife" extra="No member record linked.">
                        <Input size="large" disabled value="Not Registered" />
                    </Form.Item>
                )}
              </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button onClick={() => router.push(`/families/details/${id}`)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#1565c0' }}>
              Update Family
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
