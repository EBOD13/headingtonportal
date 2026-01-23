// frontend/src/components/Guests.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

import { useGuests } from '../hooks/useGuestsQuery';
import { useAppShellHeader } from './AppShell';
import GuestDetailModal from './GuestDetailModal';

import './Guests.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================

import {
  User,
  Users,
  Building2,
  Clock,
  LogIn,
  Flag,
  X,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';

const Icons = {
  User,
  Users,
  Building: Building2,
  Clock,
  LogIn,
  Flag,
  X,
  Search,
  Filter,
  Refresh: RefreshCw,
  Loader: Loader2,
  ArrowUpDown,
  AlertCircle,
};

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'room', label: 'Room' },
  { value: 'check-in', label: 'Check-in Status' },
  { value: 'recent', label: 'Recently Updated' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Guests' },
  { value: 'checked-in', label: 'Checked In' },
  { value: 'checked-out', label: 'Checked Out' },
  { value: 'flagged', label: 'Flagged' },
];

// ============================================================================
// Sub-components
// ============================================================================

const LoadingSpinner = () => (
  <div className="guests-loading">
    <div className="spinner">
      <Icons.Loader size={48} />
    </div>
    <p>Loading guests...</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="guests-error">
    <Icons.AlertCircle size={48} />
    <h3>Error Loading Guests</h3>
    <p>{message || 'Failed to load guests'}</p>
    {onRetry && (
      <button className="btn btn-primary" onClick={onRetry} type="button">
        <Icons.Refresh size={16} />
        <span>Try Again</span>
      </button>
    )}
  </div>
);

const ToolbarSection = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  stats,
  totalFiltered,
}) => (
  <div className="guests-toolbar">
    {/* Search */}
    <div className="toolbar-search">
      <div className="search-box">
        <Icons.Search size={18} />
        <input
          type="text"
          placeholder="Search by name, room, or host..."
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
        <label htmlFor="guest-sort-select">
          <Icons.ArrowUpDown size={16} />
          <span className="control-label">Sort</span>
        </label>
        <select
          id="guest-sort-select"
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
        <label htmlFor="guest-filter-select">
          <Icons.Filter size={16} />
          <span className="control-label">Filter</span>
        </label>
        <select
          id="guest-filter-select"
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
          {totalFiltered === stats.total
            ? `${stats.total} guests`
            : `${totalFiltered} of ${stats.total}`}
        </span>
      </div>
    </div>
  </div>
);

const StatsCards = ({ stats }) => (
  <div className="guests-stats">
    <div className="stat-card stat-card--total">
      <div className="stat-icon">
        <Icons.Users size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-value">{stats.total}</span>
        <span className="stat-label">Total Guests</span>
      </div>
    </div>

    <div className="stat-card stat-card--checked-in">
      <div className="stat-icon">
        <Icons.LogIn size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-value">{stats.checkedIn}</span>
        <span className="stat-label">Checked In</span>
      </div>
    </div>

    <div className="stat-card stat-card--flagged">
      <div className="stat-icon">
        <Icons.Flag size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-value">{stats.flagged}</span>
        <span className="stat-label">Flagged</span>
      </div>
    </div>
  </div>
);

const GuestCard = ({ guest, onClick }) => {
  const capitalize = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const name = capitalize(guest.name || '');
  const hostName = capitalize(guest.hostName || 'Unknown host');
  const room = guest.room || guest.hostRoom || '—';
  const wing =
    guest.wing ||
    (room?.[0]?.toUpperCase() === 'S'
      ? 'South'
      : room?.[0]?.toUpperCase() === 'N'
      ? 'North'
      : '');

  return (
    <button
      className="guest-card"
      onClick={() => onClick(guest)}
      type="button"
    >
      <div className="guest-card-header">
        <div className="guest-avatar">
          <Icons.User size={18} />
        </div>
        <div className="guest-name">
          <h3>{name || 'Unnamed Guest'}</h3>
          <span className={`guest-status ${guest.isCheckedIn ? 'checked-in' : 'checked-out'}`}>
            {guest.isCheckedIn ? 'Checked In' : 'Checked Out'}
          </span>
        </div>
        {guest.flagged && (
          <div className="guest-flagged">
            <Icons.Flag size={14} />
          </div>
        )}
      </div>

      <div className="guest-card-body">
        <div className="guest-info-row">
          <Icons.Building size={14} />
          <span>Room {room}</span>
          {wing && <span className="guest-wing">{wing}</span>}
        </div>
        <div className="guest-info-row">
          <Icons.Users size={14} />
          <span>{hostName}</span>
        </div>
      </div>
    </button>
  );
};

const EmptyState = ({ searchTerm, onClearSearch }) => (
  <div className="guests-empty">
    <Icons.Users size={48} />
    <h3>No guests found</h3>
    <p>
      {searchTerm
        ? 'No guests match your search criteria'
        : 'No guests have been registered yet'}
    </p>
    {searchTerm && (
      <button className="btn btn-secondary" onClick={onClearSearch} type="button">
        Clear Search
      </button>
    )}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const Guests = () => {
  const { clerk } = useSelector((state) => state.auth);

  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Configure AppShell header
  const { setHeaderConfig } = useAppShellHeader();

  useEffect(() => {
    setHeaderConfig({
      title: 'Guests',
      subtitle: 'Management',
    });
    return () => setHeaderConfig({});
  }, [setHeaderConfig]);

  const {
    data: guests,
    isLoading,
    isError,
    error,
    refetch,
  } = useGuests({
    onError: (err) => {
      console.error('[Guests] Failed to fetch guests:', err);
      toast.error(err.message || 'Failed to load guests');
    },
  });

  // Stats
  const stats = useMemo(() => {
    if (!guests) return { total: 0, checkedIn: 0, flagged: 0 };
    return {
      total: guests.length,
      checkedIn: guests.filter((g) => g.isCheckedIn).length,
      flagged: guests.filter((g) => g.flagged).length,
    };
  }, [guests]);

  // Filter + sort
  const filteredGuests = useMemo(() => {
    if (!guests || guests.length === 0) return [];

    let filtered = [...guests];

    // Text search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((guest) => {
        const name = guest.name || '';
        const room = guest.room || guest.hostRoom || '';
        const hostName = guest.hostName || '';
        const contact = guest.contact || '';

        return (
          name.toLowerCase().includes(query) ||
          room.toLowerCase().includes(query) ||
          hostName.toLowerCase().includes(query) ||
          contact.toString().includes(query)
        );
      });
    }

    // Apply filter
    switch (filterBy) {
      case 'checked-in':
        filtered = filtered.filter((g) => g.isCheckedIn);
        break;
      case 'checked-out':
        filtered = filtered.filter((g) => !g.isCheckedIn);
        break;
      case 'flagged':
        filtered = filtered.filter((g) => g.flagged);
        break;
      default:
        break;
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'room': {
          const roomA = (a.room || a.hostRoom || '').toString();
          const roomB = (b.room || b.hostRoom || '').toString();
          return roomA.localeCompare(roomB);
        }
        case 'check-in': {
          if (a.isCheckedIn && !b.isCheckedIn) return -1;
          if (!a.isCheckedIn && b.isCheckedIn) return 1;
          return new Date(b.checkIn || 0) - new Date(a.checkIn || 0);
        }
        case 'recent':
          return (
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [guests, searchTerm, filterBy, sortBy]);

  // Handlers
  const handleSearchChange = (value) => setSearchTerm(value);
  const handleSortChange = (value) => setSortBy(value);
  const handleFilterChange = (value) => setFilterBy(value);
  const handleGuestClick = (guest) => setSelectedGuest(guest);
  const handleCloseModal = () => setSelectedGuest(null);

  const handleCheckoutSuccess = () => {
    refetch();
    toast.success('Guest checked out successfully');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="guests-page">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="guests-page">
        <ErrorState
          message={error?.message || 'Failed to load guests'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="guests-page">
      {/* Toolbar */}
      <ToolbarSection
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        stats={stats}
        totalFiltered={filteredGuests.length}
      />

      {/* Main Content */}
      <div className="guests-content">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Guests Grid */}
        <div className="guests-grid-container">
          {filteredGuests.length > 0 ? (
            <div className="guests-grid">
              {filteredGuests.map((guest) => (
                <GuestCard
                  key={guest._id || guest.id}
                  guest={guest}
                  onClick={handleGuestClick}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm('')}
            />
          )}
        </div>
      </div>

      {/* Guest Detail Modal */}
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

export default Guests;