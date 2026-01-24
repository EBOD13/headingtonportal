// frontend/src/components/Dashboard.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

import GuestDetailModal from './GuestDetailModal';
import { selectActivities } from '../features/activity/activitySlice';
import { useGuests, useCheckedInGuests } from '../hooks/useGuestsQuery';
import { useAppShellHeader } from './AppShell';

import './Dashboard.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================
import {
  Users,
  Activity,
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';

const Icons = {
  Users,
  Activity,
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronRight,
};

// ============================================================================
// Constants
// ============================================================================
const BLUR_TIMEOUT_MS = 60000;

// ============================================================================
// Sub-components
// ============================================================================

const StatsCard = ({ checkedInCount, totalGuestsCount, activitiesCount, noticesCount }) => (
  <div className="stats-card">
    <div className="stats-container">
      <div className="stat-item">
        <div className="stat-label">Checked In</div>
        <div className="stat-value crimson">{checkedInCount}</div>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <div className="stat-label">Total Guests</div>
        <div className="stat-value blue">{totalGuestsCount}</div>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <div className="stat-label">Activities</div>
        <div className="stat-value green">{activitiesCount}</div>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <div className="stat-label">Notices</div>
        <div className="stat-value orange">{noticesCount}</div>
      </div>
    </div>
  </div>
);

const Card = ({ title, icon, children, className = '', headerAction }) => (
  <div className={`card ${className}`}>
    <div className="card-header">
      <div className="card-title">
        {icon}
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
    <Icons.ChevronRight size={16} />
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="empty-state">
    {icon}
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

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return { isBlurred, toggleBlur };
};

// ============================================================================
// Main Component
// ============================================================================

const Dashboard = () => {
  const [notice] = useState([]);
  const { isBlurred, toggleBlur } = useBlurTimer(true);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const activities = useSelector(selectActivities);
  const { clerk } = useSelector((state) => state.auth);

  // Configure the AppShell header
  const { setHeaderConfig } = useAppShellHeader();

  useEffect(() => {
    setHeaderConfig({
      title: 'Dashboard',
      subtitle: clerk?.name ? `Welcome, ${clerk.name}` : '',
    });

    // Cleanup on unmount
    return () => setHeaderConfig({});
  }, [setHeaderConfig, clerk?.name]);

  // Use cached hooks
  const {
    data: allGuests = [],
    isLoading: isLoadingAllGuests,
    refetch: refetchAllGuests,
  } = useGuests();
  
  // Determine "today"
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter guests that have any visit TODAY
  const visitorsToday = allGuests.filter(g => {
    const checkInTime = g.checkIn || g.timeIn || g.createdAt;
    if (!checkInTime) return false;

    const d = new Date(checkInTime);
    return d >= today; 
  });


  const {
    data: checkedInGuests = [],
    isLoading: isLoadingCheckedIn,
    refetch: refetchCheckedIn,
  } = useCheckedInGuests();

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
    refetchCheckedIn();
    refetchAllGuests();
    setSelectedGuest(null);
  }, [refetchCheckedIn, refetchAllGuests]);

  if (isInitialLoading) {
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

  return (
    <div className="dashboard-page">
      {/* Stats Card */}
      <StatsCard
        checkedInCount={checkedInGuests.length}
        totalGuestsCount={visitorsToday.length}
        activitiesCount={activities.length}
        noticesCount={notice.length}
      />

      {/* Main Grid */}
      <section className="dashboard-grid">
        {/* Guests Card */}
        <Card
          title="Guests in Residence"
          icon={<Icons.Users size={18} />}
          className="card-guests"
          headerAction={
            <button className="blur-btn" onClick={toggleBlur} type="button">
              {isBlurred ? <Icons.Eye size={16} /> : <Icons.EyeOff size={16} />}
              <span>{isBlurred ? 'Show' : 'Hide'}</span>
            </button>
          }
        >
          <div className={`guests-list ${isBlurred ? 'blurred' : ''}`}>
            {checkedInGuests.length === 0 ? (
              <EmptyState
                icon={<Icons.Users size={36} />}
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
          icon={<Icons.Activity size={18} />}
          className="card-activity"
        >
          {activities.length === 0 ? (
            <EmptyState
              icon={<Icons.Activity size={36} />}
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
          icon={<Icons.Bell size={18} />}
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
                  <Icons.AlertTriangle size={16} />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Events */}
        <Card
          title="Upcoming Events"
          icon={<Icons.Calendar size={18} />}
          className="card-events"
        >
          <EmptyState
            icon={<Icons.Calendar size={36} />}
            message="No upcoming events"
          />
        </Card>

        {/* Notes */}
        <Card
          title="Quick Notes"
          icon={<Icons.FileText size={18} />}
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
          icon={<Icons.AlertTriangle size={18} />}
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
    </div>
  );
};

export default Dashboard;