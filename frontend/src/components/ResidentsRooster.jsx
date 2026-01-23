// frontend/src/components/ResidentsRooster.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useResidents } from '../hooks/useResidentsQuery';

import imageList from './ImageGallery';
import ResidentDetailModal from './ResidentDetailModal';
import AddNewGuest from './AddNewGuest';

import './ResidentsRooster.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================

import {
  Users,
  Bell,
  Search,
  X,
  MapPin,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const Icons = {
  Users,
  Bell,
  Search,
  X,
  MapPin,
  ChevronRight,
  AlertCircle,
  RefreshCw,
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
        <div className="header-title">
          <h1>Residents Directory</h1>
        </div>
      </div>
      <div className="header-right">
        <div className="search-box">
          <Icons.Search size={18} />
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
              type="button"
            >
              <Icons.X size={14} />
            </button>
          )}
        </div>
        <button className="icon-btn" type="button">
          <Icons.Bell size={20} />
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
          <Icons.MapPin size={14} />
          Room {resident.roomNumber}
        </span>
      </div>
      {resident.flagged && (
        <span className="flagged-badge">Flagged</span>
      )}
      <Icons.ChevronRight size={18} />
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
          <Icons.Users size={32} />
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
    <Icons.AlertCircle size={48} />
    <h3>Failed to load residents</h3>
    <p>{message}</p>
    <button className="retry-btn" onClick={onRetry} type="button">
      <Icons.RefreshCw size={16} />
      <span>Try Again</span>
    </button>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const ResidentsRooster = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  
  // State for AddNewGuest modal
  const [showAddNewGuest, setShowAddNewGuest] = useState(false);
  const [addNewGuestData, setAddNewGuestData] = useState({
    room: '',
    hostId: '',
    hostName: '',
  });

  const navigate = useNavigate();
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

  // Handler for opening AddNewGuest from ResidentDetailModal
  const handleAddNewGuestFromResident = useCallback((data) => {
    setAddNewGuestData({
      room: data.room || '',
      hostId: data.hostId || '',
      hostName: data.hostName || '',
    });
    setShowAddNewGuest(true);
    // ResidentDetailModal closes itself via onClose
  }, []);

  const handleCloseAddNewGuest = useCallback(() => {
    setShowAddNewGuest(false);
    setAddNewGuestData({
      room: '',
      hostId: '',
      hostName: '',
    });
  }, []);

  // Redirect if not authenticated
  if (!clerk) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page residents-page">
      {/* Page header */}
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

      {/* Resident Detail Modal */}
      {selectedResident && (
        <ResidentDetailModal
          resident={selectedResident}
          onClose={handleCloseModal}
          onAddNewGuest={handleAddNewGuestFromResident}
        />
      )}

      {/* Add New Guest Modal - opened from ResidentDetailModal */}
      {showAddNewGuest && (
        <AddNewGuest
          onClose={handleCloseAddNewGuest}
          initialRoom={addNewGuestData.room}
          initialHostId={addNewGuestData.hostId}
          initialHostName={addNewGuestData.hostName}
        />
      )}
    </div>
  );
};

export default ResidentsRooster;