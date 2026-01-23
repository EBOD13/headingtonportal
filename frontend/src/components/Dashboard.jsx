// frontend/src/components/Dashboard.jsx
import React, {
  useState,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import GuestDetailModal from './GuestDetailModal';
import { selectActivities } from '../features/activity/activitySlice';
import { useGuests, useCheckedInGuests } from '../hooks/useGuestsQuery';

import './Dashboard.css';

// ============================================================================
// Constants
// ============================================================================

const BLUR_TIMEOUT_MS = 60000;

// ============================================================================
// Sub-components
// ============================================================================

const Header = ({ clerkName }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/residents':
        return 'Residents';
      case '/guests':
        return 'Guests';
      case '/analytics':
        return 'Analytics';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title">
          <h1>{getPageTitle()}</h1>
          {clerkName && (
            <span className="header-subtitle">Welcome, {clerkName}</span>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" type="button">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="badge">3</span>
        </button>
      </div>
    </header>
  );
};

// ============================================================================
// Dashboard Content Components
// ============================================================================

const StatCard = ({ Icon, label, value, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{Icon}</div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

const Card = ({ title, Icon, children, className = '', headerAction }) => (
  <div className={`card ${className}`}>
    <div className="card-header">
      <div className="card-title">
        {Icon && Icon}
        <h3>{title}</h3>
      </div>
      {headerAction}
    </div>
    <div className="card-content">{children}</div>
  </div>
);

const GuestItem = ({ guest, capitalize, index, onClick }) => (
  <div
    className="guest-item"
    style={{ animationDelay: `${index * 40}ms` }}
    onClick={() => onClick && onClick(guest)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick && onClick(guest)}
  >
    <div className="guest-avatar">
      {capitalize(guest.name).charAt(0)}
    </div>
    <div className="guest-details">
      <span className="guest-name">{capitalize(guest.name)}</span>
      <span className="guest-room">Room {guest.room}</span>
    </div>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="empty-state">
    {Icon}
    <p>{message}</p>
  </div>
);

// ============================================================================
// Custom Hooks
// ============================================================================

const useBlurTimer = (initialBlurred = true) => {
  const [isBlurred, setIsBlurred] = useState(initialBlurred);
  const timerRef = useRef(null);

  const toggleBlur = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!isBlurred) {
      setIsBlurred(true);
    } else {
      setIsBlurred(false);
      timerRef.current = setTimeout(() => setIsBlurred(true), BLUR_TIMEOUT_MS);
    }
  }, [isBlurred]);

  React.useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return { isBlurred, toggleBlur };
};

// ============================================================================
// Main Dashboard Content Component
// ============================================================================

const MainDashboardContent = () => {
  const [notice] = useState([]); // you can wire this up later if needed
  const { isBlurred, toggleBlur } = useBlurTimer(true);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const activities = useSelector(selectActivities);

  // Use cached hooks instead of local fetch + local isLoading
  const {
    data: allGuests = [],
    isLoading: isLoadingAllGuests,
    refetch: refetchAllGuests,
  } = useGuests();

  const {
    data: checkedInGuests = [],
    isLoading: isLoadingCheckedIn,
    refetch: refetchCheckedIn,
  } = useCheckedInGuests();

  // Initial load: only show the big loader if we have no data yet
  const isInitialLoading =
    (isLoadingAllGuests || isLoadingCheckedIn) &&
    allGuests.length === 0 &&
    checkedInGuests.length === 0;

  const capitalize = useCallback((str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }, []);

  const handleGuestClick = useCallback((guest) => {
    setSelectedGuest(guest);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGuest(null);
  }, []);

  const handleCheckoutSuccess = useCallback(() => {
    // After a successful checkout, just refetch the cached data
    refetchCheckedIn();
    refetchAllGuests();
    setSelectedGuest(null);
  }, [refetchCheckedIn, refetchAllGuests]);

  if (isInitialLoading) {
    // This shows only on the VERY first load (no cached data yet)
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-logo">HH</div>
          <div className="loader-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // OPTIONAL: if you want, you could show a subtle "Refreshing..." badge
  // when isLoadingAllGuests || isLoadingCheckedIn is true,
  // but without hiding the dashboard.

  return (
    <main className="main-content">
      {/* Stats Section */}
      <section className="stats-section">
        <StatCard
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          label="Checked In"
          value={checkedInGuests.length}
          color="crimson"
        />
        <StatCard
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          label="Total Guests"
          value={allGuests.length}
          color="blue"
        />
        <StatCard
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
          label="Activities"
          value={activities.length}
          color="green"
        />
        <StatCard
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          label="Notices"
          value={notice.length}
          color="orange"
        />
      </section>

      {/* Main Grid */}
      <section className="dashboard-grid">
        {/* Guests Card - Large */}
        <Card
          title="Guests in Residence"
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          className="card-guests"
          headerAction={
            <button className="blur-btn" onClick={toggleBlur}>
              {isBlurred ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
              <span>{isBlurred ? 'Show' : 'Hide'}</span>
            </button>
          }
        >
          <div className={`guests-list ${isBlurred ? 'blurred' : ''}`}>
            {checkedInGuests.length === 0 ? (
              <EmptyState
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                message="No guests checked in"
              />
            ) : (
              checkedInGuests.map((guest, i) => (
                <GuestItem
                  key={guest.id || guest._id || i}
                  guest={guest}
                  capitalize={capitalize}
                  index={i}
                  onClick={handleGuestClick}
                />
              ))
            )}
          </div>
        </Card>

        {/* Activity Log */}
        <Card
          title="Activity Log"
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
          className="card-activity"
        >
          {activities.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              message="No recent activity"
            />
          ) : (
            <ul className="activity-list">
              {activities.map((activity, i) => (
                <li key={i} className="activity-item">
                  <span className="activity-dot" />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Notices */}
        <Card
          title="Notices"
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          className="card-notices"
        >
          {notice.length === 0 ? (
            <div className="success-state">
              <span className="success-icon">✓</span>
              <p>All clear! No notices.</p>
            </div>
          ) : (
            <ul className="notice-list">
              {notice.filter(Boolean).map((n, i) => (
                <li key={i} className="notice-item">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Events */}
        <Card
          title="Upcoming Events"
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          className="card-events"
        >
          <EmptyState
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            message="No upcoming events"
          />
        </Card>

        {/* Notes */}
        <Card
          title="Quick Notes"
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          className="card-notes"
        >
          <textarea
            className="notes-textarea"
            placeholder="Write your notes here..."
            rows={6}
          />
        </Card>

        {/* Incidents */}
        <Card
          title="Incidents"
          Icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          className="card-incidents"
        >
          <div className="success-state">
            <span className="success-icon">✓</span>
            <p>No incidents reported</p>
          </div>
        </Card>
      </section>

      {selectedGuest && (
        <GuestDetailModal
          guest={selectedGuest}
          onClose={handleCloseModal}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      )}
    </main>
  );
};

// ============================================================================
// Main Dashboard Component (AppShell-friendly)
// ============================================================================

const Dashboard = () => {
  const { clerk } = useSelector((state) => state.auth);

  return (
    <div className="page dashboard-page">
      <Header clerkName={clerk?.name} />
      <MainDashboardContent />
    </div>
  );
};

export default Dashboard;
