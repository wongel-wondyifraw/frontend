'use client';

import React from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Checkbox,
  Radio,
  Row,
  Col,
} from 'antd';
import { DeleteOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import SpouseSelect from '@/Components/common/SpouseSelect';
import NameInput from '@/Components/common/NameInput';
import CalendarDateInput from '@/Components/common/CalendarDateInput';
import './MemberFamilySection.css';

/**
 * Marital/family fields for member Add/Edit wizards.
 * Expects parent Form context with: marital_status, gender, has_children,
 * children[], spouse_from_church, internal_spouse_id, external_spouse_*.
 */
export default function MemberFamilySection() {
  const form = Form.useFormInstance();

  return (
    <Form.Item
      noStyle
      shouldUpdate={(prev, cur) =>
        prev.marital_status !== cur.marital_status ||
        prev.has_children !== cur.has_children ||
        prev.spouse_from_church !== cur.spouse_from_church ||
        prev.skip_spouse_info !== cur.skip_spouse_info ||
        prev.gender !== cur.gender
      }
    >
      {({ getFieldValue }) => {
        const status = getFieldValue('marital_status');
        const hasChildren = getFieldValue('has_children');
        const spouseFromChurch = getFieldValue('spouse_from_church');
        const skipSpouse = Boolean(getFieldValue('skip_spouse_info'));
        const gender = (getFieldValue('gender') || '').toLowerCase();
        const spouseGender = gender === 'male' ? 'female' : gender === 'female' ? 'male' : undefined;

        const isMarried = status === 'married';
        const showChildren =
          (!isMarried && (status === 'single' || status === 'divorced' || status === 'widowed')) ||
          (isMarried && !skipSpouse);

        if (!status) return null;

        return (
          <div
            id="member-family-section-container"
            className="member-family-section-container"
            style={{ marginTop: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 8 }}
          >
            <Form.Item name="skip_spouse_info" hidden>
              <Input />
            </Form.Item>

            {isMarried && (
              <div id="spouse-information-block" className="spouse-information-block">
                <div
                  className="spouse-section-header"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-color, #1e293b)' }}>
                    Family &amp; Spouse Information
                  </span>
                  {!skipSpouse && (
                    <Button
                      type="text"
                      size="small"
                      style={{ color: '#64748b', fontSize: 13, padding: '0 8px' }}
                      onClick={() => {
                        form.setFieldsValue({
                          skip_spouse_info: true,
                          spouse_from_church: undefined,
                          internal_spouse_id: undefined,
                          external_spouse_name: undefined,
                          external_spouse_phone: undefined,
                          external_spouse_church: undefined,
                          has_children: false,
                          children: [],
                        });
                      }}
                    >
                      Skip for now
                    </Button>
                  )}
                </div>

                {skipSpouse ? (
                  <div
                    id="spouse-skipped-notice"
                    className="spouse-skipped-notice"
                  >
                    <div className="spouse-skipped-content">
                      <InfoCircleOutlined className="spouse-skipped-icon" />
                      <div className="spouse-skipped-text">
                        <div className="spouse-skipped-title">
                          Family details skipped
                        </div>
                        <div className="spouse-skipped-desc">
                          Spouse and children information will be recorded as &quot;Pending&quot;. You can link or update family details later from Family Management.
                        </div>
                      </div>
                    </div>
                    <div className="spouse-skipped-action">
                      <Button
                        size="small"
                        type="default"
                        onClick={() => {
                          form.setFieldsValue({ skip_spouse_info: false });
                        }}
                      >
                        Add Family Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div id="spouse-form-fields" className="spouse-form-fields">
                    <Form.Item
                      name="spouse_from_church"
                      label="Is your spouse from this church?"
                      rules={[{ required: true, message: 'Please indicate spouse church membership' }]}
                    >
                      <Radio.Group>
                        <Radio value="yes">Yes</Radio>
                        <Radio value="no">No</Radio>
                      </Radio.Group>
                    </Form.Item>

                    {spouseFromChurch === 'yes' && (
                      <Form.Item
                        label="Select Spouse"
                        name="internal_spouse_id"
                        rules={[{ required: true, message: 'Please select your spouse' }]}
                      >
                        {spouseGender ? (
                          <SpouseSelect gender={spouseGender} placeholder="Select member or minister" />
                        ) : (
                          <Select placeholder="Select gender first" disabled size="large" />
                        )}
                      </Form.Item>
                    )}

                    {spouseFromChurch === 'no' && (
                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            label="Spouse Name"
                            name="external_spouse_name"
                            rules={[{ required: true, message: 'Spouse name is required' }]}
                          >
                            <NameInput mode="person" size="large" placeholder="Full Name" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item label="Spouse Phone" name="external_spouse_phone">
                            <Input size="large" placeholder="Phone Number" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item label="Local Church" name="external_spouse_church">
                            <NameInput mode="title" size="large" placeholder="Name of Church" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  </div>
                )}
              </div>
            )}

            {showChildren && (
              <div id="member-children-block" className="member-children-block">
                <Form.Item
                  name="has_children"
                  valuePropName="checked"
                  style={{ marginBottom: hasChildren ? 16 : 0 }}
                >
                  <Checkbox>
                    {status === 'married' ? 'Have children together / in household?' : 'Have children?'}
                  </Checkbox>
                </Form.Item>

                {hasChildren && (
                  <Form.List name="children">
                    {(fields, { add, remove }) => (
                      <div id="member-children-list" className="member-children-list">
                        {fields.map(({ key, name, ...restField }) => (
                          <div
                            key={key}
                            className="member-child-row-card"
                            style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' }}
                          >
                            <Row gutter={[12, 12]} align="top">
                              <Col xs={24} sm={9}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'name']}
                                  label="Child Name"
                                  rules={[{ required: true, message: 'Missing child name' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <NameInput mode="person" placeholder="Full Name" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'date_of_birth']}
                                  label="Date of Birth"
                                  style={{ marginBottom: 0 }}
                                >
                                  <CalendarDateInput allowPartial disableFuture size="middle" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={3} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                <Button
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(name)}
                                  aria-label="Remove child"
                                />
                              </Col>
                            </Row>
                          </div>
                        ))}
                        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Add Child
                          </Button>
                        </Form.Item>
                      </div>
                    )}
                  </Form.List>
                )}
              </div>
            )}
          </div>
        );
      }}
    </Form.Item>
  );
}
