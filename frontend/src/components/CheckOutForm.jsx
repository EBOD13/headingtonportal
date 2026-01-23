import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateRow } from '../features/sheets/sheetSlice';
import { useCheckedInGuests, useGuestActions } from '../hooks/useGuestsQuery';
import './CheckOutForm.css';

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
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  ),
};

// ============================================================================
// Sub-components
// ============================================================================
const FormField = ({ icon: Icon, label, children, hint, error, loading = false }) => (
  <div className={`form-field ${error ? 'error' : ''} ${loading ? 'loading' : ''}`}>
    <label className="form-label">
      <div className="label-icon">
        <Icon />
      </div>
      <span>{label}</span>
    </label>
    <div className="field-input">
      {children}
    </div>
    {hint && <div className="field-hint">{hint}</div>}
    {error && <div className="field-error"><Icons.AlertCircle /> {error}</div>}
  </div>
);

const LoadingSpinner = () => (
  <div className="spinner">
    <Icons.Loader />
  </div>
);

// ============================================================================
// Main Component
// ============================================================================
function CheckOutForm({ onClose }) {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const dispatch = useDispatch();
  
  // Use the custom hooks
  const {
    data: checkedInGuests,
    isLoading: isLoadingGuests,
    isError: isErrorGuests,
    error: guestsError,
    refetch: refetchGuests,
  } = useCheckedInGuests();
  
  const { checkOut, isLoading: isActionLoading } = useGuestActions();

  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format checked-in guests for the dropdown
  const guests = checkedInGuests?.map(guest => ({
    id: guest._id,
    name: guest.name,
    hostName: guest.hostName,
    roomNumber: guest.hostRoom,
    checkInTime: guest.checkInTime,
  })) || [];

  const onChange = (e) => {
    const guestId = e.target.value;
    const guest = guests.find(g => g.id === guestId);
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
      // Check out the guest using the hook
      await checkOut(selectedGuest.id);
      
      // Get checkout time
      const now = new Date();
      const checkoutTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Update the Google Sheet
      const sheetResponse = await dispatch(updateRow({
        guestName: selectedGuest.name,
        checkoutTime: checkoutTime
      })).unwrap();
      
      if (sheetResponse.success) {
        toast.success(`${capitalize(selectedGuest.name)} checked out successfully`);
        
        // Refetch the checked-in guests list
        await refetchGuests();
        
        // Close the modal after a brief delay
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

  const closeOverlay = () => {
    if (onClose) onClose();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeOverlay();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeOverlay]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="modal-overlay checkout-overlay" onClick={closeOverlay}>
      <div className="modal-container checkout-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header checkout-header">
          <div className="modal-title">
            <h2>
              <Icons.LogOut />
              Guest Check-Out
            </h2>
            <p className="modal-subtitle">Register a visitor departure</p>
          </div>
          <button className="modal-close" onClick={closeOverlay}>
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="checkout-content">
          <form onSubmit={onSubmit} className="checkout-form">
            {/* Guest Select */}
            <FormField 
              icon={Icons.Users}
              label="Select Guest to Check Out"
              hint={guests.length > 0 ? `${guests.length} guest(s) currently checked in` : 'No guests currently checked in'}
              error={isErrorGuests ? guestsError?.message : null}
              loading={isLoadingGuests}
            >
              <div className="select-wrapper">
                <select
                  name="guest"
                  value={selectedGuest?.id || ''}
                  onChange={onChange}
                  className="guest-select"
                  disabled={guests.length === 0 || isLoadingGuests || isProcessing}
                >
                  <option value="">
                    {isLoadingGuests ? 'Loading guests...' : 
                     guests.length === 0 ? 'No guests checked in' : 
                     'Select a guest'}
                  </option>
                  {guests.map((guest) => (
                    <option value={guest.id} key={guest.id}>
                      {capitalize(guest.name)} • Room {guest.roomNumber} • Host: {guest.hostName}
                      {guest.checkInTime && ` • In: ${guest.checkInTime}`}
                    </option>
                  ))}
                </select>
                {selectedGuest && (
                  <span className="input-status selected">
                    <Icons.Check />
                  </span>
                )}
              </div>
            </FormField>

            {/* Guest Details Display */}
            {selectedGuest && (
              <div className="guest-details-panel">
                <div className="guest-details-header">
                  <h4>Guest Details</h4>
                </div>
                <div className="guest-details-content">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{capitalize(selectedGuest.name)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Room:</span>
                    <span className="detail-value">{selectedGuest.roomNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Host:</span>
                    <span className="detail-value">{capitalize(selectedGuest.hostName)}</span>
                  </div>
                  {selectedGuest.checkInTime && (
                    <div className="detail-row">
                      <span className="detail-label">Check-in Time:</span>
                      <span className="detail-value">{selectedGuest.checkInTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            {(isProcessing || isActionLoading) && (
              <div className="checkout-progress">
                <LoadingSpinner />
                <span>Processing check-out...</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer checkout-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={closeOverlay}
            disabled={isProcessing || isActionLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={!selectedGuest || isProcessing || isActionLoading || guests.length === 0}
          >
            {isProcessing || isActionLoading ? (
              <>
                <LoadingSpinner />
                Processing...
              </>
            ) : (
              <>
                <Icons.LogOut />
                Check-Out Guest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckOutForm;