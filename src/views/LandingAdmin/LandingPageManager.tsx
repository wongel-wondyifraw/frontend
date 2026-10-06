'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, Switch, Tabs, Select, Radio, DatePicker, TimePicker } from 'antd';
import { message } from '@/lib/app-message';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  RightOutlined,
  CompassOutlined,
  BookOutlined,
  HeartOutlined,
  StarOutlined,
  TeamOutlined,
  FireOutlined,
  BulbOutlined,
  GlobalOutlined,
  HomeOutlined,
  SoundOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  WifiOutlined,
  CoffeeOutlined,
  ReadOutlined,
  BankOutlined,
  GiftOutlined,
  MessageOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { getLandingContent, updateLandingContent } from '@/services/api';
import type { LandingMediaItem, LandingPageContent } from '@/types';
import { DEFAULT_LANDING_CONTENT, isIsoDate, mergeLandingContent, validateLandingContent } from '@/lib/landing-defaults';
import { getApiErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm-delete';
import LandingMediaFields from './LandingMediaFields';
import './LandingPageManager.css';
import './VisualLandingEditor.css';
import ChurchFeed from '../LandingPage/ChurchFeed';

dayjs.extend(customParseFormat);

const { TextArea } = Input;
const { RangePicker } = DatePicker;

type SectionKey =
  | 'hero'
  | 'stats'
  | 'vision'
  | 'programs'
  | 'ministries'
  | 'projects'
  | 'contact'
  | 'mission'
  | 'footer';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'stats', label: 'Stats ribbon' },
  { key: 'vision', label: 'Vision' },
  { key: 'programs', label: 'Programs' },
  { key: 'ministries', label: 'Ministries' },
  { key: 'projects', label: 'Projects' },
  { key: 'contact', label: 'Contact & map' },
  { key: 'mission', label: 'Mission' },
  { key: 'footer', label: 'Footer' },
];

function ServiceTimesEditor({
  value,
  onChange,
}: {
  value?: { name: string; time: string }[];
  onChange: (rows: { name: string; time: string }[]) => void;
}) {
  const rows = value?.length ? value : [{ name: '', time: '' }];

  const update = (index: number, patch: Partial<{ name: string; time: string }>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  return (
    <div className="la-field-grid">
      {rows.map((row, index) => (
        <div key={index} className="la-field-grid la-field-grid--2" style={{ alignItems: 'end' }}>
          <Field label={index === 0 ? 'Service / day' : undefined}>
            <Input
              placeholder="e.g. Sunday Worship"
              value={row.name}
              onChange={(e) => update(index, { name: e.target.value })}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <Field label={index === 0 ? 'Hours' : undefined}>
                <Input
                  placeholder="e.g. 9:00 AM – 12:30 PM"
                  value={row.time}
                  onChange={(e) => update(index, { time: e.target.value })}
                />
              </Field>
            </div>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              aria-label="Remove service row"
            />
          </div>
        </div>
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => onChange([...rows, { name: '', time: '' }])}
      >
        Add service time
      </Button>
    </div>
  );
}

function Field({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label ? <span className="la-label">{label}</span> : null}
      {children}
    </div>
  );
}

function ItemBlock({
  item,
  index,
  onChange,
  onRemove,
  showSchedule = false,
  allowIconChoice = false,
  hideTagAndRef = false,
  hideRef = false,
  imageOnly = false,
}: {
  item: LandingMediaItem;
  index?: number;
  onChange: (next: LandingMediaItem) => void;
  onRemove: () => void;
  showSchedule?: boolean;
  allowIconChoice?: boolean;
  hideTagAndRef?: boolean;
  hideRef?: boolean;
  imageOnly?: boolean;
}) {
  const [mediaMode, setMediaMode] = useState<'icon' | 'image'>(
    item.icon || !item.image_url ? 'icon' : 'image',
  );
  const [open, setOpen] = useState(true);

  return (
    <div className={`la-item${open ? ' is-open' : ''}`}>
      <div
        className="la-item-head"
        style={{ cursor: 'pointer', marginBottom: open ? 12 : 0 }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RightOutlined
            style={{
              fontSize: 12,
              transition: 'transform 0.2s',
              transform: open ? 'rotate(90deg)' : 'rotate(0)',
            }}
          />
          <span className="la-item-title">
            {index !== undefined ? `${index + 1}. ` : ''}
            {item.title || 'Untitled item'}
          </span>
        </div>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            confirmDelete({
              title: 'Remove this item?',
              content: 'It will be removed when you save the landing page.',
              onOk: onRemove,
            });
          }}
        />
      </div>

      {open && (
        <div className="la-item-body">
          <div className="la-field-grid">
            <Field label="Title">
              <Input
                value={item.title}
                onChange={(e) => onChange({ ...item, title: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <TextArea
                rows={2}
                value={item.text || ''}
                onChange={(e) => onChange({ ...item, text: e.target.value })}
              />
            </Field>
            {!hideTagAndRef && (
              <div className={`la-field-grid ${hideRef ? '' : 'la-field-grid--2'}`}>
                <Field label="Tag">
                  <Input
                    value={item.tag || ''}
                    onChange={(e) => onChange({ ...item, tag: e.target.value })}
                  />
                </Field>
                {!hideRef && (
                  <Field label="Reference">
                    <Input
                      value={item.ref || ''}
                      onChange={(e) => onChange({ ...item, ref: e.target.value })}
                    />
                  </Field>
                )}
              </div>
            )}
            {showSchedule && (
              <div className="la-field-grid la-field-grid--2">
                <Field label="Event dates">
                  <RangePicker
                    style={{ width: '100%' }}
                    value={(() => {
                      const start = isIsoDate(item.event_date) ? dayjs(item.event_date) : null;
                      const end = isIsoDate(item.event_date_end)
                        ? dayjs(item.event_date_end)
                        : start;
                      return start ? ([start, end || start] as [Dayjs, Dayjs]) : null;
                    })()}
                    onChange={(range) => {
                      const start = range?.[0];
                      const end = range?.[1];
                      onChange({
                        ...item,
                        event_date: start ? start.format('YYYY-MM-DD') : '',
                        event_date_end: end ? end.format('YYYY-MM-DD') : '',
                      });
                    }}
                    format="MMM D, YYYY"
                    allowEmpty={[false, true]}
                  />
                </Field>
                <Field label="Event time">
                  <TimePicker
                    style={{ width: '100%' }}
                    use12Hours
                    format="h:mm A"
                    value={(() => {
                      if (!item.event_time) return null;
                      const parsed = dayjs(item.event_time, ['HH:mm', 'h:mm A', 'hh:mm A'], true);
                      return parsed.isValid() ? parsed : null;
                    })()}
                    onChange={(time) =>
                      onChange({ ...item, event_time: time ? time.format('HH:mm') : '' })
                    }
                    placeholder="Select time"
                    allowClear
                  />
                </Field>
                <Field label="Location">
                  <Input
                    value={item.location || ''}
                    onChange={(e) => onChange({ ...item, location: e.target.value })}
                    placeholder="e.g. Main sanctuary"
                  />
                </Field>
                <Field label="Ministers / leads">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                    placeholder="Type a name and press Enter"
                    value={
                      item.ministers?.length
                        ? item.ministers
                        : item.lead
                          ? item.lead
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : []
                    }
                    onChange={(ministers: string[]) =>
                      onChange({
                        ...item,
                        ministers,
                        lead: ministers.join(', '),
                      })
                    }
                  />
                </Field>
              </div>
            )}
          </div>
          <div className="la-item-media">
            <div className="la-item-media-label">Media</div>
            {allowIconChoice && (
              <div style={{ marginBottom: '1rem' }}>
                <Radio.Group
                  value={mediaMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setMediaMode(mode);
                    if (mode === 'icon') {
                      onChange({
                        ...item,
                        image_url: null,
                        video_url: null,
                        video_file_url: null,
                        file_url: null,
                        file_name: null,
                      });
                    } else {
                      onChange({ ...item, icon: undefined });
                    }
                  }}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="icon">Choose Icon</Radio.Button>
                  <Radio.Button value="image">Upload Image</Radio.Button>
                </Radio.Group>
              </div>
            )}

            {(!allowIconChoice || mediaMode === 'image') && (
              <LandingMediaFields
                imageUrl={item.image_url}
                fileUrl={item.file_url}
                fileName={item.file_name}
                videoUrl={item.video_url}
                videoFileUrl={item.video_file_url}
                onChange={(media) => onChange({ ...item, ...media })}
                imageOnly={imageOnly}
              />
            )}

            {allowIconChoice && mediaMode === 'icon' && (
              <Field label="Select Icon">
                <Select
                  value={item.icon || undefined}
                  allowClear
                  placeholder="Default icon"
                  onChange={(v) =>
                    onChange({ ...item, icon: v || undefined, image_url: null })
                  }
                  style={{ width: '100%' }}
                  virtual={false}
                  options={[
                    { label: <span><CompassOutlined /> Compass</span>, value: 'compass' },
                    { label: <span><BookOutlined /> Book</span>, value: 'book' },
                    { label: <span><HeartOutlined /> Heart</span>, value: 'heart' },
                    { label: <span><StarOutlined /> Star</span>, value: 'star' },
                    { label: <span><TeamOutlined /> Team</span>, value: 'team' },
                    { label: <span><FireOutlined /> Fire</span>, value: 'fire' },
                    { label: <span><BulbOutlined /> Lightbulb</span>, value: 'bulb' },
                    { label: <span><GlobalOutlined /> Globe</span>, value: 'globe' },
                    { label: <span><HomeOutlined /> Home</span>, value: 'home' },
                    { label: <span><SoundOutlined /> Sound</span>, value: 'sound' },
                    { label: <span><CrownOutlined /> Crown</span>, value: 'crown' },
                    { label: <span><CheckCircleOutlined /> Check</span>, value: 'check' },
                    { label: <span><InfoCircleOutlined /> Info</span>, value: 'info' },
                    { label: <span><PlayCircleOutlined /> Play</span>, value: 'play' },
                    { label: <span><SafetyOutlined /> Shield</span>, value: 'shield' },
                    { label: <span><ThunderboltOutlined /> Lightning</span>, value: 'lightning' },
                    { label: <span><TrophyOutlined /> Trophy</span>, value: 'trophy' },
                    { label: <span><UserOutlined /> User</span>, value: 'user' },
                    { label: <span><WifiOutlined /> Wifi</span>, value: 'wifi' },
                    { label: <span><CoffeeOutlined /> Coffee</span>, value: 'coffee' },
                    { label: <span><ReadOutlined /> Read</span>, value: 'read' },
                    { label: <span><BankOutlined /> Bank</span>, value: 'bank' },
                    { label: <span><GiftOutlined /> Gift</span>, value: 'gift' },
                    { label: <span><MessageOutlined /> Message</span>, value: 'message' },
                    { label: <span><RocketOutlined /> Rocket</span>, value: 'rocket' },
                    { label: 'Default / None', value: '' },
                  ]}
                />
              </Field>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionPanel({
  title,
  subtitle,
  enabled,
  onEnabledChange,
  children,
}: {
  title: string;
  subtitle?: string;
  enabled?: boolean;
  onEnabledChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="la-section">
      <div className="la-section-head">
        <div>
          <h3 className="la-section-title">{title}</h3>
          {subtitle ? <p className="la-section-sub">{subtitle}</p> : null}
        </div>
        <div className="la-section-head-actions">
          {onEnabledChange ? (
            <Switch checked={enabled !== false} onChange={onEnabledChange} />
          ) : null}
        </div>
      </div>
      <div className="la-section-body">{children}</div>
    </div>
  );
}

function sectionEnabled(content: LandingPageContent, key: SectionKey): boolean | undefined {
  switch (key) {
    case 'hero':
      return content.hero?.enabled;
    case 'stats':
      return content.stats?.enabled;
    case 'vision':
      return content.vision?.enabled;
    case 'programs':
      return content.programs?.enabled;
    case 'ministries':
      return content.ministries?.enabled;
    case 'projects':
      return content.projects?.enabled;
    case 'contact':
      return content.contact?.enabled;
    case 'mission':
      return content.about?.enabled;
    case 'footer':
      return undefined;
  }
}

const LandingPageManagerContent = () => {
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const page = await getLandingContent();
      const raw = page.content;
      const parsed =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as LandingPageContent)
          : {};
      setContent(mergeLandingContent(parsed));
      setDirty(false);
    } catch {
      setContent(DEFAULT_LANDING_CONTENT);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const save = async () => {
    if (!dirty) return;
    const issues = validateLandingContent(content);
    if (issues.length) {
      const bySection: Partial<Record<SectionKey, string>> = {};
      for (const issue of issues) {
        if (!bySection[issue.section]) bySection[issue.section] = issue.message;
      }
      setSectionErrors(bySection);
      setActiveSection(issues[0].section);
      message.error(issues[0].message);
      return;
    }
    setSectionErrors({});
    try {
      setSaving(true);
      await updateLandingContent(content);
      message.success('Landing page saved');
      setDirty(false);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to save landing page'));
    } finally {
      setSaving(false);
    }
  };

  const patch = <K extends keyof LandingPageContent>(key: K, value: LandingPageContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    const navKey: SectionKey | undefined =
      key === 'about'
        ? 'mission'
        : key === 'hero' ||
            key === 'stats' ||
            key === 'vision' ||
            key === 'programs' ||
            key === 'ministries' ||
            key === 'projects' ||
            key === 'contact' ||
            key === 'footer'
          ? key
          : undefined;
    if (navKey) {
      setSectionErrors((prev) => {
        if (!prev[navKey]) return prev;
        const next = { ...prev };
        delete next[navKey];
        return next;
      });
    }
  };

  const renderActiveEditor = () => {
    switch (activeSection) {
      case 'hero':
        return (
          <SectionPanel
            title="Hero"
            subtitle="Main banner on the homepage"
            enabled={content.hero?.enabled}
            onEnabledChange={(enabled) => patch('hero', { ...content.hero, enabled })}
          >
            <div className="la-field-grid">
              <Field label="Title">
                <Input
                  value={content.hero?.title || ''}
                  onChange={(e) => patch('hero', { ...content.hero, title: e.target.value })}
                />
              </Field>
              <Field label="Supporting text">
                <TextArea
                  rows={3}
                  value={content.hero?.lede || ''}
                  onChange={(e) => patch('hero', { ...content.hero, lede: e.target.value })}
                />
              </Field>
              <div className="la-field-grid la-field-grid--2">
                <Field label="Primary CTA">
                  <Input
                    value={content.hero?.cta_label || ''}
                    onChange={(e) =>
                      patch('hero', { ...content.hero, cta_label: e.target.value })
                    }
                  />
                </Field>
                <Field label="Secondary CTA">
                  <Input
                    value={content.hero?.secondary_cta_label || ''}
                    onChange={(e) =>
                      patch('hero', { ...content.hero, secondary_cta_label: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="la-field-grid la-field-grid--2">
                <Field label="Verse reference">
                  <Input
                    value={content.hero?.verse_ref || ''}
                    onChange={(e) =>
                      patch('hero', { ...content.hero, verse_ref: e.target.value })
                    }
                  />
                </Field>
                <Field label="Verse text">
                  <Input
                    value={content.hero?.verse_text || ''}
                    onChange={(e) =>
                      patch('hero', { ...content.hero, verse_text: e.target.value })
                    }
                  />
                </Field>
              </div>
              <LandingMediaFields
                imageUrl={content.hero?.image_url}
                fileUrl={content.hero?.file_url}
                fileName={content.hero?.file_name}
                videoUrl={content.hero?.video_url}
                videoFileUrl={content.hero?.video_file_url}
                onChange={(media) => patch('hero', { ...content.hero, ...media })}
              />
            </div>
          </SectionPanel>
        );

      case 'stats':
        return (
          <SectionPanel
            title="Stats ribbon"
            subtitle="Numbers shown in the bar directly under the hero"
            enabled={content.stats?.enabled}
            onEnabledChange={(enabled) => patch('stats', { ...content.stats, enabled })}
          >
            {(content.stats?.items || []).map((item, index) => (
              <div key={index} className="la-field-grid la-field-grid--2" style={{ alignItems: 'end', marginBottom: 12 }}>
                <Field label={index === 0 ? 'Value' : undefined}>
                  <Input
                    placeholder="e.g. 4,500+"
                    value={item.title}
                    onChange={(e) => {
                      const items = [...(content.stats?.items || [])];
                      items[index] = { ...items[index], title: e.target.value };
                      patch('stats', { ...content.stats, items });
                    }}
                  />
                </Field>
                <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <Field label={index === 0 ? 'Label' : undefined}>
                      <Input
                        placeholder="e.g. Active Church Members"
                        value={item.text || ''}
                        onChange={(e) => {
                          const items = [...(content.stats?.items || [])];
                          items[index] = { ...items[index], text: e.target.value };
                          patch('stats', { ...content.stats, items });
                        }}
                      />
                    </Field>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const items = (content.stats?.items || []).filter((_, i) => i !== index);
                      patch('stats', { ...content.stats, items });
                    }}
                    aria-label="Remove stat"
                  />
                </div>
              </div>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() =>
                patch('stats', {
                  ...content.stats,
                  items: [...(content.stats?.items || []), { title: '', text: '' }],
                })
              }
            >
              Add stat
            </Button>
          </SectionPanel>
        );

      case 'vision':
        return (
          <>
            <SectionPanel
              title="Vision"
              enabled={content.vision?.enabled}
              onEnabledChange={(enabled) => patch('vision', { ...content.vision, enabled })}
            >
              <div className="la-field-grid">
                <Field label="Heading">
                  <Input
                    value={content.vision?.heading || ''}
                    onChange={(e) =>
                      patch('vision', { ...content.vision, heading: e.target.value })
                    }
                  />
                </Field>
                <Field label="Body">
                  <TextArea
                    rows={3}
                    value={content.vision?.body || ''}
                    onChange={(e) =>
                      patch('vision', { ...content.vision, body: e.target.value })
                    }
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel title="Vision cards" subtitle="Cards shown in the vision section">
              {(content.vision?.items || []).length === 0 && (
                <p className="la-empty">No cards yet.</p>
              )}
              {(content.vision?.items || []).map((item, index) => (
                <ItemBlock
                  key={index}
                  index={index}
                  item={item}
                  allowIconChoice
                  hideTagAndRef
                  imageOnly
                  onChange={(next) => {
                    const arr = [...(content.vision?.items || [])];
                    arr[index] = next;
                    patch('vision', { ...content.vision, items: arr });
                  }}
                  onRemove={() => {
                    const arr = [...(content.vision?.items || [])].filter((_, i) => i !== index);
                    patch('vision', { ...content.vision, items: arr });
                  }}
                />
              ))}
              <div className="la-actions-row">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    patch('vision', {
                      ...content.vision,
                      items: [...(content.vision?.items || []), { title: '', text: '' }],
                    })
                  }
                >
                  Add card
                </Button>
              </div>
            </SectionPanel>
          </>
        );

      case 'programs': {
        const section = content.programs || {};
        const list = section.items || [];
        return (
          <>
            <SectionPanel
              title="Programs"
              subtitle="Section heading and visibility"
              enabled={section.enabled}
              onEnabledChange={(enabled) => patch('programs', { ...section, enabled })}
            >
              <div className="la-field-grid">
                <Field label="Title">
                  <Input
                    value={section.title || ''}
                    onChange={(e) => patch('programs', { ...section, title: e.target.value })}
                  />
                </Field>
                <Field label="Subtitle">
                  <TextArea
                    rows={2}
                    value={section.subtitle || ''}
                    onChange={(e) => patch('programs', { ...section, subtitle: e.target.value })}
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel title="Program cards" subtitle="Program cards shown in this section">
              {list.length === 0 && <p className="la-empty">No programs yet.</p>}
              {list.map((item, index) => (
                <ItemBlock
                  key={index}
                  index={index}
                  item={item}
                  showSchedule
                  onChange={(next) => {
                    const items = [...list];
                    items[index] = next;
                    patch('programs', { ...section, items });
                  }}
                  onRemove={() => {
                    patch('programs', {
                      ...section,
                      items: list.filter((_, i) => i !== index),
                    });
                  }}
                />
              ))}
              <div className="la-actions-row">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    patch('programs', {
                      ...section,
                      items: [...list, { title: 'New program', text: '' }],
                    })
                  }
                >
                  Add card
                </Button>
              </div>
            </SectionPanel>
          </>
        );
      }

      case 'ministries': {
        const section = content.ministries || {};
        const list = section.items || [];
        return (
          <>
            <SectionPanel
              title="Ministries"
              subtitle="Section heading and visibility"
              enabled={section.enabled}
              onEnabledChange={(enabled) => patch('ministries', { ...section, enabled })}
            >
              <div className="la-field-grid">
                <Field label="Title">
                  <Input
                    value={section.title || ''}
                    onChange={(e) => patch('ministries', { ...section, title: e.target.value })}
                  />
                </Field>
                <Field label="Subtitle">
                  <TextArea
                    rows={2}
                    value={section.subtitle || ''}
                    onChange={(e) =>
                      patch('ministries', { ...section, subtitle: e.target.value })
                    }
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel title="Ministry cards" subtitle="Cards shown in the ministries section">
              {list.length === 0 && <p className="la-empty">No ministry cards yet.</p>}
              {list.map((item, index) => (
                <ItemBlock
                  key={index}
                  index={index}
                  item={item}
                  allowIconChoice
                  hideTagAndRef
                  imageOnly
                  onChange={(next) => {
                    const items = [...list];
                    items[index] = next;
                    patch('ministries', { ...section, items });
                  }}
                  onRemove={() => {
                    patch('ministries', {
                      ...section,
                      items: list.filter((_, i) => i !== index),
                    });
                  }}
                />
              ))}
              <div className="la-actions-row">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    patch('ministries', {
                      ...section,
                      items: [...list, { title: 'New ministry', text: '' }],
                    })
                  }
                >
                  Add card
                </Button>
              </div>
            </SectionPanel>
          </>
        );
      }

      case 'projects': {
        const section = content.projects || {};
        const list = section.items || [];
        return (
          <>
            <SectionPanel
              title="Projects"
              subtitle="Section heading and visibility"
              enabled={section.enabled}
              onEnabledChange={(enabled) => patch('projects', { ...section, enabled })}
            >
              <div className="la-field-grid">
                <Field label="Title">
                  <Input
                    value={section.title || ''}
                    onChange={(e) => patch('projects', { ...section, title: e.target.value })}
                  />
                </Field>
                <Field label="Subtitle">
                  <TextArea
                    rows={2}
                    value={section.subtitle || ''}
                    onChange={(e) => patch('projects', { ...section, subtitle: e.target.value })}
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel title="Project cards" subtitle="Cards shown in the projects section">
              {list.length === 0 && <p className="la-empty">No project cards yet.</p>}
              {list.map((item, index) => (
                <ItemBlock
                  key={index}
                  index={index}
                  item={item}
                  hideTagAndRef
                  onChange={(next) => {
                    const items = [...list];
                    items[index] = next;
                    patch('projects', { ...section, items });
                  }}
                  onRemove={() => {
                    patch('projects', {
                      ...section,
                      items: list.filter((_, i) => i !== index),
                    });
                  }}
                />
              ))}
              <div className="la-actions-row">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    patch('projects', {
                      ...section,
                      items: [...list, { title: 'New project', text: '' }],
                    })
                  }
                >
                  Add card
                </Button>
              </div>
            </SectionPanel>
          </>
        );
      }

      case 'contact':
        return (
          <>
            <SectionPanel
              title="Contact"
              subtitle="Get in touch block"
              enabled={content.contact?.enabled}
              onEnabledChange={(enabled) => patch('contact', { ...content.contact, enabled })}
            >
              <div className="la-field-grid">
                <Field label="Touch title">
                  <Input
                    value={content.contact?.touch_title || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, touch_title: e.target.value })
                    }
                    placeholder="Get in touch"
                  />
                </Field>
                <Field label="Touch body">
                  <TextArea
                    rows={3}
                    value={content.contact?.touch_body || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, touch_body: e.target.value })
                    }
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel
              title="Sanctuary location & hours"
              subtitle="Gathering times and office phone"
            >
              <div className="la-field-grid">
                <Field label="Card title">
                  <Input
                    value={content.contact?.location_title || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, location_title: e.target.value })
                    }
                    placeholder="Sanctuary Location & Gathering Hours"
                  />
                </Field>
                <Field label="Services heading">
                  <Input
                    value={content.contact?.location_services_heading || ''}
                    onChange={(e) =>
                      patch('contact', {
                        ...content.contact,
                        location_services_heading: e.target.value,
                      })
                    }
                    placeholder="Weekly Services & Gathering Times"
                  />
                </Field>
                <Field label="Service times">
                  <ServiceTimesEditor
                    value={content.contact?.location_services}
                    onChange={(location_services) =>
                      patch('contact', { ...content.contact, location_services })
                    }
                  />
                </Field>
                <Field label="Office phone">
                  <Input
                    value={content.contact?.office_phone || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, office_phone: e.target.value })
                    }
                    placeholder="+251 11 645 8820"
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel
              title="Google Maps embed"
              subtitle="Paste a Google Maps share link, embed URL, or iframe"
            >
              <div className="la-field-grid">
                <div className="la-field-grid la-field-grid--2">
                  <Field label="Map title">
                    <Input
                      value={content.contact?.map_title || ''}
                      onChange={(e) =>
                        patch('contact', { ...content.contact, map_title: e.target.value })
                      }
                      placeholder="Goro Full Gospel Church"
                    />
                  </Field>
                  <Field label="Map subtitle">
                    <Input
                      value={content.contact?.map_subtitle || ''}
                      onChange={(e) =>
                        patch('contact', { ...content.contact, map_subtitle: e.target.value })
                      }
                      placeholder="Bole Sub-City, Addis Ababa"
                    />
                  </Field>
                </div>
                <Field label="Google Maps link or embed">
                  <TextArea
                    rows={3}
                    value={content.contact?.map_url || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, map_url: e.target.value })
                    }
                    placeholder="Paste Google Maps share link, embed URL, or full iframe HTML"
                  />
                </Field>
                <Field label="Directions / open-in-Maps URL (optional)">
                  <Input
                    value={content.contact?.directions_url || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, directions_url: e.target.value })
                    }
                    placeholder="https://www.google.com/maps?cid=…"
                  />
                </Field>
                <Field label="Transit / foot note">
                  <Input
                    value={content.contact?.map_note || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, map_note: e.target.value })
                    }
                    placeholder="Goro-Sefera Station (3 min walk)"
                  />
                </Field>
              </div>
            </SectionPanel>
          </>
        );

      case 'mission':
        return (
          <>
            <SectionPanel
              title="Mission"
              subtitle="Grey Mission block on the homepage"
              enabled={content.about?.enabled}
              onEnabledChange={(enabled) => patch('about', { ...content.about, enabled })}
            >
              <div className="la-field-grid">
                <div className="la-field-grid la-field-grid--2">
                  <Field label="Badge">
                    <Input
                      value={content.about?.label || ''}
                      onChange={(e) =>
                        patch('about', { ...content.about, label: e.target.value })
                      }
                      placeholder="MISSION"
                    />
                  </Field>
                  <Field label="Title">
                    <Input
                      value={content.about?.title || ''}
                      onChange={(e) =>
                        patch('about', { ...content.about, title: e.target.value })
                      }
                      placeholder="Our vision"
                    />
                  </Field>
                </div>
                <Field label="Subtitle">
                  <TextArea
                    rows={3}
                    value={content.about?.subtitle || ''}
                    onChange={(e) =>
                      patch('about', { ...content.about, subtitle: e.target.value })
                    }
                    placeholder="A church that makes disciples who love God…"
                  />
                </Field>
              </div>
            </SectionPanel>
            <SectionPanel
              title="Mission cards"
              subtitle="Icon cards in the Mission section"
            >
              {(content.about?.items || []).length === 0 && (
                <p className="la-empty">No mission cards yet.</p>
              )}
              {(content.about?.items || []).map((item, index) => (
                <ItemBlock
                  key={index}
                  index={index}
                  item={item}
                  allowIconChoice
                  hideTagAndRef
                  imageOnly
                  onChange={(next) => {
                    const arr = [...(content.about?.items || [])];
                    arr[index] = next;
                    patch('about', { ...content.about, items: arr });
                  }}
                  onRemove={() => {
                    const arr = [...(content.about?.items || [])].filter((_, i) => i !== index);
                    patch('about', { ...content.about, items: arr });
                  }}
                />
              ))}
              <div className="la-actions-row">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    patch('about', {
                      ...content.about,
                      items: [...(content.about?.items || []), { title: '', text: '' }],
                    })
                  }
                >
                  Add card
                </Button>
              </div>
            </SectionPanel>
          </>
        );

      case 'footer':
        return (
          <SectionPanel title="Footer" subtitle="Footer blurb shown at the bottom of the page">
            <div className="la-field-grid">
              <Field label="Blurb">
                <TextArea
                  rows={4}
                  value={content.footer?.blurb || ''}
                  onChange={(e) => patch('footer', { ...content.footer, blurb: e.target.value })}
                />
              </Field>
            </div>
          </SectionPanel>
        );

      default:
        return null;
    }
  };

  const tabItems = [
    {
      key: 'configure',
      label: 'Configure',
      children: (
        <div className="vle-layout">
          <div className="vle-section-nav-wrap">
            <Select
              className="vle-section-nav-select"
              value={activeSection}
              onChange={(key: SectionKey) => setActiveSection(key)}
              aria-label="Landing sections"
              options={SECTIONS.map((section) => {
                const enabled = sectionEnabled(content, section.key);
                const hasError = Boolean(sectionErrors[section.key]);
                const suffix =
                  hasError ? ' (!)' : enabled === false ? ' (Off)' : '';
                return {
                  value: section.key,
                  label: `${section.label}${suffix}`,
                };
              })}
            />
            <nav className="vle-section-nav" aria-label="Landing sections">
              {SECTIONS.map((section) => {
                const enabled = sectionEnabled(content, section.key);
                const isActive = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    type="button"
                    className={`vle-section-nav-btn${isActive ? ' is-active' : ''}`}
                    onClick={() => setActiveSection(section.key)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{section.label}</span>
                    {sectionErrors[section.key] ? (
                      <span className="vle-section-error" title={sectionErrors[section.key]}>
                        !
                      </span>
                    ) : null}
                    {enabled === false ? <span className="vle-section-off">Off</span> : null}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="vle-section-editor">{renderActiveEditor()}</div>
        </div>
      ),
    },
    {
      key: 'preview',
      label: 'Preview',
      children: (
        <div className="vle-preview-tab">
          <div className="vle-preview-frame vle-preview-frame--full">
            <div className="vle-preview-inner">
              <ChurchFeed previewContent={content} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="landing-admin vle-page">
      <div className="landing-admin-header">
        <div>
          <h2>Landing Page</h2>
          <p>Edit homepage sections and preview the live page.</p>
        </div>
      </div>

      <Tabs
        defaultActiveKey="configure"
        tabBarExtraContent={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving || loading}
            disabled={!dirty}
            onClick={save}
          >
            Save
          </Button>
        }
        items={tabItems}
      />
    </div>
  );
};

const LandingPageManager = () => (
  <PermissionGate permission="website.manage" pageLabel="Landing Page">
    <LandingPageManagerContent />
  </PermissionGate>
);

export default LandingPageManager;
