// frontend/src/components/CheckOutForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateRow } from '../features/sheets/sheetSlice';
import { useCheckedInGuests, useGuestActions } from '../hooks/useGuestsQuery';
import './CheckOutForm.css';

import {
  X,
  LogOut,
  Users,
  AlertCircle,
  Check,
  Loader2,
  User,
  MapPin,
  Clock,
  Home,
} from 'lucide-react';

// ============================================================================
// Sub-components
// ============================================================================
const LoadingSpinner = () => (
  <div className="checkout-spinner">
    <Loader2 size={18} />
  </div>
);

const GuestCard = ({ guest, isSelected, onSelect, capitalize }) => (
  <button
    type="button"
    className={`guest-card ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(guest)}
  >
    <div className="guest-card-avatar">
      {(guest.name || '?')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)}
    </div>
    <div className="guest-card-info">
      <span className="guest-card-name">{capitalize(guest.name)}</span>
      <span className="guest-card-meta">
        <Home size={12} />
        Room {guest.roomNumber}
      </span>
      <span className="guest-card-meta">
        <User size={12} />
        Host: {capitalize(guest.hostName)}
      </span>
      {guest.checkInTime && (
        <span className="guest-card-meta">
          <Clock size={12} />
          Checked in: {guest.checkInTime}
        </span>
      )}
    </div>
    {isSelected && (
      <div className="guest-card-check">
        <Check size={18} />
      </div>
    )}
  </button>
);

// ============================================================================
// Main Component
// ============================================================================
function CheckOutForm({ onClose }) {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dispatch = useDispatch();

  const {
    data: checkedInGuests,
    isLoading: isLoadingGuests,
    isError: isErrorGuests,
    error: guestsError,
    refetch: refetchGuests,
  } = useCheckedInGuests();

  const { checkOut, isLoading: isActionLoading } = useGuestActions();

  const capitalize = useCallback((str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  const guests =
    checkedInGuests?.map((guest) => ({
      id: guest._id,
      name: guest.name,
      hostName: guest.hostName,
      roomNumber: guest.hostRoom,
      checkInTime: guest.checkInTime,
    })) || [];

  const handleSelectGuest = (guest) => {
    setSelectedGuest(guest);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGuest) {
      toast.error('Please select a guest to check out');
      return;
    }

    setIsProcessing(true);

    try {
      await checkOut(selectedGuest.id);

      const now = new Date();
      const checkoutTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const sheetResponse = await dispatch(
        updateRow({
          guestName: selectedGuest.name,
          checkoutTime: checkoutTime,
        })
      ).unwrap();

      if (sheetResponse.success) {
        toast.success(
          `${capitalize(selectedGuest.name)} checked out successfully`
        );
        await refetchGuests();

        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      } else {
        throw new Error('Failed to update sheet');
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      toast.error(error.message || 'Failed to check out guest');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeOverlay = useCallback(() => {
    if (onClose) onClose();
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

  return (
    <div className="checkout-overlay" onClick={closeOverlay}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-title">
            <h2>
              <LogOut size={20} />
              Guest Check-Out
            </h2>
            <p className="checkout-subtitle">Select a visitor to check out</p>
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
                onClick={() => refetchGuests()}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingGuests && !isErrorGuests && guests.length === 0 && (
            <div className="checkout-empty">
              <Users size={32} />
              <h3>No Guests Checked In</h3>
              <p>There are no guests currently checked in to the building.</p>
            </div>
          )}

          {/* Guest List */}
          {!isLoadingGuests && !isErrorGuests && guests.length > 0 && (
            <>
              <div className="checkout-guest-count">
                <Users size={16} />
                <span>
                  {guests.length} guest{guests.length !== 1 ? 's' : ''} currently
                  checked in
                </span>
              </div>

              <div className="checkout-guest-list">
                {guests.map((guest) => (
                  <GuestCard
                    key={guest.id}
                    guest={guest}
                    isSelected={selectedGuest?.id === guest.id}
                    onSelect={handleSelectGuest}
                    capitalize={capitalize}
                  />
                ))}
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
              !selectedGuest ||
              isProcessing ||
              isActionLoading ||
              guests.length === 0
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
                Check Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckOutForm;