'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, Switch, Tabs, Select } from 'antd';
import { message } from '@/lib/app-message';
import { PlusOutlined, DeleteOutlined, SaveOutlined, RightOutlined } from '@ant-design/icons';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { getLandingContent, updateLandingContent } from '@/services/api';
import type {
  LandingDisplayStyle,
  LandingMediaItem,
  LandingPageContent,
  LandingPostItem,
} from '@/types';
import { DEFAULT_LANDING_CONTENT, mergeLandingContent } from '@/lib/landing-defaults';
import { getApiErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm-delete';
import LandingMediaFields from './LandingMediaFields';
import CommunityProjectsManager from './CommunityProjectsManager';
import './LandingPageManager.css';
import { useCan } from '@/Components/auth/Can';

const { TextArea } = Input;

const DISPLAY_OPTIONS: { value: LandingDisplayStyle; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'marquee', label: 'Marquee (auto-scroll)' },
  { value: 'static', label: 'Static' },
  { value: 'feed', label: 'Feed' },
];

const POSTER_OPTIONS = [
  { value: 'navy', label: 'Wave banner (media + swoosh)' },
  { value: 'emerald', label: 'Geometric conference' },
  { value: 'warm', label: 'Wave banner (alt)' },
];

function LinesEditor({
  value,
  onChange,
  placeholder,
}: {
  value?: string[];
  onChange: (lines: string[]) => void;
  placeholder?: string;
}) {
  const text = (value || []).join('\n');
  return (
    <TextArea
      rows={3}
      placeholder={placeholder || 'One line per item'}
      value={text}
      onChange={(e) =>
        onChange(
          e.target.value
            .split('\n')
            .map((l) => l.trimEnd()),
        )
      }
    />
  );
}

function Section({
  title,
  subtitle,
  enabled,
  onEnabledChange,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  enabled?: boolean;
  onEnabledChange?: (v: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="la-section">
      <div className="la-section-head">
        <button
          type="button"
          className="la-section-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <RightOutlined className={`la-section-chevron${open ? ' is-open' : ''}`} />
          <div>
            <h3 className="la-section-title">{title}</h3>
            {subtitle && <p className="la-section-sub">{subtitle}</p>}
          </div>
        </button>
        <div className="la-section-head-actions">
          {onEnabledChange && (
            <Switch
              checked={enabled !== false}
              onChange={onEnabledChange}
            />
          )}
        </div>
      </div>
      <div className={`la-section-body${open ? '' : ' is-collapsed'}`}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="la-label">{label}</span>
      {children}
    </div>
  );
}

function ItemBlock({
  item,
  onChange,
  onRemove,
  showSchedule = false,
}: {
  item: LandingMediaItem;
  onChange: (next: LandingMediaItem) => void;
  onRemove: () => void;
  showSchedule?: boolean;
}) {
  return (
    <div className="la-item">
      <div className="la-item-head">
        <span className="la-item-title">{item.title || 'Untitled item'}</span>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            confirmDelete({
              title: 'Remove this item?',
              content: 'It will be removed when you save the landing page.',
              onOk: onRemove,
            })
          }
        />
      </div>
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
        <div className="la-field-grid la-field-grid--2">
          <Field label="Tag">
            <Input
              value={item.tag || ''}
              onChange={(e) => onChange({ ...item, tag: e.target.value })}
            />
          </Field>
          <Field label="Reference">
            <Input
              value={item.ref || ''}
              onChange={(e) => onChange({ ...item, ref: e.target.value })}
            />
          </Field>
        </div>
        {showSchedule && (
          <div className="la-field-grid la-field-grid--2">
            <Field label="Event date">
              <Input
                value={item.event_date || ''}
                onChange={(e) => onChange({ ...item, event_date: e.target.value })}
                placeholder="e.g. October 28, 2026"
              />
            </Field>
            <Field label="Event time">
              <Input
                value={item.event_time || ''}
                onChange={(e) => onChange({ ...item, event_time: e.target.value })}
                placeholder="e.g. 08:00 PM"
              />
            </Field>
            <Field label="Location">
              <Input
                value={item.location || ''}
                onChange={(e) => onChange({ ...item, location: e.target.value })}
                placeholder="e.g. Main sanctuary"
              />
            </Field>
          </div>
        )}
      </div>
      <div className="la-item-media">
        <div className="la-item-media-label">Media</div>
        <LandingMediaFields
          imageUrl={item.image_url}
          fileUrl={item.file_url}
          fileName={item.file_name}
          videoUrl={item.video_url}
          videoFileUrl={item.video_file_url}
          onChange={(media) => onChange({ ...item, ...media })}
        />
      </div>
    </div>
  );
}

const LandingPageManagerContent = () => {
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canManageProjects = useCan('projects.manage');
  const canManageWebsite = useCan('website.manage');

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
    } catch {
      setContent(DEFAULT_LANDING_CONTENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await updateLandingContent(content);
      message.success('Landing page saved');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to save landing page'));
    } finally {
      setSaving(false);
    }
  };

  const patch = <K extends keyof LandingPageContent>(key: K, value: LandingPageContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const itemsTab = (
    sectionKey: 'about' | 'projects' | 'programs',
    label: string,
    itemConfig: { plural: string; singular: string; subtitle: string; empty: string },
  ) => {
    const section = content[sectionKey] || {};
    const list = section.items || [];
    return (
      <div>
        <Section
          title={label}
          subtitle="Section heading and visibility"
          enabled={section.enabled}
          onEnabledChange={(enabled) => patch(sectionKey, { ...section, enabled })}
        >
          <div className="la-field-grid">
            <Field label="Title">
              <Input
                value={section.title || ''}
                onChange={(e) => patch(sectionKey, { ...section, title: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <TextArea
                rows={2}
                value={section.subtitle || ''}
                onChange={(e) => patch(sectionKey, { ...section, subtitle: e.target.value })}
              />
            </Field>
            <div className="la-field-grid la-field-grid--2">
              <Field label="Display style">
                <Select
                  style={{ width: '100%' }}
                  value={section.display_style || 'grid'}
                  options={DISPLAY_OPTIONS}
                  onChange={(display_style) =>
                    patch(sectionKey, { ...section, display_style })
                  }
                />
              </Field>
              {sectionKey === 'programs' && (
                <Field label="Default poster style">
                  <Select
                    style={{ width: '100%' }}
                    value={content.programs?.default_poster_style || 'navy'}
                    options={POSTER_OPTIONS}
                    onChange={(default_poster_style) =>
                      patch('programs', { ...content.programs, default_poster_style })
                    }
                  />
                </Field>
              )}
            </div>
          </div>
        </Section>

        <Section title={itemConfig.plural} subtitle={itemConfig.subtitle}>
          {list.length === 0 && <p className="la-empty">{itemConfig.empty}</p>}
          {list.map((item, index) => (
            <ItemBlock
              key={index}
              item={item}
              showSchedule={sectionKey === 'programs'}
              onChange={(next) => {
                const items = [...list];
                items[index] = next;
                patch(sectionKey, { ...section, items });
              }}
              onRemove={() => {
                patch(sectionKey, { ...section, items: list.filter((_, i) => i !== index) });
              }}
            />
          ))}
          <div className="la-actions-row">
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                patch(sectionKey, {
                  ...section,
                  items: [...list, { title: `New ${itemConfig.singular.toLowerCase()}`, text: '' }],
                })
              }
            >
              Add {itemConfig.singular.toLowerCase()}
            </Button>
          </div>
        </Section>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'hero',
      label: 'Hero',
      children: (
        <div>
          <Section
            title="Hero content"
            subtitle="Main banner on the homepage"
            enabled={content.hero?.enabled}
            onEnabledChange={(enabled) => patch('hero', { ...content.hero, enabled })}
          >
            <div className="la-field-grid">
              <div className="la-field-grid la-field-grid--2">
                <Field label="Kicker">
                  <Input
                    value={content.hero?.kicker || ''}
                    onChange={(e) => patch('hero', { ...content.hero, kicker: e.target.value })}
                  />
                </Field>
                <Field label="Title">
                  <Input
                    value={content.hero?.title || ''}
                    onChange={(e) => patch('hero', { ...content.hero, title: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Supporting text">
                <TextArea
                  rows={3}
                  value={content.hero?.lede || ''}
                  onChange={(e) => patch('hero', { ...content.hero, lede: e.target.value })}
                />
              </Field>
              <div className="la-field-grid la-field-grid--2">
                <Field label="Verse reference">
                  <Input
                    value={content.hero?.verse_ref || ''}
                    onChange={(e) => patch('hero', { ...content.hero, verse_ref: e.target.value })}
                  />
                </Field>
                <Field label="Verse text">
                  <Input
                    value={content.hero?.verse_text || ''}
                    onChange={(e) => patch('hero', { ...content.hero, verse_text: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Section>
          <Section title="Hero media" subtitle="Background image or video" defaultOpen={false}>
            <LandingMediaFields
              imageUrl={content.hero?.image_url}
              fileUrl={content.hero?.file_url}
              fileName={content.hero?.file_name}
              videoUrl={content.hero?.video_url}
              videoFileUrl={content.hero?.video_file_url}
              onChange={(media) => patch('hero', { ...content.hero, ...media })}
            />
          </Section>
        </div>
      ),
    },
    {
      key: 'about',
      label: 'About',
      children: itemsTab('about', 'About', {
        plural: 'Ministries',
        singular: 'Ministry',
        subtitle: 'Ministries shown in the About section',
        empty: 'No ministries yet.',
      }),
    },
    {
      key: 'vision',
      label: 'Vision',
      children: (
        <div>
          <Section
            title="Vision content"
            enabled={content.vision?.enabled}
            onEnabledChange={(enabled) => patch('vision', { ...content.vision, enabled })}
          >
            <div className="la-field-grid">
              <div className="la-field-grid la-field-grid--2">
                <Field label="Title">
                  <Input
                    value={content.vision?.title || ''}
                    onChange={(e) => patch('vision', { ...content.vision, title: e.target.value })}
                  />
                </Field>
                <Field label="Label">
                  <Input
                    value={content.vision?.label || ''}
                    onChange={(e) => patch('vision', { ...content.vision, label: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Subtitle">
                <TextArea
                  rows={2}
                  value={content.vision?.subtitle || ''}
                  onChange={(e) => patch('vision', { ...content.vision, subtitle: e.target.value })}
                />
              </Field>
              <Field label="Heading">
                <Input
                  value={content.vision?.heading || ''}
                  onChange={(e) => patch('vision', { ...content.vision, heading: e.target.value })}
                />
              </Field>
              <Field label="Body">
                <TextArea
                  rows={3}
                  value={content.vision?.body || ''}
                  onChange={(e) => patch('vision', { ...content.vision, body: e.target.value })}
                />
              </Field>
            </div>
          </Section>
          <Section title="Vision media" subtitle="Image or video for this section" defaultOpen={false}>
            <LandingMediaFields
              imageUrl={content.vision?.image_url}
              fileUrl={content.vision?.file_url}
              fileName={content.vision?.file_name}
              videoUrl={content.vision?.video_url}
              videoFileUrl={content.vision?.video_file_url}
              onChange={(media) => patch('vision', { ...content.vision, ...media })}
            />
          </Section>
        </div>
      ),
    },
    {
      key: 'projects',
      label: 'Homepage projects',
      children: itemsTab('projects', 'Homepage projects', {
        plural: 'Project cards',
        singular: 'Project',
        subtitle: 'Cards shown in the homepage Projects section',
        empty: 'No project cards yet.',
      }),
    },
    {
      key: 'programs',
      label: 'Programs',
      children: itemsTab('programs', 'Programs', {
        plural: 'Programs',
        singular: 'Program',
        subtitle: 'Program cards shown in this section',
        empty: 'No programs yet.',
      }),
    },
    {
      key: 'updates',
      label: 'Updates',
      children: (
        <div>
          <Section
            title="Updates section"
            enabled={content.updates?.enabled}
            onEnabledChange={(enabled) => patch('updates', { ...content.updates, enabled })}
          >
            <div className="la-field-grid">
              <Field label="Title">
                <Input
                  value={content.updates?.title || ''}
                  onChange={(e) => patch('updates', { ...content.updates, title: e.target.value })}
                />
              </Field>
              <Field label="Subtitle">
                <TextArea
                  rows={2}
                  value={content.updates?.subtitle || ''}
                  onChange={(e) =>
                    patch('updates', { ...content.updates, subtitle: e.target.value })
                  }
                />
              </Field>
            </div>
          </Section>
          <Section
            title="Recent programs strip"
            subtitle="Animated programs row shown above update posts"
          >
            <div className="la-field-grid">
              <div className="la-field-grid la-field-grid--2">
                <Field label="Show programs strip">
                  <Switch
                    checked={content.updates?.show_programs_strip !== false}
                    onChange={(show_programs_strip) =>
                      patch('updates', { ...content.updates, show_programs_strip })
                    }
                  />
                </Field>
                <Field label="Strip display style">
                  <Select
                    style={{ width: '100%' }}
                    value={content.updates?.programs_display || 'marquee'}
                    options={DISPLAY_OPTIONS.filter((o) =>
                      ['carousel', 'marquee', 'grid'].includes(o.value),
                    )}
                    onChange={(programs_display) =>
                      patch('updates', { ...content.updates, programs_display })
                    }
                  />
                </Field>
              </div>
              <Field label="Strip title">
                <Input
                  value={content.updates?.programs_strip_title || ''}
                  onChange={(e) =>
                    patch('updates', {
                      ...content.updates,
                      programs_strip_title: e.target.value,
                    })
                  }
                  placeholder="Recent programs"
                />
              </Field>
            </div>
          </Section>
          <Section title="Posts" subtitle="Announcements shown on the homepage">
            {(content.updates?.posts || []).length === 0 && (
              <p className="la-empty">No posts yet.</p>
            )}
            {(content.updates?.posts || []).map((post, index) => (
              <div className="la-item" key={index}>
                <div className="la-item-head">
                  <span className="la-item-title">{post.author || 'Post'}</span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      confirmDelete({
                        title: 'Remove this post?',
                        onOk: () => {
                          const posts = (content.updates?.posts || []).filter(
                            (_, i) => i !== index,
                          );
                          patch('updates', { ...content.updates, posts });
                        },
                      })
                    }
                  />
                </div>
                <div className="la-field-grid">
                  <div className="la-field-grid la-field-grid--2">
                    <Field label="Author">
                      <Input
                        value={post.author}
                        onChange={(e) => {
                          const posts = [...(content.updates?.posts || [])];
                          posts[index] = { ...post, author: e.target.value };
                          patch('updates', { ...content.updates, posts });
                        }}
                      />
                    </Field>
                    <Field label="Time label">
                      <Input
                        value={post.time}
                        onChange={(e) => {
                          const posts = [...(content.updates?.posts || [])];
                          posts[index] = { ...post, time: e.target.value };
                          patch('updates', { ...content.updates, posts });
                        }}
                      />
                    </Field>
                  </div>
                  <Field label="Body">
                    <TextArea
                      rows={2}
                      value={post.body}
                      onChange={(e) => {
                        const posts = [...(content.updates?.posts || [])];
                        posts[index] = { ...post, body: e.target.value };
                        patch('updates', { ...content.updates, posts });
                      }}
                    />
                  </Field>
                </div>
                <div className="la-item-media">
                  <div className="la-item-media-label">Media</div>
                  <LandingMediaFields
                    imageUrl={post.image_url}
                    fileUrl={post.file_url}
                    fileName={post.file_name}
                    videoUrl={post.video_url}
                    videoFileUrl={post.video_file_url}
                    onChange={(media) => {
                      const posts = [...(content.updates?.posts || [])] as LandingPostItem[];
                      posts[index] = { ...post, ...media };
                      patch('updates', { ...content.updates, posts });
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="la-actions-row">
              <Button
                icon={<PlusOutlined />}
                onClick={() =>
                  patch('updates', {
                    ...content.updates,
                    posts: [
                      ...(content.updates?.posts || []),
                      { author: 'Ministry', time: 'Just now', body: '' },
                    ],
                  })
                }
              >
                Add post
              </Button>
            </div>
          </Section>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      children: (
        <div>
          <Section
            title="Contact section"
            enabled={content.contact?.enabled}
            onEnabledChange={(enabled) => patch('contact', { ...content.contact, enabled })}
          >
            <div className="la-field-grid">
              <div className="la-field-grid la-field-grid--2">
                <Field label="Title">
                  <Input
                    value={content.contact?.title || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, title: e.target.value })
                    }
                  />
                </Field>
                <Field label="Visit card title">
                  <Input
                    value={content.contact?.visit_title || ''}
                    onChange={(e) =>
                      patch('contact', { ...content.contact, visit_title: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Subtitle">
                <TextArea
                  rows={2}
                  value={content.contact?.subtitle || ''}
                  onChange={(e) =>
                    patch('contact', { ...content.contact, subtitle: e.target.value })
                  }
                />
              </Field>
              <Field label="Visit lines">
                <LinesEditor
                  value={content.contact?.visit_lines}
                  onChange={(visit_lines) =>
                    patch('contact', { ...content.contact, visit_lines })
                  }
                />
              </Field>
              <Field label="Get in touch title">
                <Input
                  value={content.contact?.touch_title || ''}
                  onChange={(e) =>
                    patch('contact', { ...content.contact, touch_title: e.target.value })
                  }
                />
              </Field>
              <Field label="Get in touch body">
                <TextArea
                  rows={3}
                  value={content.contact?.touch_body || ''}
                  onChange={(e) =>
                    patch('contact', { ...content.contact, touch_body: e.target.value })
                  }
                />
              </Field>
            </div>
          </Section>
        </div>
      ),
    },
    {
      key: 'footer',
      label: 'Footer',
      children: (
        <Section title="Footer" subtitle="Bottom of the public homepage">
          <div className="la-field-grid">
            <Field label="Brand blurb">
              <TextArea
                rows={3}
                value={content.footer?.blurb || ''}
                onChange={(e) => patch('footer', { ...content.footer, blurb: e.target.value })}
              />
            </Field>
            <div className="la-field-grid la-field-grid--2">
              <Field label="Visit lines">
                <LinesEditor
                  value={content.footer?.visit_lines}
                  onChange={(visit_lines) => patch('footer', { ...content.footer, visit_lines })}
                />
              </Field>
              <Field label="Office lines">
                <LinesEditor
                  value={content.footer?.office_lines}
                  onChange={(office_lines) =>
                    patch('footer', { ...content.footer, office_lines })
                  }
                />
              </Field>
            </div>
          </div>
        </Section>
      ),
    },
  ];

  if (canManageProjects || canManageWebsite) {
    tabItems.push({
      key: 'community-projects',
      label: 'Community projects',
      children: <CommunityProjectsManager />,
    });
  }

  const visibleTabs = canManageWebsite
    ? tabItems
    : tabItems.filter((t) => t.key === 'community-projects');

  return (
    <div className="landing-admin">
      <div className="landing-admin-header">
        <div>
          <h2>Landing Page</h2>
          <p>
            {canManageWebsite
              ? 'Edit homepage sections and community projects.'
              : 'Manage community projects shown on /projects.'}
          </p>
        </div>
        {canManageWebsite && (
          <Button type="primary" icon={<SaveOutlined />} loading={saving || loading} onClick={save}>
            Save
          </Button>
        )}
      </div>
      <Tabs items={visibleTabs} />
    </div>
  );
};

const LandingPageManager = () => (
  <PermissionGate
    permission={['website.manage', 'projects.manage']}
    pageLabel="Landing Page"
  >
    <LandingPageManagerContent />
  </PermissionGate>
);

export default LandingPageManager;
