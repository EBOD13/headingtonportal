// frontend/src/components/CheckInForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { checkInGuest } from '../features/guests/guestSlice';
import {
  getResidentByRoom,
  getGuestsByHost,
  clearSelectedResidents,
} from '../features/residents/residentSlice';
import { addActivity } from '../features/activity/activitySlice';
import './CheckInForm.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================
import {
  X as XIcon,
  Building2,
  User,
  Users,
  UserPlus,
  LogIn,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';

const Icons = {
  X: XIcon,
  Building: Building2,
  User,
  Users,
  UserPlus,
  LogIn,
  AlertCircle,
  Check,
  Loader: Loader2,
};

// ============================================================================
// Sub-components
// ============================================================================
const FormField = ({
  icon: Icon,
  label,
  children,
  hint,
  error,
  loading = false,
}) => (
  <div
    className={`form-field ${error ? 'error' : ''} ${
      loading ? 'loading' : ''
    }`}
  >
    <label className="form-label">
      <div className="label-icon">
        <Icon />
      </div>
      <span>{label}</span>
    </label>
    <div className="field-input">{children}</div>
    {hint && <div className="field-hint">{hint}</div>}
    {error && (
      <div className="field-error">
        <Icons.AlertCircle /> {error}
      </div>
    )}
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
function CheckInForm({ onClose, onAddNewGuest }) {
  const [hosts, setHosts] = useState([]);
  const [guests, setGuests] = useState([]);
  const [formData, setFormData] = useState({
    room: '',
    host: '',
    guest: '',
  });
  const [roomError, setRoomError] = useState('');
  const [hostError, setHostError] = useState('');
  const [guestError, setGuestError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddGuestOption, setShowAddGuestOption] = useState(false);

  const { room, host, guest } = formData;

  const dispatch = useDispatch();
  const residentState = useSelector((state) => state.resident);
  const isLoading = residentState.isLoading;

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

  // Update form data
  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If guest is selected, hide the add guest option
    if (name === 'guest' && value) {
      setShowAddGuestOption(false);
    }
  };

  // Handle room input change
  const onChangeRoom = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData((prev) => ({ ...prev, room: value, host: '', guest: '' }));
    setRoomError('');
    setHosts([]);
    setGuests([]);
    setShowAddGuestOption(false);
  };

  // Fetch residents when room changes
  useEffect(() => {
    const fetchResidentByRoom = async () => {
      if (!room || room.length === 0) return;

      const roomRegex = /^[NS]\d{3}$/;
      if (room.length === 4 && !roomRegex.test(room)) {
        setRoomError('Use format: N101, S222');
        return;
      }

      if (room.length !== 4) {
        setRoomError('');
        return;
      }

      setRoomError('');

      try {
        dispatch(clearSelectedResidents());
        const result = await dispatch(getResidentByRoom(room));

        if (result.meta.requestStatus === 'fulfilled') {
          const residents = result.payload;
          if (Array.isArray(residents) && residents.length > 0) {
            setHosts(
              residents.map((res) => ({
                id: res._id,
                name: res.name,
                roomNumber: res.roomNumber,
              }))
            );
          } else {
            setRoomError('No residents found');
            setHosts([]);
          }
        } else {
          setRoomError('Room not found');
          setHosts([]);
        }
      } catch (error) {
        setRoomError('Error fetching residents');
        setHosts([]);
      }
    };

    const timer = setTimeout(fetchResidentByRoom, 500);
    return () => clearTimeout(timer);
  }, [room, dispatch]);

  // Handle host selection
  const onHostSelect = async (e) => {
    const selectedHostId = e.target.value;
    setHostError('');
    setGuestError('');
    setGuests([]);
    setShowAddGuestOption(false);

    setFormData((prev) => ({ ...prev, host: selectedHostId, guest: '' }));

    if (!selectedHostId) return;

    try {
      const result = await dispatch(getGuestsByHost(selectedHostId));
      if (result.meta.requestStatus === 'fulfilled') {
        const guestsData = result.payload?.guestNames || [];
        setGuests(guestsData);

        // Show add guest option if no guests found
        if (guestsData.length === 0) {
          setGuestError('No previous guests found');
          setShowAddGuestOption(true);
        } else {
          setShowAddGuestOption(false);
        }
      }
    } catch (error) {
      setGuestError('Error loading guests');
      setShowAddGuestOption(true); // Still show option to add if error occurs
    }
  };

  // Handle form submission
  const onSubmit = async (e) => {
    e.preventDefault();

    // Validation
    let hasError = false;
    if (!room || room.length !== 4) {
      setRoomError('Enter a valid room');
      hasError = true;
    }
    if (!host) {
      setHostError('Select a host');
      hasError = true;
    }
    if (!guest) {
      setGuestError('Select a guest');
      hasError = true;
    }
    if (hasError) return;

    setIsProcessing(true);

    try {
      const result = await dispatch(checkInGuest(guest));

      if (result.meta.requestStatus === 'fulfilled') {
        const selectedGuest = guests.find((g) => g.id === guest);
        const timeIn = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        if (selectedGuest) {
          dispatch(
            addActivity(
              `Checked in: ${capitalize(
                selectedGuest.name
              )} at ${timeIn}`
            )
          );
        }

        toast.success('Guest checked in successfully');

        // Reset and close
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      } else if (
        result.payload?.message?.includes('Visitation Revoked')
      ) {
        setGuestError('Visitation revoked. Contact Assistant Director.');
      } else {
        setGuestError('Failed to check in guest');
      }
    } catch (error) {
      setGuestError('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Add New Guest click
  const handleAddNewGuest = () => {
    if (!onAddNewGuest) return;

    const selectedHost = hosts.find((h) => h.id === host);

    // Tell parent to open Add New Guest modal with prefilled data
    onAddNewGuest({
      room,
      hostId: host,
      hostName: selectedHost?.name || '',
    });

    // Let parent close this modal
    if (onClose) onClose();
  };

  // Close overlay
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
    <div
      className="modal-overlay checkin-overlay"
      onClick={closeOverlay}
    >
      <div
        className="modal-container checkin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header checkin-header">
          <div className="modal-title">
            <h2>
              <Icons.LogIn />
              Guest Check-In
            </h2>
            <p className="modal-subtitle">Register a visitor arrival</p>
          </div>
          <button className="modal-close" onClick={closeOverlay}>
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className="checkin-form">
          {/* Room Input */}
          <FormField
            icon={Icons.Building}
            label="Host Room"
            hint="Format: N/S followed by 3 digits"
            error={roomError}
            loading={room && room.length === 4 && isLoading}
          >
            <div className="input-with-icon">
              <input
                type="text"
                name="room"
                value={room}
                onChange={onChangeRoom}
                maxLength="4"
                placeholder="Enter room number"
                className="room-input"
                autoComplete="off"
                autoFocus
                disabled={isLoading || isProcessing}
              />
              {room &&
                room.length === 4 &&
                !roomError && (
                  <span className="input-status valid">
                    <Icons.Check />
                  </span>
                )}
            </div>
          </FormField>

          {/* Host Select */}
          <FormField
            icon={Icons.User}
            label="Select Host"
            hint={
              hosts.length > 0 ? `${hosts.length} resident(s) found` : ''
            }
            error={hostError}
            loading={isLoading && hosts.length === 0}
          >
            <div className="select-wrapper">
              <select
                name="host"
                value={host}
                onChange={onHostSelect}
                className="host-select"
                disabled={
                  hosts.length === 0 || isLoading || isProcessing
                }
              >
                <option value="">
                  {isLoading
                    ? 'Loading...'
                    : hosts.length === 0
                    ? 'Enter a room first'
                    : 'Select a host'}
                </option>
                {hosts.map((hostItem) => (
                  <option value={hostItem.id} key={hostItem.id}>
                    {capitalize(hostItem.name)} • Room{' '}
                    {hostItem.roomNumber}
                  </option>
                ))}
              </select>
              {host && (
                <span className="input-status selected">
                  <Icons.Check />
                </span>
              )}
            </div>
          </FormField>

          {/* Guest Select */}
          <FormField
            icon={Icons.Users}
            label="Select Guest"
            hint={
              guests.length > 0 ? `${guests.length} guest(s) found` : ''
            }
            error={guestError}
            loading={host && isLoading}
          >
            <div className="select-wrapper">
              <select
                name="guest"
                value={guest}
                onChange={onChange}
                className="guest-select"
                disabled={
                  guests.length === 0 || !host || isLoading || isProcessing
                }
              >
                <option value="">
                  {!host
                    ? 'Select host first'
                    : isLoading
                    ? 'Loading...'
                    : guests.length === 0
                    ? 'No guests found'
                    : 'Select a guest'}
                </option>
                {guests.map((guestItem) => (
                  <option value={guestItem.id} key={guestItem.id}>
                    {capitalize(guestItem.name)}
                    {guestItem.lastRoom &&
                      ` • Last: ${guestItem.lastRoom}`}
                  </option>
                ))}
              </select>
              {guest && (
                <span className="input-status selected">
                  <Icons.Check />
                </span>
              )}
            </div>
          </FormField>

          {/* Add New Guest Option */}
          {showAddGuestOption &&
            host &&
            !guest &&
            !isLoading &&
            !isProcessing && (
              <div className="add-guest-option">
                <div className="add-guest-message">
                  <Icons.AlertCircle />
                  <span>
                    No previous guests found for this host.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddNewGuest}
                >
                  <Icons.UserPlus />
                  Add New Guest
                </button>
              </div>
            )}

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="checkin-progress">
              <LoadingSpinner />
              <span>Processing check-in...</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="modal-footer checkin-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeOverlay}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={!host || !guest || isProcessing}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner />
                Processing...
              </>
            ) : (
              <>
                <Icons.LogIn />
                Check-In Guest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckInForm;
