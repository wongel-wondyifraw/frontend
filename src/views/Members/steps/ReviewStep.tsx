'use client';

import React from 'react';
import { Form } from 'antd';
import { CheckCircle2 } from 'lucide-react';
import { formatCalendarDateField } from '@/lib/ethiopian-calendar';
import { fileDisplayName, MEMBER_TYPE_OPTIONS } from '@/lib/member-payload';
import { normalizePersonName, normalizeTitleInitials } from '@/lib/name-normalizer';

interface ReviewStepProps {
  churchLetterFile: File | null;
  letterUrl?: string;
}

export default function ReviewStep({
  churchLetterFile,
  letterUrl,
}: ReviewStepProps) {
  const form = Form.useFormInstance();

  return (
    <div id="member-step-review" className="wizard-step-review">
      <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle2 size={18} style={{ color: '#1E40AF' }} />
        <span>Review</span>
      </h3>
      <div
        className="member-review-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 8,
          padding: 20,
          border: '1px solid var(--border-color)',
        }}
      >
        <h4 style={{ marginBottom: 16 }}>Registration Summary</h4>
        <Form.Item noStyle shouldUpdate>
          {() => {
            const values = form.getFieldsValue(true);
            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '8px 24px',
                  fontSize: 13,
                }}
              >
                <div>
                  <strong>Name:</strong>{' '}
                  {[
                    normalizePersonName(values.first_name || ''),
                    normalizePersonName(values.middle_name || ''),
                    normalizePersonName(values.last_name || ''),
                  ]
                    .filter(Boolean)
                    .join(' ') || '—'}
                </div>
                <div>
                  <strong>Birthdate:</strong>{' '}
                  {formatCalendarDateField(values.date_of_birth, {
                    includeEquivalent: true,
                  })}
                </div>
                <div>
                  <strong>Salvation Date:</strong>{' '}
                  {formatCalendarDateField(values.salvation_date, {
                    includeEquivalent: true,
                  })}
                </div>
                <div>
                  <strong>Joined Date:</strong>{' '}
                  {formatCalendarDateField(values.joined_date, {
                    includeEquivalent: true,
                  })}
                </div>
                <div>
                  <strong>Phone:</strong> {values.phone || '—'}
                </div>
                <div>
                  <strong>Member Type:</strong>{' '}
                  {MEMBER_TYPE_OPTIONS.find((o) => o.value === values.member_type)
                    ?.label ||
                    values.member_type ||
                    '—'}
                </div>
                <div>
                  <strong>Marital Status:</strong> {values.marital_status || '—'}
                </div>
                <div>
                  <strong>Spouse:</strong>{' '}
                  {values.marital_status === 'married'
                    ? values.skip_spouse_info
                      ? 'Pending (Skipped)'
                      : values.spouse_from_church === 'yes'
                        ? 'In church'
                        : (values.external_spouse_name
                            ? normalizePersonName(values.external_spouse_name)
                            : '') || 'External'
                    : '—'}
                </div>
                <div>
                  <strong>Children:</strong>{' '}
                  {values.marital_status === 'married' && values.skip_spouse_info
                    ? 'Pending (Skipped)'
                    : values.has_children && values.children?.length
                      ? `${values.children.length} added`
                      : 'None'}
                </div>
                <div>
                  <strong>Employment:</strong> {values.employment_status || '—'}
                </div>
                <div>
                  <strong>Profession:</strong>{' '}
                  {(values.profession
                    ? normalizeTitleInitials(values.profession)
                    : '') || '—'}
                </div>
                <div>
                  <strong>Education:</strong> {values.education_level || '—'}
                </div>
                <div>
                  <strong>Telegram:</strong> {values.telegram_username || '—'}
                </div>
                <div>
                  <strong>Water Baptized:</strong> {values.baptized || '—'}
                </div>
                <div>
                  <strong>Church Letter:</strong>{' '}
                  {fileDisplayName(churchLetterFile, letterUrl) || '—'}
                </div>
                {values.member_type === 'transferred' &&
                  !churchLetterFile &&
                  !letterUrl && (
                    <div style={{ gridColumn: '1 / -1', color: '#d97706' }}>
                      <strong>Follow-up:</strong> Recommendation letter missing — will be flagged.
                    </div>
                  )}
                <div>
                  <strong>Ministries:</strong>{' '}
                  {values.interested_ministries?.length
                    ? `${values.interested_ministries.length} selected`
                    : 'None'}
                </div>
              </div>
            );
          }}
        </Form.Item>
      </div>
    </div>
  );
}

