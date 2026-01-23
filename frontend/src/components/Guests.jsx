// frontend/src/components/Guests.jsx
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

import { useGuests } from '../hooks/useGuestsQuery';
import GuestDetailModal from './GuestDetailModal';

import './Guests.css';
import '../components/Sidebar.css';

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
  Bell,
} from 'lucide-react';

// Map to your existing icon "API" so you don't have to change JSX everywhere
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
  Bell,
};

// ============================================================================
// Small Components
// ============================================================================

const LoadingSpinner = () => (
  <div className="page-loading">
    <div className="spinner">
      <Icons.Loader />
    </div>
    <p>Loading guests...</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="page-error">
    <h3>Error Loading Guests</h3>
    <p>{message || 'Failed to load guests'}</p>
    {onRetry && (
      <button className="btn btn-primary" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);

// Header Component for Guests Page
const GuestsHeader = ({ clerkName, onRefresh }) => {
  return (
    <header className="header guests-header">
      <div className="header-left">
        <div className="header-title">
          <h1>
            <Icons.Users />
            Guest Management
          </h1>
          {clerkName && (
            <span className="header-subtitle">Welcome, {clerkName}</span>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" onClick={onRefresh} title="Refresh">
          <Icons.Refresh />
        </button>
        <button className="icon-btn" type="button">
          <Icons.Bell />
          <span className="badge">3</span>
        </button>
      </div>
    </header>
  );
};

// Small, minimal guest card
const GuestCard = ({ guest, onClick }) => {
  const capitalize = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
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
    <div
      className="guest-card"
      onClick={() => onClick(guest)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(guest)}
    >
      <div className="guest-card-header">
        <div className="guest-avatar">
          <Icons.User />
        </div>
        <div className="guest-name">
          <h3>{name || 'Unnamed Guest'}</h3>
          <div
            className={`guest-status ${
              guest.isCheckedIn ? 'checked-in' : 'checked-out'
            }`}
          >
            {guest.isCheckedIn ? 'Checked In' : 'Checked Out'}
          </div>
        </div>
        {guest.flagged && (
          <div className="guest-flagged">
            <Icons.Flag />
          </div>
        )}
      </div>

      <div className="guest-card-body">
        <div className="guest-info-row">
          <Icons.Building />
          <span>Room {room}</span>
          {wing && <span className="guest-wing">{wing}</span>}
        </div>

        <div className="guest-info-row">
          <Icons.Users />
          <span>{hostName}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Guests Component – AppShell-friendly
// ============================================================================

const Guests = () => {
  const { clerk } = useSelector((state) => state.auth);

  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, checked-in, checked-out, flagged
  const [sortBy, setSortBy] = useState('name'); // name, room, check-in, recent

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

  // Stats for the top cards
  const stats = useMemo(() => {
    if (!guests) return { total: 0, checkedIn: 0, flagged: 0 };
    const total = guests.length;
    const checkedIn = guests.filter((g) => g.isCheckedIn).length;
    const flagged = guests.filter((g) => g.flagged).length;
    return { total, checkedIn, flagged };
  }, [guests]);

  // Filter + sort guests for small cards grid
  const filteredGuests = useMemo(() => {
    if (!guests || guests.length === 0) return [];

    let filtered = [...guests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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

    switch (filter) {
      case 'checked-in':
        filtered = filtered.filter((guest) => guest.isCheckedIn);
        break;
      case 'checked-out':
        filtered = filtered.filter((guest) => !guest.isCheckedIn);
        break;
      case 'flagged':
        filtered = filtered.filter((guest) => guest.flagged);
        break;
      default:
        break;
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
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
  }, [guests, searchQuery, filter, sortBy]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleGuestClick = (guest) => setSelectedGuest(guest);
  const handleCloseModal = () => setSelectedGuest(null);

  const handleCheckoutSuccess = () => {
    refetch();
    toast.success('Guest checked out successfully');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Guest list refreshed');
  };

  // Loading / error states inside AppShell main content
  if (isLoading) {
    return (
      <div className="page guests-page">
        <GuestsHeader clerkName={clerk?.name} onRefresh={handleRefresh} />
        <div className="page-content">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page guests-page">
        <GuestsHeader clerkName={clerk?.name} onRefresh={handleRefresh} />
        <div className="page-content">
          <ErrorState
            message={error?.message || 'Failed to load guests'}
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="page guests-page">
      <GuestsHeader clerkName={clerk?.name} onRefresh={handleRefresh} />

      <div className="page-content">
        <div className="guests-container">
          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card-total">
              <div className="stat-icon">
                <Icons.Users />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Guests</div>
              </div>
            </div>

            <div className="stat-card-checked-in">
              <div className="stat-icon">
                <Icons.LogIn />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.checkedIn}</div>
                <div className="stat-label">Checked In</div>
              </div>
            </div>

            <div className="stat-card-flagged">
              <div className="stat-icon">
                <Icons.Flag />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.flagged}</div>
                <div className="stat-label">Flagged</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="guests-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search guests..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <div className="search-icon">
                <Icons.Search />
              </div>
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <Icons.X />
                </button>
              )}
            </div>

            <div className="controls-right">
              <div className="filter-dropdown">
                <Icons.Filter />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Guests</option>
                  <option value="checked-in">Checked In</option>
                  <option value="checked-out">Checked Out</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div className="sort-dropdown">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Sort by Name</option>
                  <option value="room">Sort by Room</option>
                  <option value="check-in">Sort by Check-in</option>
                  <option value="recent">Sort by Recent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guest Cards Grid - Inside Scrollable Container */}
          <div className="guests-grid-scrollable-container">
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
              <div className="no-guests">
                <div className="no-guests-content">
                  <Icons.Users />
                  <h3>No guests found</h3>
                  <p>
                    {searchQuery
                      ? 'No guests match your search criteria'
                      : 'No guests have been registered yet'}
                  </p>
                  {searchQuery && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}
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
      </div>
    </div>
  );
};

export default Guests;
