'use client';

import { useState } from 'react';
import { Edit, Save, X, PlusSquare, RotateCcw } from 'lucide-react';
import { Button, Modal, Card } from 'antd';
import { useDashboard } from '@/context/DashboardContext';
import { WidgetRegistry, type WidgetType } from '@/Components/Dashboard/WidgetRegistry';
import './DashboardToolbar.css';

const WIDGET_OPTIONS: { type: WidgetType; label: string; settings: Record<string, unknown> }[] = [
  { type: 'stats', label: 'Stats Card (Generic)', settings: { title: 'New Stat', amount: '0', trend: '0%', color: 'blue', icon: 'person' } },
  { type: 'programs', label: 'Upcoming Programs', settings: {} },
  { type: 'todo', label: 'Todo List', settings: {} },
  { type: 'quickActions', label: 'Quick Actions', settings: {} },
  { type: 'calendar', label: 'Calendar', settings: {} },
  { type: 'memberOverview', label: 'Member Overview', settings: { title: 'New Member Overview', count: '0', totalLabel: 'Total Members', trend: '0%', icon: 'group', data: [{ name: 'Active', value: 0 }, { name: 'Inactive', value: 0 }], legend: ['Active', 'Inactive'] } },
  { type: 'ministers', label: 'Total Ministers', settings: { title: 'Total Ministers', count: '0', totalLabel: 'Total Ministers', trend: '0%', icon: 'church', data: [{ name: 'Licensed', value: 0 }, { name: 'Ordained', value: 0 }], legend: ['Licensed', 'Ordained'] } },
  { type: 'ministries', label: 'Total Ministries', settings: { title: 'Total Ministries', count: '0', totalLabel: 'Active Ministries', trend: '0%', icon: 'volunteer', data: [{ name: 'Active', value: 0 }, { name: 'Hiatus', value: 0 }], legend: ['Active', 'Hiatus'] } },
  { type: 'attendance', label: 'Attendance Snapshot', settings: {} },
  { type: 'announcements', label: 'Announcements', settings: {} },
  { type: 'time', label: 'Time Widget', settings: {} },
  { type: 'dataAccess', label: 'Data Access', settings: {} },
];

export default function DashboardToolbar() {
  const { isEditMode, toggleEditMode, saveLayout, cancelEdit, addWidget, resetLayout } = useDashboard();
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const handleAddWidget = (type: WidgetType, settings: Record<string, unknown>) => {
    addWidget(type, settings);
    setIsWidgetModalOpen(false);
  };

  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-controls">
        {!isEditMode ? (
          <Button className="edit-layout-btn" icon={<Edit size={16} />} onClick={toggleEditMode}>
            Edit Layout
          </Button>
        ) : (
          <>
            <Button type="dashed" danger icon={<RotateCcw size={16} />} onClick={() => resetLayout()}>
              Reset Default
            </Button>
            <Button type="dashed" icon={<PlusSquare size={16} />} onClick={() => setIsWidgetModalOpen(true)}>
              Add Widget
            </Button>
            <Button type="primary" icon={<Save size={16} />} onClick={saveLayout} style={{ background: '#1565c0' }}>
              Save
            </Button>
            <Button type="default" icon={<X size={16} />} onClick={cancelEdit}>
              Cancel
            </Button>
          </>
        )}
      </div>

      <Modal
        title="Add Widget"
        open={isWidgetModalOpen}
        onCancel={() => setIsWidgetModalOpen(false)}
        footer={null}
        width={1200}
        centered
        className="add-widget-modal"
      >
        <div className="widget-picker-grid">
          {WIDGET_OPTIONS.map((opt) => {
            const WidgetComponent = WidgetRegistry[opt.type];
            return (
              <Card
                key={opt.type}
                hoverable
                size="small"
                onClick={() => handleAddWidget(opt.type, opt.settings)}
                className="widget-picker-card"
              >
                <div className="widget-picker-preview">
                  <WidgetComponent settings={opt.settings} />
                </div>
                <div className="widget-picker-label">
                  {opt.label}
                  <PlusSquare size={16} color="#3B82F6" />
                </div>
              </Card>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
