'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Edit, Save, X, PlusSquare, RotateCcw } from 'lucide-react';
import { Button, Modal, Card } from 'antd';
import { useDashboard } from '@/context/DashboardContext';
import { WidgetRegistry, type WidgetType } from '@/Components/Dashboard/WidgetRegistry';
import './DashboardToolbar.css';

const WIDGET_OPTIONS: { type: WidgetType; label: string; settings: Record<string, unknown> }[] = [
  { type: 'stats', label: 'Stats Card (Generic)', settings: { title: 'New Stat', amount: '0', trend: '0%', color: 'blue', icon: 'person' } },
  { type: 'programs', label: 'Upcoming Plans', settings: {} },
  { type: 'todo', label: 'Todo List', settings: {} },
  { type: 'quickActions', label: 'Quick Actions', settings: {} },
  { type: 'calendar', label: 'Calendar', settings: {} },
  { type: 'memberOverview', label: 'Member Overview', settings: { title: 'Total Members', totalLabel: 'Total Members', icon: 'group', metric: 'members' } },
  { type: 'ministers', label: 'Total Ministers', settings: { title: 'Total Ministers', totalLabel: 'Total Ministers', icon: 'church', metric: 'ministers' } },
  { type: 'ministries', label: 'Total Ministries', settings: { title: 'Total Ministries', totalLabel: 'Active Ministries', icon: 'volunteer', metric: 'ministries' } },
  { type: 'attendance', label: 'Attendance Snapshot', settings: {} },
  { type: 'announcements', label: 'Announcements', settings: {} },
  { type: 'time', label: 'Time Widget', settings: {} },
  { type: 'dataAccess', label: 'Data Access', settings: {} },
];

export default function DashboardToolbar() {
  const pathname = usePathname();
  const { isEditMode, toggleEditMode, saveLayout, cancelEdit, addWidget, resetLayout } = useDashboard();
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  // Leave customize mode when navigating away from the dashboard
  useEffect(() => {
    if (pathname !== '/dashboard' && isEditMode) {
      cancelEdit();
    }
  }, [pathname, isEditMode, cancelEdit]);

  if (pathname !== '/dashboard') {
    return null;
  }

  const handleAddWidget = (type: WidgetType, settings: Record<string, unknown>) => {
    addWidget(type, settings);
    setIsWidgetModalOpen(false);
  };

  return (
    <div className="dashboard-toolbar dashboard-toolbar--topbar">
      <div className="dashboard-controls">
        {!isEditMode ? (
          <Button size="small" className="edit-layout-btn" icon={<Edit size={12} />} onClick={toggleEditMode}>
            Customize
          </Button>
        ) : (
          <>
            <Button size="small" type="dashed" danger icon={<RotateCcw size={14} />} onClick={() => resetLayout()}>
              Reset
            </Button>
            <Button size="small" type="dashed" icon={<PlusSquare size={14} />} onClick={() => setIsWidgetModalOpen(true)}>
              Add Widget
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<Save size={14} />}
              onClick={saveLayout}
              style={{ background: '#1E40AF' }}
            >
              Done
            </Button>
            <Button size="small" type="default" icon={<X size={14} />} onClick={cancelEdit}>
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
