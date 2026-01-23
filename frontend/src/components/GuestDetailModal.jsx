import React, { useEffect } from 'react';
import './GuestDetailModal.css';
import { useGuestActions } from '../hooks/useGuestsQuery';
import { useIsAdmin } from '../hooks/useIsAdmin';

// ============================================================================
// Icons (reusing from ResidentDetailModal)
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
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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
  GraduationCap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  IdCard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
      <rect x="6" y="8" width="2" height="2" />
      <path d="M8 16v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

const formatTimeDuration = (checkIn, checkout) => {
  if (!checkIn) return 'N/A';
  
  const start = new Date(checkIn);
  const end = checkout ? new Date(checkout) : new Date();
  
  if (Number.isNaN(start.getTime())) return 'N/A';
  
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
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

const VisitTimeline = ({ checkIn, checkout }) => {
  const isCurrent = !checkout;
  
  return (
    <div className="visit-timeline">
      <div className="timeline-dot check-in-dot">
        <div className="dot-inner" />
      </div>
      <div className="timeline-line" />
      <div className={`timeline-dot checkout-dot ${isCurrent ? 'current' : ''}`}>
        <div className="dot-inner" />
      </div>
      
      <div className="timeline-labels">
        <div className="timeline-label">
          <span className="label-title">Checked In</span>
          <span className="label-time">{formatDate(checkIn)}</span>
        </div>
        <div className="timeline-label">
          <span className="label-title">
            {isCurrent ? 'Current Stay' : 'Checked Out'}
          </span>
          <span className="label-time">
            {isCurrent ? 'Currently here' : formatDate(checkout)}
          </span>
        </div>
      </div>
      
      <div className="visit-duration">
        <Icons.Clock />
        <span>{formatTimeDuration(checkIn, checkout)}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const GuestDetailModal = ({ guest, onClose, onCheckoutSuccess }) => {
  const { checkOut, isLoading: isActionLoading } = useGuestActions();
  const isAdmin = useIsAdmin();
  
  // Handle checkout
    const handleCheckout = async () => {
    const guestId = guest.id || guest._id;  
    if (!guestId) return;

    try {
      await checkOut(guestId);
      if (onCheckoutSuccess) {
        onCheckoutSuccess(guestId);
      }
      onClose();
    } catch (error) {
      console.error('[GuestDetailModal] Checkout error:', error);
    }
  };

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

  if (!guest) return null;

  const isCheckedIn = guest.isCheckedIn === true;
  const isOUStudent = guest.studentAtOU === true;
  const isFlagged = guest.flagged === true;
  const wing = guest.wing || (guest.room?.charAt(0).toUpperCase() === 'S' ? 'South' : 'North');

  return (
    <div className="modal-overlay guest-modal-overlay" onClick={onClose}>
      <div className="modal-container guest-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        {/* {isAdmin && (
      <span className="admin-view-pill">
        Admin · Can see all guest stats
      </span>
    )} */}
        <div className="modal-header guest-modal-header">
          <div className="modal-guest-info">
            <div className={`modal-avatar guest-avatar ${isFlagged ? 'flagged' : ''}`}>
              {getInitials(guest.name)}
              {isFlagged && (
                <span className="avatar-flag-indicator">
                  <Icons.AlertTriangle />
                </span>
              )}
            </div>
            <div className="modal-title">
              <h2>{capitalize(guest.name)}</h2>
              <span className="modal-status">
                {isCheckedIn ? (
                  <span className="status-badge checked-in">
                    <Icons.CheckCircle />
                    Currently Checked In
                  </span>
                ) : (
                  <span className="status-badge checked-out">
                    <Icons.XCircle />
                    Checked Out
                  </span>
                )}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content guest-modal-content">
          {/* Guest Details */}
          <section className="modal-section">
            <h3>Guest Information</h3>
            <div className="info-grid">
              <InfoItem
                icon={Icons.User}
                label="Full Name"
                value={capitalize(guest.name)}
              />
              <InfoItem
                icon={Icons.Phone}
                label="Contact"
                value={guest.contact}
              />
              <InfoItem
                icon={Icons.IdCard}
                label="ID Number"
                value={guest.IDNumber || 'Not provided'}
              />
              <InfoItem
                icon={Icons.GraduationCap}
                label="OU Student"
                value={isOUStudent ? 'Yes' : 'No'}
              />
            </div>
            
            {isFlagged && (
              <div className="flag-alert">
                <Icons.AlertTriangle />
                <span>This guest has been flagged for attention</span>
              </div>
            )}
          </section>

          {/* Host Information */}
          <section className="modal-section">
            <h3>Host Information</h3>
            <div className="host-info-card">
              <div className="host-avatar">
                {getInitials(guest.hostName || 'Host')}
              </div>
              <div className="host-details">
                <span className="host-name">{capitalize(guest.hostName || 'Resident')}</span>
                <span className="host-room">
                  <Icons.Building />
                  Room {guest.hostRoom || guest.room || 'N/A'} • {wing} Wing
                </span>
              </div>
            </div>
          </section>

          {/* Current Visit */}
          <section className="modal-section">
            <h3>Current Visit</h3>
            {guest.checkIn ? (
              <VisitTimeline checkIn={guest.checkIn} checkout={guest.checkout} />
            ) : (
              <div className="no-visit-data">
                <Icons.Clock />
                <span>No visit data available</span>
              </div>
            )}
          </section>

          {/* Additional Information */}
          <section className="modal-section">
            <h3>Additional Information</h3>
            <div className="info-grid">
              <InfoItem
                icon={Icons.Calendar}
                label="Visit Created"
                value={formatDate(guest.createdAt)}
              />
              <InfoItem
                icon={Icons.MapPin}
                label="Assigned Room"
                value={guest.room || 'N/A'}
              />
              {guest.checkout && (
                <InfoItem
                  icon={Icons.LogOut}
                  label="Last Checkout"
                  value={formatDate(guest.checkout)}
                />
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="modal-footer guest-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          
          {isCheckedIn && (
            <button
              className="btn btn-danger"
              onClick={handleCheckout}
              disabled={isActionLoading}
            >
              <Icons.LogOut />
              {isActionLoading ? 'Processing...' : 'Check Out Guest'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestDetailModal;