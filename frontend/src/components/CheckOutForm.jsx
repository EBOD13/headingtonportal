// frontend/src/components/CheckOutForm.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateRow } from '../features/sheets/sheetSlice';
import { useCheckedInGuests, useGuestActions } from '../hooks/useGuestsQuery';
import './CheckOutForm.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================
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
} from 'lucide-react';

const Icons = {
  X,
  LogOut,
  Users,
  AlertCircle,
  Check,
  Loader: Loader2,
  User,
  MapPin,
  Clock,
};

// ============================================================================
// Sub-components
// ============================================================================
const FormField = ({ icon: Icon, label, children, hint, error, loading = false }) => (
  <div className={`form-field ${error ? 'error' : ''} ${loading ? 'loading' : ''}`}>
    <label className="form-label">
      <div className="label-icon">
        <Icon size={16} />
      </div>
      <span>{label}</span>
    </label>
    <div className="field-input">
      {children}
    </div>
    {hint && <div className="field-hint">{hint}</div>}
    {error && (
      <div className="field-error">
        <Icons.AlertCircle size={14} /> {error}
      </div>
    )}
  </div>
);

const LoadingSpinner = () => (
  <div className="spinner">
    <Icons.Loader size={18} />
  </div>
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

  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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
      await checkOut(selectedGuest.id);
      
      const now = new Date();
      const checkoutTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const sheetResponse = await dispatch(updateRow({
        guestName: selectedGuest.name,
        checkoutTime: checkoutTime
      })).unwrap();
      
      if (sheetResponse.success) {
        toast.success(`${capitalize(selectedGuest.name)} checked out successfully`);
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

  const closeOverlay = () => {
    if (onClose) onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeOverlay();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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
              <Icons.LogOut size={20} />
              Guest Check-Out
            </h2>
            <p className="modal-subtitle">Register a visitor departure</p>
          </div>
          <button className="modal-close" onClick={closeOverlay}>
            <Icons.X size={18} />
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
                      {capitalize(guest.name)} • Room {guest.roomNumber}
                    </option>
                  ))}
                </select>
                {selectedGuest && (
                  <span className="input-status selected">
                    <Icons.Check size={16} />
                  </span>
                )}
              </div>
            </FormField>

            {/* Guest Details Display */}
            {selectedGuest && (
              <div className="guest-details-panel">
                <div className="guest-details-header">
                  <Icons.User size={18} />
                  <h4>Guest Details</h4>
                </div>
                <div className="guest-details-content">
                  <div className="detail-row">
                    <span className="detail-label">
                      <Icons.User size={14} />
                      Name
                    </span>
                    <span className="detail-value">{capitalize(selectedGuest.name)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <Icons.MapPin size={14} />
                      Room
                    </span>
                    <span className="detail-value">{selectedGuest.roomNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <Icons.User size={14} />
                      Host
                    </span>
                    <span className="detail-value">{capitalize(selectedGuest.hostName)}</span>
                  </div>
                  {selectedGuest.checkInTime && (
                    <div className="detail-row">
                      <span className="detail-label">
                        <Icons.Clock size={14} />
                        Check-in
                      </span>
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
                <Icons.LogOut size={18} />
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