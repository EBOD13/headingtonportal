// frontend/src/components/CheckOutForm.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateRow } from '../features/sheets/sheetSlice';
import { useGuests, useGuestActions } from '../hooks/useGuestsQuery';
import './CheckOutForm.css';

import {
  X,
  LogOut,
  Users,
  AlertCircle,
  Check,
  Loader2,
  Search,
} from 'lucide-react';

// ============================================================================
// Sub-components
// ============================================================================
const LoadingSpinner = () => (
  <div className="checkout-spinner">
    <Loader2 size={18} />
  </div>
);

const GuestCard = ({ guest, isSelected, onToggle, capitalize }) => (
  <button
    type="button"
    className={`guest-card guest-card--compact ${isSelected ? 'selected' : ''}`}
    onClick={() => onToggle(guest)}
  >
    <div className="guest-card-avatar guest-card-avatar--small">
      {(guest.name || '?')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)}
    </div>
    <div className="guest-card-info guest-card-info--tight">
      <span className="guest-card-name">{capitalize(guest.name)}</span>
      <span className="guest-card-room">Room {guest.roomNumber}</span>
    </div>
    {isSelected && (
      <div className="guest-card-check guest-card-check--small">
        <Check size={16} />
      </div>
    )}
  </button>
);

// ============================================================================
// Main Component
// ============================================================================
function CheckOutForm({ onClose }) {
  const [selectedGuests, setSelectedGuests] = useState([]); // ⬅ multi-select
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState(''); // ⬅ search bar

  const dispatch = useDispatch();

  // Use all-guests hook (GET /api/guests) instead of /allguests
  const {
    data: allGuests,
    isLoading: isLoadingGuests,
    isError: isErrorGuests,
    error: guestsError,
    refetch,
  } = useGuests();

  const { checkOut, isLoading: isActionLoading } = useGuestActions();

  const capitalize = useCallback((str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  }, []);

  // Base list: checked-in guests only
  const checkedInGuests = useMemo(() => {
    const base = Array.isArray(allGuests) ? allGuests : [];
    return base
      .filter((g) => g.isCheckedIn === true)
      .map((g) => {
        let checkInTime = null;

        if (g.checkIn) {
          try {
            checkInTime = new Date(g.checkIn).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
          } catch {
            checkInTime = null;
          }
        }

        return {
          id: g.id,
          _id: g._id,
          name: g.name,
          hostName: g.hostName,
          roomNumber: g.hostRoom || g.room || 'N/A',
          checkInTime,
        };
      });
  }, [allGuests]);

  // Filtered by search (name, host, room)
  const guests = useMemo(() => {
    if (!search.trim()) return checkedInGuests;

    const q = search.toLowerCase();
    return checkedInGuests.filter((g) => {
      return (
        g.name?.toLowerCase().includes(q) ||
        g.hostName?.toLowerCase().includes(q) ||
        g.roomNumber?.toLowerCase().includes(q)
      );
    });
  }, [checkedInGuests, search]);

  const isGuestSelected = useCallback(
    (guest) => {
      const gid = guest.id || guest._id;
      return selectedGuests.some(
        (g) => (g.id || g._id) === gid
      );
    },
    [selectedGuests]
  );

  // Toggle multi-select
  const handleToggleGuest = (guest) => {
    const gid = guest.id || guest._id;
    setSelectedGuests((prev) => {
      const exists = prev.some((g) => (g.id || g._id) === gid);
      if (exists) {
        return prev.filter((g) => (g.id || g._id) !== gid);
      }
      return [...prev, guest];
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGuests.length) {
      toast.error('Please select at least one guest to check out');
      return;
    }

    // Resolve and validate IDs for all selected guests
    const selectedWithIds = selectedGuests.map((guest) => {
      const rawId = guest.id ?? guest._id;
      const guestId =
        typeof rawId === 'string' ? rawId : rawId?.toString?.();
      return { guest, guestId };
    });

    const invalid = selectedWithIds.find(
      ({ guestId }) =>
        !guestId || !/^[0-9a-fA-F]{24}$/.test(guestId)
    );

    if (invalid) {
      console.error(
        '[CheckOutForm] Invalid guest ID in selection:',
        invalid
      );
      toast.error(
        'One of the selected guests has an invalid ID. Please refresh and try again.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const checkoutTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Process each selected guest sequentially
      for (const { guest, guestId } of selectedWithIds) {
        await checkOut(guestId);

        try {
          await dispatch(
            updateRow({
              guestName: guest.name,
              checkoutTime,
            })
          ).unwrap();
        } catch (sheetErr) {
          console.error(
            '[CheckOutForm] Sheet update failed for guest:',
            guest,
            sheetErr
          );
          // Don't throw; continue checking out others
        }
      }

      toast.success(
        `Checked out ${selectedGuests.length} guest${
          selectedGuests.length > 1 ? 's' : ''
        }`
      );

      setSelectedGuests([]);
      await refetch();

      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (error) {
      console.error('[CheckOutForm] Error during bulk check-out:', error);
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Failed to check out guest(s)';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeOverlay = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeOverlay();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeOverlay]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const selectedCount = selectedGuests.length;

  return (
    <div className="checkout-overlay" onClick={closeOverlay}>
      <div
        className="checkout-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-title">
            <h2>
              <LogOut size={20} />
              Guest Check-Out
            </h2>
            <p className="checkout-subtitle">
              Select one or more visitors to check out
            </p>
          </div>
          <button
            type="button"
            className="checkout-close"
            onClick={closeOverlay}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="checkout-content">
          {/* Loading State */}
          {isLoadingGuests && (
            <div className="checkout-loading">
              <LoadingSpinner />
              <span>Loading checked-in guests...</span>
            </div>
          )}

          {/* Error State */}
          {isErrorGuests && (
            <div className="checkout-error">
              <AlertCircle size={24} />
              <p>{guestsError?.message || 'Failed to load guests'}</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => refetch()}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingGuests &&
            !isErrorGuests &&
            checkedInGuests.length === 0 && (
              <div className="checkout-empty">
                <Users size={32} />
                <h3>No Guests Checked In</h3>
                <p>
                  There are no guests currently checked in to the
                  building.
                </p>
              </div>
            )}

          {/* Guest List */}
          {!isLoadingGuests &&
            !isErrorGuests &&
            checkedInGuests.length > 0 && (
              <>
                {/* Fixed Toolbar with Search & Count */}
                <div className="checkout-toolbar">
                  <div className="checkout-search">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search by name, host, or room..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="checkout-guest-count">
                    <Users size={16} />
                    <span>
                      {guests.length} guest
                      {guests.length !== 1 ? 's' : ''}
                      {search ? ' found' : ' checked in'}
                    </span>
                  </div>
                </div>

                {/* Guest List Container */}
                <div className="checkout-guest-list-container">
                  <div className="checkout-guest-list">
                    {guests.map((guest) => (
                      <GuestCard
                        key={guest.id || guest._id}
                        guest={guest}
                        isSelected={isGuestSelected(guest)}
                        onToggle={handleToggleGuest}
                        capitalize={capitalize}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

          {/* Processing Indicator */}
          {(isProcessing || isActionLoading) && (
            <div className="checkout-progress">
              <LoadingSpinner />
              <span>Processing check-out...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="checkout-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeOverlay}
            disabled={isProcessing || isActionLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={
              !selectedGuests.length ||
              isProcessing ||
              isActionLoading ||
              checkedInGuests.length === 0
            }
          >
            {isProcessing || isActionLoading ? (
              <>
                <LoadingSpinner />
                Processing...
              </>
            ) : (
              <>
                <LogOut size={18} />
                {selectedCount > 0
                  ? `Check Out ${selectedCount} Guest${
                      selectedCount > 1 ? 's' : ''
                    }`
                  : 'Check Out'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckOutForm;