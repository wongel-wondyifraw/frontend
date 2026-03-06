import React from 'react';
import {
  Home,
  BarChart2,
  Users,
  Briefcase,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronDown,
  X,
  Calendar,
  LogOut,
  BookOpen
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useUser();
  const [expanded, setExpanded] = React.useState({});
  const navigate = useNavigate();

  const toggleMenu = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { label: 'Home', icon: <Home size={18} />, path: '/dashboard', type: 'link' },
    {
      label: 'Members',
      icon: <Users size={18} />,
      type: 'dropdown',
      subItems: [
        { label: 'Manage Members', path: '/members/manage' },
        { label: 'Home Groups', path: '/members/home-groups' }
      ]
    },
    {
      label: 'Ministries',
      icon: <Briefcase size={18} />,
      type: 'dropdown',
      subItems: [
        { label: 'Manage Ministries', path: '/ministries/manage' }
      ]
    },
    { label: 'Bible Study', icon: <BookOpen size={18} />, path: '/bible-study', type: 'link' },
    { label: 'Schedule Management', icon: <Calendar size={18} />, path: '/schedule', type: 'link' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
    { label: 'Help Center', icon: <HelpCircle size={18} />, path: '/help' },
  ]

  return (
    <div className="sidebar-container">
      {/* Header Profile */}
      <div className="sidebar-header">
        <div className="sidebar-profile">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={user?.avatar_url ? `${API_BASE_URL}/${user.avatar_url.replace(/^\//, '')}?t=${new Date().getTime()}` : null}
            className="sidebar-profile-img"
            style={{
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--primary-blue)',
              border: '3px solid var(--border-color)'
            }}
          />
          <div className="sidebar-profile-info">
            <h3 className="profile-name">
              {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Loading...'}
            </h3>
            {user && (
              <div className="profile-role-pill">
                {user.role}
              </div>
            )}
            {user?.title && (
              <div className="profile-title-pill">
                {user.title}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div key={index} className="nav-group">
            {item.type === 'link' ? (
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-left">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </div>
              </NavLink>
            ) : (
              // Dropdown Parent
              <>
                <div
                  className={`nav-item dropdown-parent ${expanded[index] ? 'expanded' : ''}`}
                  onClick={() => toggleMenu(index)}
                >
                  <div className="nav-left">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <div className="nav-right">
                    {item.badge && (
                      <span className={`nav-badge ${item.badgeColor || 'gray'}`}>{item.badge}</span>
                    )}
                    <ChevronDown size={14} className={`nav-arrow ${expanded[index] ? 'rotated' : ''}`} />
                  </div>
                </div>

                {/* Submenu */}
                {expanded[index] && (
                  <div className="submenu-container">
                    {item.subItems.map((sub, subIndex) => (
                      <NavLink
                        key={subIndex}
                        to={sub.path}
                        className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer-links">
        {bottomItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className="nav-item footer-item"
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <button
          className="nav-item footer-item danger-item"
          onClick={handleLogout}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex' }}
        >
          <span className="nav-icon"><LogOut size={18} /></span>
          <span className="nav-label">Log Out</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
