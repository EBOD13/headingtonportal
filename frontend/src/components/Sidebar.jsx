// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch} from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { useOverlays } from '../overlays/OverlayProvider';
import './Sidebar.css';

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  CheckIn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  CheckOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  UserPlus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Flag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

// ============================================================================
// Sidebar Item Component
// ============================================================================

const SidebarItem = ({ Icon, text, onClick, to, isActive, badge }) => {
  const content = (
    <>
      <span className="sidebar-icon">
        <Icon />
      </span>
      <span className="sidebar-label">{text}</span>
      {badge && <span className="sidebar-badge">{badge}</span>}
    </>
  );

  if (to) {
    return (
      <li className={`sidebar-item ${isActive ? 'active' : ''}`}>
        <Link to={to} className="sidebar-link">
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className={`sidebar-item ${isActive ? 'active' : ''}`}>
      <button onClick={onClick} className="sidebar-btn">
        {content}
      </button>
    </li>
  );
};

// ============================================================================
// Sidebar Component
// ============================================================================

const Sidebar = ({
  isOpen = false,
  onClose = () => {},
  customNavItems = null,
  showUserProfile = true,
  showLogo = true,
  showQuickAccess = true,
  brandName = 'Headington',
  brandSubtitle = 'Hall',
  className = '',
  onLogout = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Global overlay controls from context
  const { openCheckIn, openCheckOut, openAddGuest } = useOverlays();

  const currentPath = location.pathname;

  const defaultNavItems = [
    {
      type: 'section',
      title: 'Main Navigation',
      items: [
        { Icon: Icons.Dashboard, text: 'Dashboard', to: '/' },
        { Icon: Icons.Users, text: 'Residents', to: '/residents' },
        { Icon: Icons.Users, text: 'Guests', to: '/guests' },
        { Icon: Icons.BarChart, text: 'Analytics', to: '/analytics' },
      ],
    },
    {
      type: 'section',
      title: 'Quick Access',
      items: showQuickAccess
        ? [
            { Icon: Icons.CheckIn, text: 'Check In', onClick: openCheckIn },
            { Icon: Icons.CheckOut, text: 'Check Out', onClick: openCheckOut },
            { Icon: Icons.UserPlus, text: 'New Guest', onClick: openAddGuest },
          ]
        : [],
    },
    {
      type: 'section',
      title: 'System',
      items: [{ Icon: Icons.Settings, text: 'Settings', to: '/settings' }],
    },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
      dispatch(reset());
      navigate('/login');
    }
  };

  const navItems = customNavItems || defaultNavItems;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-label="Close sidebar"
      />

      {/* Sidebar */}
      <aside
        className={`sidebar light ${isOpen ? 'open' : ''} ${className}`}
        style={{ backgroundColor: '#ffffff' }}   // ⬅️ FORCE WHITE
      >
        {showLogo && (
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="sidebar-logo">
                <div className="sidebar-logo-inner">HH</div>
              </div>
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">{brandName}</span>
                <span className="sidebar-brand-subtitle">{brandSubtitle}</span>
              </div>
            </div>
            <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
              <Icons.X />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((section, sectionIndex) => {
            if (!section.items || section.items.length === 0) return null;

            return (
              <div key={sectionIndex} className="sidebar-section">
                {section.title && (
                  <span className="sidebar-section-title">{section.title}</span>
                )}
                <ul className="sidebar-list">
                  {section.items.map((item, itemIndex) => (
                    <SidebarItem
                      key={itemIndex}
                      Icon={item.Icon}
                      text={item.text}
                      to={item.to}
                      onClick={item.onClick}
                      isActive={item.to ? item.to === currentPath : false}
                      badge={item.badge}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer with logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <Icons.LogOut />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// ============================================================================
// Sidebar Toggle Component
// ============================================================================

export const SidebarToggle = ({ onClick, isOpen = false }) => (
  <button
    className="sidebar-toggle"
    onClick={onClick}
    aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
  >
    {isOpen ? <Icons.X /> : <Icons.Menu />}
  </button>
);

// ============================================================================
// Sidebar Layout
// ============================================================================

export const SidebarLayout = ({ children, sidebarProps = {} }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="sidebar-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        {...sidebarProps}
      />
      <div className="sidebar-content">{children}</div>
    </div>
  );
};

// ============================================================================
// useSidebar hook
// ============================================================================

export const useSidebar = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
    Sidebar: (props) => (
      <Sidebar
        isOpen={isOpen}
        onClose={close}
        {...props}
      />
    ),
    SidebarToggle: () => (
      <SidebarToggle onClick={toggle} isOpen={isOpen} />
    ),
  };
};

export default Sidebar;
