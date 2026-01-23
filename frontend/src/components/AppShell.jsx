// frontend/src/components/AppShell.jsx
import React, { useState, useCallback, createContext, useContext, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
  Home,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  UserPlus,
} from 'lucide-react';

const Icons = {
  Menu,
  Home,
  Users,
  // Use a "checked user" icon to represent Guests/Check-in
  Guests: UserCheck,
  Analytics: BarChart3,
  Settings,
  LogOut,
  AddGuest: UserPlus,
};

// ============================================================================
// Modal Context - allows child components to open AddNewGuest modal
// ============================================================================

const ModalContext = createContext(null);

/**
 * Hook to access the modal context from any child component.
 * Usage:
 *   const { openAddNewGuest } = useAppShellModals();
 *   openAddNewGuest({ room: 'N101', hostId: '123', hostName: 'John Doe' });
 */
export const useAppShellModals = () => {
  const context = useContext(ModalContext);
  if (!context) {
    console.warn('useAppShellModals must be used within AppShell');
    // Return a no-op function to prevent crashes
    return {
      openAddNewGuest: () => {
        console.warn('openAddNewGuest called outside of AppShell context');
      },
    };
  }
  return context;
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

  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const handleAddNewGuestFromCheckIn = useCallback((data) => {
    setShowCheckIn(false);
    handleOpenAddNewGuest(data);
  }, [handleOpenAddNewGuest]);

  const handleCloseAddNewGuest = useCallback(() => {
    setShowAddNewGuest(false);
    setAddNewGuestData({
      room: '',
      hostId: '',
      hostName: '',
    });
  }, []);

  const modalContextValue = useMemo(() => ({
    openAddNewGuest: handleOpenAddNewGuest,
  }), [handleOpenAddNewGuest]);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Icons.Home /> },
    { to: '/residents', label: 'Residents', icon: <Icons.Users /> },
    { to: '/guests', label: 'Guests', icon: <Icons.Guests /> },
    { to: '/analytics', label: 'Analytics', icon: <Icons.Analytics /> },
    { to: '/settings', label: 'Settings', icon: <Icons.Settings /> },
  ];

  return (
    <ModalContext.Provider value={modalContextValue}>
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
          </div>

          <nav className="app-shell-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
                className="app-shell-action-btn primary"
                onClick={openCheckInOverlay}
              >
                <span className="app-shell-nav-icon">
                  <Icons.Guests />
                </span>
                <span className="app-shell-nav-label">Check-In Guest</span>
              </button>

              <button
                type="button"
                className="app-shell-action-btn"
                onClick={openCheckOutOverlay}
              >
                <span className="app-shell-nav-icon">
                  <Icons.LogOut />
                </span>
                <span className="app-shell-nav-label">Check-Out Guest</span>
              </button>

              <button
                type="button"
                className="app-shell-action-btn"
                onClick={openAddNewGuestOverlay}
              >
                <span className="app-shell-nav-icon">
                  <Icons.AddGuest />
                </span>
                <span className="app-shell-nav-label">Add New Guest</span>
              </button>
            </div>
          </nav>

          <div className="app-shell-sidebar-footer">
            <button className="app-shell-logout-btn" onClick={handleLogout}>
              <span className="app-shell-nav-icon">
                <Icons.LogOut />
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
          <button
            className="app-shell-hamburger"
            type="button"
            onClick={toggleSidebar}
          >
            <Icons.Menu />
          </button>

          <main className="app-shell-content app-shell-page">
            {children}
          </main>
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
    </ModalContext.Provider>
  );
};

export default AppShell;