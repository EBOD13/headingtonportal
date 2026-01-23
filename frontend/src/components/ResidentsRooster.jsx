// frontend/src/components/ResidentsRooster.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useResidents } from '../hooks/useResidentsQuery';

import imageList from './ImageGallery';
import CheckInForm from './CheckInForm';
import CheckOutForm from './CheckOutForm';
import AddNewGuest from './AddNewGuest';
import ResidentDetailModal from './ResidentDetailModal';

import './ResidentsRooster.css';
import '../components/Sidebar.css';

// ============================================================================
// Icons
// ============================================================================

const Icons = {
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
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

// ============================================================================
// Sub-components
// ============================================================================

const ResidentsHeader = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        {/* AppShell handles sidebar toggle; this is just a title */}
        <div className="header-title">
          <h1>Residents Directory</h1>
        </div>
      </div>
      <div className="header-right">
        <div className="search-box">
          <Icons.Search />
          <input
            type="text"
            placeholder="Search by name or room..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => onSearchChange('')}
            >
              <Icons.X />
            </button>
          )}
        </div>
        <button className="icon-btn" type="button">
          <Icons.Bell />
        </button>
        <div className="user-menu">
          <img
            src={imageList['avatar.png']}
            alt="Profile"
            className="user-avatar"
          />
        </div>
      </div>
    </header>
  );
};

const ResidentCard = ({ resident, onClick, index }) => {
  const capitalize = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`resident-card ${resident.flagged ? 'flagged' : ''}`}
      onClick={() => onClick(resident)}
      style={{ animationDelay: `${index * 30}ms` }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(resident)}
    >
      <div className="resident-avatar">
        {getInitials(resident.name)}
      </div>
      <div className="resident-info">
        <span className="resident-name">{capitalize(resident.name)}</span>
        <span className="resident-room">
          <Icons.MapPin />
          Room {resident.roomNumber}
        </span>
      </div>
      {resident.flagged && (
        <span className="flagged-badge">Flagged</span>
      )}
      <Icons.ChevronRight />
    </div>
  );
};

const WingSection = ({
  title,
  residents,
  wingType,
  onResidentClick,
  isLoading,
}) => (
  <div className={`wing-section wing--${wingType}`}>
    <div className="wing-header">
      <h2>{title}</h2>
      <span className="wing-count">{residents.length}</span>
    </div>
    <div className="wing-content">
      {isLoading ? (
        <div className="wing-loading">
          <div className="spinner" />
          <p>Loading residents...</p>
        </div>
      ) : residents.length === 0 ? (
        <div className="wing-empty">
          <Icons.Users />
          <p>No residents in this wing</p>
        </div>
      ) : (
        <div className="residents-list">
          {residents.map((resident, index) => (
            <ResidentCard
              key={resident._id || resident.id || index}
              resident={resident}
              onClick={onResidentClick}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="error-state">
    <Icons.AlertCircle />
    <h3>Failed to load residents</h3>
    <p>{message}</p>
    <button className="retry-btn" onClick={onRetry}>
      <Icons.RefreshCw />
      <span>Try Again</span>
    </button>
  </div>
);

// ============================================================================
// Main Component (AppShell-friendly)
// ============================================================================

const ResidentsRooster = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { clerk } = useSelector((state) => state.auth);

  // React Query hook to fetch residents
  const {
    data: residentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useResidents(clerk?.token, {
    onError: (err) => {
      console.error('Failed to fetch residents:', err);
    },
  });

  // Normalize residents data
  const residents = useMemo(() => {
    if (!residentsData) return [];
    return Array.isArray(residentsData)
      ? residentsData
      : residentsData.data || [];
  }, [residentsData]);

  // Filter residents based on search term
  const filteredResidents = useMemo(() => {
    if (!searchTerm.trim()) return residents;

    const term = searchTerm.toLowerCase();
    return residents.filter(
      (resident) =>
        resident.name?.toLowerCase().includes(term) ||
        resident.roomNumber?.toLowerCase().includes(term) ||
        resident.email?.toLowerCase().includes(term)
    );
  }, [residents, searchTerm]);

  // Split residents by wing
  const northWingResidents = useMemo(
    () =>
      filteredResidents
        .filter((r) => r.roomNumber?.toUpperCase().startsWith('N'))
        .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    [filteredResidents]
  );

  const southWingResidents = useMemo(
    () =>
      filteredResidents
        .filter((r) => r.roomNumber?.toUpperCase().startsWith('S'))
        .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    [filteredResidents]
  );

  // Handlers
  const handleResidentClick = useCallback((resident) => {
    setSelectedResident(resident);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedResident(null);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Redirect if not authenticated (extra safety; ProtectedRoute should already do this)
  if (!clerk) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page residents-page">
      {/* Page header (AppShell already has global chrome) */}
      <ResidentsHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      <main className="main-content">

        {isError ? (
          <ErrorState
            message={error?.message || 'Unable to fetch residents'}
            onRetry={refetch}
          />
        ) : (
          <div className="wings-container">
            <WingSection
              title="North Wing"
              residents={northWingResidents}
              wingType="north"
              onResidentClick={handleResidentClick}
              isLoading={isLoading}
            />

            <div className="wings-divider">
              <div className="divider-line" />
              <span className="divider-text">HH</span>
              <div className="divider-line" />
            </div>

            <WingSection
              title="South Wing"
              residents={southWingResidents}
              wingType="south"
              onResidentClick={handleResidentClick}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>

      {/* Route-based modals */}
      {location.pathname === '/check-in' && (
        <CheckInForm onClose={() => navigate('/residents')} />
      )}
      {location.pathname === '/check-out' && (
        <CheckOutForm onClose={() => navigate('/residents')} />
      )}
      {location.pathname === '/add-guest' && (
        <AddNewGuest onClose={() => navigate('/residents')} />
      )}

      {/* Resident Detail Modal */}
      {selectedResident && (
        <ResidentDetailModal
          resident={selectedResident}
          token={clerk?.token}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ResidentsRooster;
