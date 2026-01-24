// frontend/src/components/AppShell.jsx
import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import CheckInForm from './CheckInForm';
import CheckOutForm from './CheckOutForm';
import AddNewGuest from './AddNewGuest';
import './AppShell.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================
import {
  Menu,
  X,
  Home,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  UserPlus,
  Shield,
  Bell,
  Search,
  ShieldUser,
} from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';

const Icons = {
  Menu,
  X,
  Home,
  Users,
  Guests: UserCheck,
  Analytics: BarChart3,
  Settings,
  LogOut,
  AddGuest: UserPlus,
  Admin: Shield,
  Bell,
  Search,
  ShieldUser,
};

// ============================================================================
// Route Configuration - Maps paths to page titles
// ============================================================================
const PAGE_CONFIG = {
  '/': { title: 'Dashboard', icon: Icons.Home },
  '/dashboard': { title: 'Dashboard', icon: Icons.Home },
  '/residents': { title: 'Residents', icon: Icons.Users },
  '/guests': { title: 'Guests', icon: Icons.Guests },
  '/analytics': { title: 'Analytics', icon: Icons.Analytics },
  '/settings': { title: 'Settings', icon: Icons.Settings },
  '/admin': { title: 'Admin', icon: Icons.Admin },
  // ⭐ NEW: make header nice for the Clerk admin screen
  '/admin/clerks': { title: 'Clerks', icon: Icons.ShieldUser },
};

// ============================================================================
// Contexts
// ============================================================================

// Modal Context - allows child components to open modals
const ModalContext = createContext(null);

export const useAppShellModals = () => {
  const context = useContext(ModalContext);
  if (!context) {
    console.warn('useAppShellModals must be used within AppShell');
    return {
      openAddNewGuest: () => {},
      openCheckIn: () => {},
      openCheckOut: () => {},
    };
  }
  return context;
};

// Header Context - allows pages to customize header
const HeaderContext = createContext(null);

export const useAppShellHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    console.warn('useAppShellHeader must be used within AppShell');
    return {
      setHeaderConfig: () => {},
      setHeaderActions: () => {},
    };
  }
  return context;
};

// ============================================================================
// Header Component
// ============================================================================
const AppShellHeader = ({
  title,
  subtitle,
  onMenuClick,
  headerActions,
  showSearch,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}) => {
  return (
    <header className="app-shell-header">
      <div className="app-shell-header-left">
        <button
          className="app-shell-menu-btn"
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Icons.Menu size={20} />
        </button>
        <div className="app-shell-header-title">
          <h1>{title}</h1>
          {subtitle && (
            <span className="app-shell-header-subtitle">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="app-shell-header-right">
        {/* Search box - shown if enabled */}
        {showSearch && (
          <div className="app-shell-search">
            <Icons.Search size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder || 'Search...'}
              value={searchValue || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            {searchValue && (
              <button
                className="app-shell-search-clear"
                onClick={() => onSearchChange?.('')}
                type="button"
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Custom header actions from page */}
        {headerActions}

        {/* Default notification bell */}
        <button className="app-shell-icon-btn" type="button">
          <Icons.Bell size={20} />
        </button>
      </div>
    </header>
  );
};

// ============================================================================
// Main Component
// ============================================================================
const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [showAddNewGuest, setShowAddNewGuest] = useState(false);
  const [addNewGuestData, setAddNewGuestData] = useState({
    room: '',
    hostId: '',
    hostName: '',
  });

  // Header customization state
  const [headerConfig, setHeaderConfig] = useState({});
  const [headerActions, setHeaderActions] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { clerk } = useSelector((state) => state.auth);
  const isAdmin = useIsAdmin();

  // Get current page config based on route
  const currentPageConfig = useMemo(() => {
    const path = location.pathname;
    return PAGE_CONFIG[path] || PAGE_CONFIG['/dashboard'];
  }, [location.pathname]);

  // ⭐ Reset header config when route changes so one screen
  //    doesn't "leak" its custom header into the next one.
  useEffect(() => {
    setHeaderConfig({});
    setHeaderActions(null);
  }, [location.pathname]);

  // Merge default page config with custom header config
  const finalHeaderConfig = useMemo(
    () => ({
      title: headerConfig.title || currentPageConfig.title,
      subtitle:
        headerConfig.subtitle ||
        (clerk?.name ? `Welcome, ${clerk.name}` : ''),
      showSearch: !!headerConfig.showSearch,
      searchValue: headerConfig.searchValue || '',
      onSearchChange: headerConfig.onSearchChange || null,
      searchPlaceholder: headerConfig.searchPlaceholder || 'Search...',
    }),
    [headerConfig, currentPageConfig, clerk]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  }, [dispatch, navigate]);

  const openCheckInOverlay = useCallback(() => {
    setShowCheckIn(true);
    setSidebarOpen(false);
  }, []);

  const openCheckOutOverlay = useCallback(() => {
    setShowCheckOut(true);
    setSidebarOpen(false);
  }, []);

  const openAddNewGuestOverlay = useCallback(() => {
    setShowAddNewGuest(true);
    setSidebarOpen(false);
  }, []);

  const handleOpenAddNewGuest = useCallback((data = {}) => {
    setAddNewGuestData({
      room: data.room || '',
      hostId: data.hostId || '',
      hostName: data.hostName || '',
    });
    setShowAddNewGuest(true);
    setSidebarOpen(false);
  }, []);

  const handleAddNewGuestFromCheckIn = useCallback(
    (data) => {
      setShowCheckIn(false);
      handleOpenAddNewGuest(data);
    },
    [handleOpenAddNewGuest]
  );

  const handleCloseAddNewGuest = useCallback(() => {
    setShowAddNewGuest(false);
    setAddNewGuestData({
      room: '',
      hostId: '',
      hostName: '',
    });
  }, []);

  // Context values
  const modalContextValue = useMemo(
    () => ({
      openAddNewGuest: handleOpenAddNewGuest,
      openCheckIn: openCheckInOverlay,
      openCheckOut: openCheckOutOverlay,
    }),
    [handleOpenAddNewGuest, openCheckInOverlay, openCheckOutOverlay]
  );

  const headerContextValue = useMemo(
    () => ({
      setHeaderConfig,
      setHeaderActions,
    }),
    []
  );

  const navItems = useMemo(() => {
    const base = [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: <Icons.Home size={18} />,
      },
      { to: '/residents', label: 'Residents', icon: <Icons.Users size={18} /> },
      { to: '/guests', label: 'Guests', icon: <Icons.Guests size={18} /> },
      {
        to: '/analytics',
        label: 'Analytics',
        icon: <Icons.Analytics size={18} />,
      },
      {
        to: '/settings',
        label: 'Settings',
        icon: <Icons.Settings size={18} />,
      },
    ];

    if (isAdmin) {
      base.push({
        to: '/admin',
        label: 'Admin',
        icon: <Icons.Admin size={18} />,
      });
      base.push({
        to: '/admin/clerks',
        label: 'Clerks',
        icon: <Icons.ShieldUser size={18} />,
      });
    }

    return base;
  }, [isAdmin]);

  return (
    <ModalContext.Provider value={modalContextValue}>
      <HeaderContext.Provider value={headerContextValue}>
        <div className="app-shell">
          {/* SIDEBAR */}
          <aside
            className={`app-shell-sidebar ${sidebarOpen ? 'open' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-shell-sidebar-header">
              <div className="app-shell-logo">HH</div>
              <div className="app-shell-brand">
                <span>Headington</span>
                <small>Residence Portal</small>
              </div>
              {/* Close button for mobile */}
              <button
                className="app-shell-sidebar-close"
                onClick={closeSidebar}
                type="button"
                aria-label="Close menu"
              >
                <Icons.X size={20} />
              </button>
            </div>

            <nav className="app-shell-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  // 'end' true only for dashboard so nested routes work
                  end={item.to === '/dashboard' || item.to === '/'}
                  className={({ isActive }) =>
                    `app-shell-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <span className="app-shell-nav-icon">{item.icon}</span>
                  <span className="app-shell-nav-label">{item.label}</span>
                </NavLink>
              ))}

              <div className="app-shell-sidebar-actions">
                <button
                  type="button"
                  className="app-shell-action-btn"
                  onClick={openCheckInOverlay}
                >
                  <span className="app-shell-nav-icon">
                    <Icons.Guests size={18} />
                  </span>
                  <span className="app-shell-nav-label">Check-In Guest</span>
                </button>

                <button
                  type="button"
                  className="app-shell-action-btn"
                  onClick={openCheckOutOverlay}
                >
                  <span className="app-shell-nav-icon">
                    <Icons.LogOut size={18} />
                  </span>
                  <span className="app-shell-nav-label">Check-Out Guest</span>
                </button>

                <button
                  type="button"
                  className="app-shell-action-btn"
                  onClick={openAddNewGuestOverlay}
                >
                  <span className="app-shell-nav-icon">
                    <Icons.AddGuest size={18} />
                  </span>
                  <span className="app-shell-nav-label">Add New Guest</span>
                </button>
              </div>
            </nav>

            <div className="app-shell-sidebar-footer">
              <button
                className="app-shell-logout-btn"
                onClick={handleLogout}
                type="button"
              >
                <span className="app-shell-nav-icon">
                  <Icons.LogOut size={18} />
                </span>
                <span className="app-shell-nav-label">Logout</span>
              </button>
            </div>
          </aside>

          {/* MOBILE OVERLAY */}
          <div
            className={`app-shell-overlay ${sidebarOpen ? 'visible' : ''}`}
            onClick={closeSidebar}
          />

          {/* MAIN CONTENT AREA */}
          <div className="app-shell-body">
            {/* Unified Header */}
            <AppShellHeader
              title={finalHeaderConfig.title}
              subtitle={finalHeaderConfig.subtitle}
              onMenuClick={toggleSidebar}
              headerActions={headerActions}
              showSearch={finalHeaderConfig.showSearch}
              searchValue={finalHeaderConfig.searchValue}
              onSearchChange={finalHeaderConfig.onSearchChange}
              searchPlaceholder={finalHeaderConfig.searchPlaceholder}
            />

            {/* Page content */}
            <main className="app-shell-content">{children}</main>
          </div>

          {/* Overlays */}
          {showCheckIn && (
            <CheckInForm
              onClose={() => setShowCheckIn(false)}
              onAddNewGuest={handleAddNewGuestFromCheckIn}
            />
          )}

          {showCheckOut && (
            <CheckOutForm onClose={() => setShowCheckOut(false)} />
          )}

          {showAddNewGuest && (
            <AddNewGuest
              onClose={handleCloseAddNewGuest}
              initialRoom={addNewGuestData.room}
              initialHostId={addNewGuestData.hostId}
              initialHostName={addNewGuestData.hostName}
            />
          )}
        </div>
      </HeaderContext.Provider>
    </ModalContext.Provider>
  );
};

export default AppShell;
