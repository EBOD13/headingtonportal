// frontend/src/components/ResidentDetailModal.jsx
import React, { useEffect, useMemo } from 'react';
import './ResidentDetailModal.css';
import { useGuestsByHost } from '../hooks/useResidentsQuery';

// ============================================================================
// Icons
// ============================================================================
const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
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
};

// ============================================================================
// Helper Functions
// ============================================================================
const capitalize = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// ============================================================================
// Sub-components
// ============================================================================
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="info-item">
    <div className="info-icon">
      <Icon />
    </div>
    <div className="info-content">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || 'N/A'}</span>
    </div>
  </div>
);

const VisitorCard = ({ visitor }) => (
  <div className={`visitor-card ${visitor.flagged ? 'flagged' : ''}`}>
    <div className="visitor-avatar">
      {getInitials(visitor.name)}
    </div>
    <div className="visitor-info">
      <div className="visitor-header">
        <span className="visitor-name">{capitalize(visitor.name)}</span>
        {visitor.flagged && (
          <span className="visitor-flag">
            <Icons.AlertTriangle />
            Flagged
          </span>
        )}
      </div>
      <div className="visitor-details">
        <span className="visitor-visits">
          <Icons.Clock />
          {visitor.visitCount || 1} visit
          {(visitor.visitCount || 1) !== 1 ? 's' : ''}
        </span>
        {visitor.lastVisit && (
          <span className="visitor-last">
            Last: {formatDate(visitor.lastVisit)}
          </span>
        )}
      </div>
      <div className="visitor-status">
        {visitor.isCheckedIn ? (
          <span className="status checked-in">
            <Icons.CheckCircle />
            Currently Here
          </span>
        ) : (
          <span className="status checked-out">
            <Icons.XCircle />
            Checked Out
          </span>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const ResidentDetailModal = ({ resident, onClose }) => {
  const hostId = resident?._id;

  // Use hook to fetch guests + stats for this host
  const {
    data: guestsForHost,
    stats,
    isLoading: isLoadingVisitors,
    isError: visitorsIsError,
    error: visitorsErrorObj,
  } = useGuestsByHost(hostId, {
    enabled: !!hostId,
    onError: (err) => {
      console.error('[ResidentDetailModal] useGuestsByHost error:', err);
    },
  });

  // Normalize visitors array for UI
  const visitors = useMemo(() => {
    if (!Array.isArray(guestsForHost)) return [];

    return guestsForHost.map((g) => ({
      id: g.id || g._id,
      name: g.name || '',
      flagged: !!g.flagged,
      isCheckedIn:
        typeof g.isCheckedIn === 'boolean' ? g.isCheckedIn : false,
      visitCount: g.visitCount || 1,
      lastVisit: g.lastVisit || g.checkout || g.checkIn || null,
    }));
  }, [guestsForHost]);

  // Prefer backend stats, fall back to client-side
  const totalVisitors =
    stats?.totalVisitors ?? visitors.length;

  const totalVisits =
    stats?.totalVisits ??
    visitors.reduce((sum, v) => sum + (v.visitCount || 1), 0);

  const flaggedVisitors =
    stats?.flaggedVisitors ??
    visitors.filter((v) => v.flagged).length;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!resident) return null;

  const visitorErrorMessage =
    visitorsIsError && visitorsErrorObj
      ? visitorsErrorObj.message
      : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-resident-info">
            <div className="modal-avatar">
              {getInitials(resident.name)}
            </div>
            <div className="modal-title">
              <h2>{capitalize(resident.name)}</h2>
              <span className="modal-room">
                <Icons.MapPin />
                Room {resident.roomNumber}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Resident Details */}
          <section className="modal-section">
            <h3>Contact Information</h3>
            <div className="info-grid">
              <InfoItem
                icon={Icons.User}
                label="Full Name"
                value={capitalize(resident.name)}
              />
              <InfoItem
                icon={Icons.MapPin}
                label="Room Number"
                value={resident.roomNumber}
              />
              <InfoItem
                icon={Icons.Mail}
                label="Email"
                value={resident.email}
              />
              <InfoItem
                icon={Icons.Phone}
                label="Phone"
                value={resident.phoneNumber}
              />
            </div>
          </section>

          {/* Visitor Stats */}
          <section className="modal-section">
            <h3>Visitor Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-number">{totalVisitors}</span>
                <span className="stat-label">Total Visitors</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{totalVisits}</span>
                <span className="stat-label">Total Visits</span>
              </div>
              <div className={`stat-box ${flaggedVisitors > 0 ? 'warning' : ''}`}>
                <span className="stat-number">{flaggedVisitors}</span>
                <span className="stat-label">Flagged</span>
              </div>
            </div>
          </section>

          {/* Visitors List */}
          <section className="modal-section visitors-section">
            <h3>
              <Icons.Users />
              Visitors History
            </h3>
            <div className="visitors-list">
              {isLoadingVisitors ? (
                <div className="visitors-loading">
                  <div className="spinner" />
                  <p>Loading visitors...</p>
                </div>
              ) : visitorErrorMessage ? (
                <div className="visitors-error">
                  <Icons.AlertTriangle />
                  <p>{visitorErrorMessage}</p>
                </div>
              ) : visitors.length === 0 ? (
                <div className="visitors-empty">
                  <Icons.Users />
                  <p>No visitors recorded</p>
                </div>
              ) : (
                visitors.map((visitor) => (
                  <VisitorCard key={visitor.id} visitor={visitor} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            type="button"
            // You can wire this to open AddNewGuest prefilled with this resident as host
            onClick={() => {
              console.log(
                '[ResidentDetailModal] Add Visitor clicked for resident:',
                resident._id
              );
            }}
          >
            <Icons.UserPlus />
            Add Visitor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResidentDetailModal;
