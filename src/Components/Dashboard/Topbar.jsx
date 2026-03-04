import { useState } from 'react';
import { Search, Bell, ChevronDown, Edit, Save, X, PlusSquare, User, CheckCircle, AlertCircle, RotateCcw, Moon, Sun } from 'lucide-react';
import { Button, Modal, Card, Typography, Popover, List, Avatar, Badge } from 'antd';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { API_BASE_URL } from '../../services/api';
import { WidgetRegistry } from './WidgetRegistry';
import './Topbar.css';

const Topbar = () => {
  const { user } = useUser();
  // Hardcoded date for visual fidelity to image (or dynamic, let's go dynamic but with similar format)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Safely consume context, in case Topbar is used outside DashboardProvider
  let dashboardContext = null;
  try {
    dashboardContext = useDashboard();
  } catch (e) {
    // Ignore if out of context
  }

  const { isEditMode, toggleEditMode, saveLayout, cancelEdit, addWidget } = dashboardContext || {};
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleAddWidget = (type, settings) => {
    if (addWidget) {
      addWidget(type, settings);
      setIsWidgetModalOpen(false);
    }
  };

  // ... (WIDGET_OPTIONS and notifications)



  const WIDGET_OPTIONS = [
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

  const notifications = [
    { id: 1, title: 'New Member Added', desc: 'Sarah Jenkins joined the worship team.', time: '2 mins ago', type: 'success' },
    { id: 2, title: 'Meeting Reminder', desc: 'Elders meeting starts in 1 hour.', time: '1 hour ago', type: 'info' },
    { id: 3, title: 'Donation Received', desc: 'Anonymous donation of $500.', time: '3 hours ago', type: 'success' },
    { id: 4, title: 'System Alert', desc: 'Backup scheduled for tonight.', time: '5 hours ago', type: 'warning' },
  ];

  const notificationContent = (
    <div style={{ width: 300 }}>
      <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>Notifications</div>
      <List
        dataSource={notifications}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: item.type === 'success' ? '#f6ffed' : '#e6f7ff' }} icon={item.type === 'success' ? <CheckCircle size={16} color="#52c41a" /> : <AlertCircle size={16} color="#1890ff" />} />}
              title={<span style={{ fontSize: '14px' }}>{item.title}</span>}
              description={<div style={{ fontSize: '12px' }}>{item.desc} <br /><span style={{ color: '#aaa', fontSize: '10px' }}>{item.time}</span></div>}
            />
          </List.Item>
        )}
      />
      <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Button type="link" size="small">View All</Button>
      </div>
    </div>
  );

  return (
    <div className="topbar-container">
      <div className="greeting-section">
        <h1>Good Afternoon, {user ? user.first_name : 'Loading...'}</h1>
        <p className="date-text">It's {today}</p>
      </div>

      <div className="topbar-actions">
        {/* Edit Mode Controls (Only visible if context exists) */}
        {dashboardContext && (
          <div className="dashboard-controls" style={{ marginRight: '24px', display: 'flex', gap: '8px' }}>
            {!isEditMode ? (
              <Button
                className="edit-layout-btn"
                icon={<Edit size={16} />}
                onClick={toggleEditMode}
              >
                Edit Layout
              </Button>
            ) : (
              <>
                <Button
                  type="dashed"
                  danger
                  icon={<RotateCcw size={16} />}
                  onClick={() => {
                    if (dashboardContext.resetLayout) {
                      dashboardContext.resetLayout();
                      // Optional: Exit edit mode after reset?
                      // toggleEditMode(); 
                    }
                  }}
                >
                  Reset Default
                </Button>
                <Button
                  type="dashed"
                  icon={<PlusSquare size={16} />}
                  onClick={() => setIsWidgetModalOpen(true)}
                >
                  Add Widget
                </Button>
                <Button
                  type="primary"
                  icon={<Save size={16} />}
                  onClick={saveLayout}
                  style={{ background: '#1565c0' }}
                >
                  Save
                </Button>
                <Button
                  type="default"
                  icon={<X size={16} />}
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}



        {/* Add Widget Modal */}
        <Modal
          title="Add Widget"
          open={isWidgetModalOpen}
          onCancel={() => setIsWidgetModalOpen(false)}
          footer={null}
          width={1200} // Wider modal
          centered
          className="add-widget-modal"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '12px' }}>
            {WIDGET_OPTIONS.map((opt, idx) => {
              const WidgetComponent = WidgetRegistry[opt.type];
              return (
                <Card
                  key={idx}
                  hoverable
                  size="small"
                  onClick={() => handleAddWidget(opt.type, opt.settings)}
                  style={{ cursor: 'pointer', background: '#F8FAFC', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}
                  bodyStyle={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{
                    flex: 1,
                    padding: '12px',
                    pointerEvents: 'none', // Disable interaction within preview
                    minHeight: '140px', // Reduced height for elegance
                    maxHeight: '140px', // Enforce height limit
                    background: '#F1F5F9', // Preview bg
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    {WidgetComponent ? (
                      <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', width: '133%', height: '133%' }}> {/* Scaled down more, width adjusted to compensate */}
                        <WidgetComponent settings={opt.settings} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>No Preview</div>
                    )}
                  </div>
                  <div style={{ padding: '12px', borderTop: '1px solid #E2E8F0', background: '#fff', fontWeight: '600', color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {opt.label}
                    <PlusSquare size={16} color="#3B82F6" />
                  </div>
                </Card>
              );
            })}
          </div>
        </Modal>

        <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Popover content={notificationContent} trigger="click" placement="bottomRight" arrow={false}>
          <button className="icon-btn notification-btn">
            <Badge dot offset={[-4, 4]}>
              <Bell size={20} />
            </Badge>
          </button>
        </Popover>

        <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar
            size={40}
            icon={<User />}
            src={user?.avatar_url ? `${API_BASE_URL}/${user.avatar_url.replace(/^\//, '')}?t=${new Date().getTime()}` : null}
            style={{ backgroundColor: '#1565c0', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <img src="/Logo-Half-Dark.svg" alt="App Logo" className="topbar-logo" />
        </div>
      </div>
    </div>
  );
};

export default Topbar;