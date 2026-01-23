// frontend/src/components/ResidentDetailModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './ResidentDetailModal.css';
import { useGuestsByHost } from '../hooks/useResidentsQuery';
import { useDispatch, useSelector } from 'react-redux';
import { updateResidentStatus } from '../features/residents/residentSlice';
import { toast } from 'react-hot-toast';

// Using lucide-react instead of custom SVG icons
import {
  X,
  User,
  MapPin,
  Mail,
  Phone,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';

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
      <Icon size={18} />
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
            <AlertTriangle size={14} />
            Flagged
          </span>
        )}
      </div>
      <div className="visitor-details">
        <span className="visitor-visits">
          <Clock size={14} />
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
            <CheckCircle size={14} />
            Currently Here
          </span>
        ) : (
          <span className="status checked-out">
            <XCircle size={14} />
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
const ResidentDetailModal = ({ resident, onClose, onAddNewGuest }) => {
  const dispatch = useDispatch();
  const isAdmin = useIsAdmin();

  const hostId = resident?._id;

  // --- Status state for select (derive initial from resident) ---
  const [statusValue, setStatusValue] = useState(resident?.active ? 'active' : 'inactive');

  const [isSavingStatus, setIsSavingStatus] = useState(false);
  useEffect(() => {
  setStatusValue(resident?.active ? 'active' : 'inactive');
}, [resident?.active]);

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

  // Handle Add Visitor click - opens AddNewGuest modal with prefilled data
  const handleAddVisitor = () => {
    if (!onAddNewGuest) {
      console.warn('[ResidentDetailModal] onAddNewGuest callback not provided');
      return;
    }

    onAddNewGuest({
      room: resident.roomNumber,
      hostId: resident._id,
      hostName: resident.name,
    });

    onClose();
  };

  // --- Handle status change ---
  const handleStatusChange = async (e) => {
  const newValue = e.target.value; // 'active' | 'inactive'
  const active = newValue === 'active';
  const id = resident._id || resident.id;

  setStatusValue(newValue);
  setIsSavingStatus(true);

  try {
    await dispatch(
      updateResidentStatus({
        id,
        updates: { active },
      })
    ).unwrap();
  } finally {
    setIsSavingStatus(false);
  }
};

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
            <div className="modal-title-row">

              <h2>{capitalize(resident.name)}</h2>

                <span className="modal-room">
                <MapPin size={16} />
                Room {resident.roomNumber}
                
              </span>
                {isAdmin && (
              <div className="resident-status-wrapper">
                <select
                  id="resident-status-select"
                  className="resident-status-select"
                  value={statusValue}
                  onChange={handleStatusChange}
                  disabled={isSavingStatus}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {isSavingStatus && (
                  <span className="resident-status-saving">
                    Saving...
                  </span>
                )}
              </div>
            )}

              
            

            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Resident Details */}
          <section className="modal-section">
            <h3>Contact Information</h3>
            <div className="info-grid">
              <InfoItem
                icon={User}
                label="Full Name"
                value={capitalize(resident.name)}
              />
              <InfoItem
                icon={MapPin}
                label="Room Number"
                value={resident.roomNumber}
              />
              <InfoItem
                icon={Mail}
                label="Email"
                value={resident.email}
              />
              <InfoItem
                icon={Phone}
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
              <Users size={18} />
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
                  <AlertTriangle size={20} />
                  <p>{visitorErrorMessage}</p>
                </div>
              ) : visitors.length === 0 ? (
                <div className="visitors-empty">
                  <Users size={24} />
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
            onClick={handleAddVisitor}
          >
            <UserPlus size={18} />
            Add Visitor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResidentDetailModal;
