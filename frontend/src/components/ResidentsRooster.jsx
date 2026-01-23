// frontend/src/components/ResidentsRooster.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useResidents } from '../hooks/useResidentsQuery';
import { useAppShellHeader } from './AppShell';

import ResidentDetailModal from './ResidentDetailModal';
import AddNewGuest from './AddNewGuest';

import './ResidentsRooster.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================

import {
  Users,
  Search,
  X,
  MapPin,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Flag,
  Filter,
} from 'lucide-react';

const Icons = {
  Users,
  Search,
  X,
  MapPin,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Flag,
  Filter,
};

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)', icon: SortAsc },
  { value: 'name-desc', label: 'Name (Z-A)', icon: SortDesc },
  { value: 'room-asc', label: 'Room (Low-High)', icon: SortAsc },
  { value: 'room-desc', label: 'Room (High-Low)', icon: SortDesc },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Residents' },
  { value: 'flagged', label: 'Flagged Only' },
  { value: 'not-flagged', label: 'Not Flagged' },
];

// ============================================================================
// Sub-components
// ============================================================================

const ToolbarSection = ({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSortChange,
  filterBy,
  onFilterChange,
  totalCount,
  filteredCount,
}) => (
  <div className="residents-toolbar">
    {/* Search */}
    <div className="toolbar-search">
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
    </div>

    {/* Controls */}
    <div className="toolbar-controls">
      {/* Sort Dropdown */}
      <div className="toolbar-control">
        <label htmlFor="sort-select">
          <Icons.ArrowUpDown size={16} />
          <span className="control-label">Sort</span>
        </label>
        <select 
          id="sort-select"
          value={sortBy} 
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Dropdown */}
      <div className="toolbar-control">
        <label htmlFor="filter-select">
          <Icons.Filter size={16} />
          <span className="control-label">Filter</span>
        </label>
        <select 
          id="filter-select"
          value={filterBy} 
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <div className="toolbar-count">
        <span>
          {filteredCount === totalCount 
            ? `${totalCount} residents` 
            : `${filteredCount} of ${totalCount}`
          }
        </span>
      </div>
    </div>
  </div>
);

const ResidentCard = ({ resident, onClick, index, wingType }) => {
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
    <button
      className={`resident-card ${resident.flagged ? 'flagged' : ''}`}
      onClick={() => onClick(resident)}
      style={{ animationDelay: `${index * 30}ms` }}
      type="button"
    >
      <div className={`resident-avatar ${wingType}`}>
        {getInitials(resident.name)}
      </div>
      <div className="resident-info">
        <span className="resident-name">{capitalize(resident.name)}</span>
        <span className="resident-room">
          <Icons.MapPin size={12} />
          Room {resident.roomNumber}
        </span>
      </div>
      {resident.flagged && <span className="flagged-badge">Flagged</span>}
      <Icons.ChevronRight size={16} className="resident-chevron" />
    </button>
  );
};

const WingSection = ({ title, residents, wingType, onResidentClick, isLoading }) => (
  <div className={`wing-section wing--${wingType}`}>
    <div className="wing-header">
      <h2>{title}</h2>
      <span className={`wing-count wing-count--${wingType}`}>{residents.length}</span>
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
              wingType={wingType}
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
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showAddNewGuest, setShowAddNewGuest] = useState(false);
  const [addNewGuestData, setAddNewGuestData] = useState({
    room: '',
    hostId: '',
    hostName: '',
  });

  const navigate = useNavigate();
  const { clerk } = useSelector((state) => state.auth);

  // Configure the AppShell header
  const { setHeaderConfig } = useAppShellHeader();

  useEffect(() => {
    setHeaderConfig({
      title: 'Residents',
      subtitle: 'Directory',
    });
    return () => setHeaderConfig({});
  }, [setHeaderConfig]);

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
    return Array.isArray(residentsData) ? residentsData : residentsData.data || [];
  }, [residentsData]);

  // Filter residents based on search term and filter option
  const filteredResidents = useMemo(() => {
    let result = residents;

    // Apply text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (resident) =>
          resident.name?.toLowerCase().includes(term) ||
          resident.roomNumber?.toLowerCase().includes(term) ||
          resident.email?.toLowerCase().includes(term)
      );
    }

    // Apply filter
    if (filterBy === 'flagged') {
      result = result.filter((r) => r.flagged);
    } else if (filterBy === 'not-flagged') {
      result = result.filter((r) => !r.flagged);
    }

    return result;
  }, [residents, searchTerm, filterBy]);

  // Sort function
  const sortResidents = useCallback((residentsToSort) => {
    const sorted = [...residentsToSort];
    
    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'room-asc':
        return sorted.sort((a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || ''));
      case 'room-desc':
        return sorted.sort((a, b) => (b.roomNumber || '').localeCompare(a.roomNumber || ''));
      default:
        return sorted;
    }
  }, [sortBy]);

  // Split residents by wing and apply sorting
  const northWingResidents = useMemo(
    () => sortResidents(
      filteredResidents.filter((r) => r.roomNumber?.toUpperCase().startsWith('N'))
    ),
    [filteredResidents, sortResidents]
  );

  const southWingResidents = useMemo(
    () => sortResidents(
      filteredResidents.filter((r) => r.roomNumber?.toUpperCase().startsWith('S'))
    ),
    [filteredResidents, sortResidents]
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

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
  }, []);

  const handleFilterChange = useCallback((value) => {
    setFilterBy(value);
  }, []);

  const handleAddNewGuestFromResident = useCallback((data) => {
    setAddNewGuestData({
      room: data.room || '',
      hostId: data.hostId || '',
      hostName: data.hostName || '',
    });
    setShowAddNewGuest(true);
  }, []);

  const handleCloseAddNewGuest = useCallback(() => {
    setShowAddNewGuest(false);
    setAddNewGuestData({ room: '', hostId: '', hostName: '' });
  }, []);

  // Redirect if not authenticated
  if (!clerk) {
    navigate('/login');
    return null;
  }

  return (
    <div className="residents-page">
      {/* Toolbar with Search, Sort, Filter */}
      <ToolbarSection
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        totalCount={residents.length}
        filteredCount={filteredResidents.length}
      />

      {/* Main Content */}
      <div className="residents-content">
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
      </div>

      {/* Resident Detail Modal */}
      {selectedResident && (
        <ResidentDetailModal
          resident={selectedResident}
          onClose={handleCloseModal}
          onAddNewGuest={handleAddNewGuestFromResident}
        />
      )}

      {/* Add New Guest Modal */}
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