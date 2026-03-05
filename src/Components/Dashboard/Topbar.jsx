import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, ChevronDown, Edit, Save, X, PlusSquare, User, CheckCircle, AlertCircle, RotateCcw, Moon, Sun, Home, Users, Briefcase, Settings as SettingsIcon, HelpCircle, Calendar, BookOpen, FileText } from 'lucide-react';
import { Button, Modal, Card, Typography, Popover, List, Avatar, Badge } from 'antd';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { API_BASE_URL, getUsers, getProfile, getMembers, getMinistries } from '../../services/api';
import { WidgetRegistry } from './WidgetRegistry';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

// Static pages for search
const PAGE_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: 'home', category: 'Pages' },
  { name: 'Manage Members', path: '/members/manage', icon: 'users', category: 'Pages' },
  { name: 'Add Member', path: '/members/add', icon: 'users', category: 'Pages' },
  { name: 'Home Groups', path: '/members/home-groups', icon: 'users', category: 'Pages' },
  { name: 'Manage Ministries', path: '/ministries/manage', icon: 'briefcase', category: 'Pages' },
  { name: 'Add Ministry', path: '/ministries/add', icon: 'briefcase', category: 'Pages' },
  { name: 'Bible Study', path: '/bible-study', icon: 'book', category: 'Pages' },
  { name: 'Schedule Management', path: '/schedule', icon: 'calendar', category: 'Pages' },
  { name: 'Settings', path: '/settings', icon: 'settings', category: 'Pages' },
  { name: 'Help Center', path: '/help', icon: 'help', category: 'Pages' },
  { name: 'Subscription', path: '/subscription', icon: 'file', category: 'Pages' },
];

const getPageIcon = (iconName) => {
  const size = 16;
  switch (iconName) {
    case 'home': return <Home size={size} />;
    case 'users': return <Users size={size} />;
    case 'briefcase': return <Briefcase size={size} />;
    case 'book': return <BookOpen size={size} />;
    case 'calendar': return <Calendar size={size} />;
    case 'settings': return <SettingsIcon size={size} />;
    case 'help': return <HelpCircle size={size} />;
    case 'file': return <FileText size={size} />;
    default: return <FileText size={size} />;
  }
};

const Topbar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Safely consume context
  let dashboardContext = null;
  try {
    dashboardContext = useDashboard();
  } catch (e) { }

  const { isEditMode, toggleEditMode, saveLayout, cancelEdit, addWidget } = dashboardContext || {};
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cachedUsers, setCachedUsers] = useState([]);
  const [cachedMembers, setCachedMembers] = useState([]);
  const [cachedMinistries, setCachedMinistries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch users, members, and ministries for search (cached)
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [users, members, ministries] = await Promise.all([
          user?.role === 'admin' ? getUsers().catch(() => []) : Promise.resolve([]),
          getMembers().catch(() => []),
          getMinistries().catch(() => []),
        ]);
        setCachedUsers(users || []);
        setCachedMembers(members || []);
        setCachedMinistries(ministries || []);
      } catch { }
    };
    fetchSearchData();
  }, [user]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Perform search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search pages
    PAGE_ITEMS.forEach(page => {
      if (page.name.toLowerCase().includes(q)) {
        results.push({
          id: `page-${page.path}`,
          label: page.name,
          sublabel: page.path,
          category: 'Pages',
          icon: getPageIcon(page.icon),
          action: () => navigate(page.path),
        });
      }
    });

    // Search users (admin only)
    if (cachedUsers.length > 0) {
      cachedUsers.forEach(u => {
        const fullName = `${u.first_name || ''} ${u.middle_name || ''} ${u.last_name || ''}`.trim();
        if (
          fullName.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
        ) {
          results.push({
            id: `user-${u.id}`,
            label: fullName,
            sublabel: `${u.email} · ${u.role}`,
            category: 'Users',
            icon: <User size={16} />,
            action: () => navigate('/settings'),
          });
        }
      });
    }

    // Search members
    cachedMembers.forEach(m => {
      const fullName = `${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.trim();
      if (
        fullName.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `member-${m.id}`,
          label: fullName,
          sublabel: `${m.email || m.phone || 'Member'}`,
          category: 'Members',
          icon: <Users size={16} />,
          action: () => navigate(`/members/details/${m.id}`),
        });
      }
    });

    // Search ministries
    cachedMinistries.forEach(min => {
      const leaderName = min.leader ? `${min.leader.first_name} ${min.leader.last_name}` : '';
      if (
        min.name?.toLowerCase().includes(q) ||
        leaderName.toLowerCase().includes(q)
      ) {
        results.push({
          id: `ministry-${min.id}`,
          label: min.name,
          sublabel: leaderName ? `Leader: ${leaderName}` : 'Ministry',
          category: 'Ministries',
          icon: <Briefcase size={16} />,
          action: () => navigate(`/ministries/details/${min.id}`),
        });
      }
    });

    setSearchResults(results.slice(0, 15));
    setIsSearchOpen(results.length > 0);
  }, [cachedUsers, cachedMembers, cachedMinistries, navigate]);

  // Keyboard navigation in results
  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      searchResults[selectedIndex].action();
      setSearchQuery('');
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = (result) => {
    result.action();
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  };

  // Group results by category
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {});

  const handleAddWidget = (type, settings) => {
    if (addWidget) {
      addWidget(type, settings);
      setIsWidgetModalOpen(false);
    }
  };

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
          width={1200}
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
                    pointerEvents: 'none',
                    minHeight: '140px',
                    maxHeight: '140px',
                    background: '#F1F5F9',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    {WidgetComponent ? (
                      <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', width: '133%', height: '133%' }}>
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

        {/* Global Search Bar */}
        <div className="global-search-container" ref={searchRef}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages, users, members..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setIsSearchOpen(searchResults.length > 0); }}
              onKeyDown={handleSearchKeyDown}
            />
            <kbd className="search-shortcut">Ctrl+K</kbd>
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && (
            <div className="search-results-dropdown">
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="search-results-group">
                  <div className="search-results-category">{category}</div>
                  {items.map((result, idx) => {
                    const globalIdx = searchResults.indexOf(result);
                    return (
                      <div
                        key={result.id}
                        className={`search-result-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleResultClick(result)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <span className="search-result-icon">{result.icon}</span>
                        <div className="search-result-text">
                          <span className="search-result-label">{result.label}</span>
                          <span className="search-result-sublabel">{result.sublabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

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

        <div className="logo-wrapper">
          <img src="/Logo-Half-Dark.svg" alt="App Logo" className="topbar-logo" />
        </div>
      </div>
    </div>
  );
};

export default Topbar;