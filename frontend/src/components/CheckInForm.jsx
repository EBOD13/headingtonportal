// frontend/src/components/CheckInForm.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

import {
  X,
  Building2,
  User,
  Users,
  UserPlus,
  LogIn,
  AlertCircle,
  Check,
  Loader2,
  Search,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

// ============================================================================
// Sub-components
// ============================================================================
const LoadingSpinner = () => (
  <div className="checkin-spinner">
    <Loader2 size={18} />
  </div>
);

const FormField = ({
  icon: Icon,
  label,
  children,
  hint,
  error,
  loading = false,
}) => (
  <div
    className={`form-field ${error ? 'error' : ''} ${loading ? 'loading' : ''}`}
  >
    <label className="form-label">
      <div className="label-icon">
        <Icon size={16} />
      </div>
      <span>{label}</span>
    </label>
    <div className="field-input">{children}</div>
    {hint && <div className="field-hint">{hint}</div>}
    {error && (
      <div className="field-error">
        <AlertCircle size={14} /> {error}
      </div>
    )}
  </div>
);

const HostCard = ({ host, isSelected, onSelect, capitalize }) => (
  <button
    type="button"
    className={`host-card ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(host)}
  >
    <div className="host-card-avatar">
      {(host.name || '?')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)}
    </div>
    <div className="host-card-info">
      <span className="host-card-name">{capitalize(host.name)}</span>
      <span className="host-card-room">Room {host.roomNumber}</span>
    </div>
    <div className="host-card-arrow">
      <ChevronRight size={18} />
    </div>
  </button>
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
      {guest.lastRoom && (
        <span className="guest-card-meta">Last visit: Room {guest.lastRoom}</span>
      )}
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
function CheckInForm({ onClose, onAddNewGuest }) {
  // Step management: 'room' -> 'host' -> 'guests'
  const [step, setStep] = useState('room');

  // Room & Host state
  const [room, setRoom] = useState('');
  const [hosts, setHosts] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null);
  const [roomError, setRoomError] = useState('');

  // Guests state
  const [guests, setGuests] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestError, setGuestError] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  const dispatch = useDispatch();
  const residentState = useSelector((state) => state.resident);
  const isLoading = residentState.isLoading;

  const capitalize = useCallback((str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  // Filter guests by search
  const filteredGuests = useMemo(() => {
    if (!guestSearch.trim()) return guests;
    const q = guestSearch.toLowerCase();
    return guests.filter((g) => g.name?.toLowerCase().includes(q));
  }, [guests, guestSearch]);

  // Check if guest is selected
  const isGuestSelected = useCallback(
    (guest) => {
      return selectedGuests.some((g) => g.id === guest.id);
    },
    [selectedGuests]
  );

  // Toggle guest selection
  const handleToggleGuest = (guest) => {
    setSelectedGuests((prev) => {
      const exists = prev.some((g) => g.id === guest.id);
      if (exists) {
        return prev.filter((g) => g.id !== guest.id);
      }
      return [...prev, guest];
    });
  };

  // Handle room input change
  const onChangeRoom = (e) => {
    const value = e.target.value.toUpperCase();
    setRoom(value);
    setRoomError('');
    setHosts([]);
    setSelectedHost(null);
    setGuests([]);
    setSelectedGuests([]);
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
            const hostList = residents.map((res) => ({
              id: res._id,
              name: res.name,
              roomNumber: res.roomNumber,
            }));
            setHosts(hostList);
            setStep('host');
          } else {
            setRoomError('No residents found in this room');
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
  const handleSelectHost = async (host) => {
    setSelectedHost(host);
    setGuestError('');
    setGuests([]);
    setSelectedGuests([]);
    setGuestSearch('');

    try {
      const result = await dispatch(getGuestsByHost(host.id));
      if (result.meta.requestStatus === 'fulfilled') {
        const guestsData = result.payload?.guestNames || [];
        setGuests(guestsData);
        setStep('guests');

        if (guestsData.length === 0) {
          setGuestError('No previous guests found for this host');
        }
      }
    } catch (error) {
      setGuestError('Error loading guests');
      setStep('guests');
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (step === 'guests') {
      setStep('host');
      setSelectedHost(null);
      setGuests([]);
      setSelectedGuests([]);
      setGuestSearch('');
      setGuestError('');
    } else if (step === 'host') {
      setStep('room');
      setRoom('');
      setHosts([]);
      setRoomError('');
    }
  };

  // Handle form submission
  const onSubmit = async (e) => {
    e.preventDefault();

    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest to check in');
      return;
    }

    setIsProcessing(true);

    try {
      const timeIn = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      let successCount = 0;
      let failCount = 0;

      for (const guest of selectedGuests) {
        try {
          const result = await dispatch(checkInGuest(guest.id));

          if (result.meta.requestStatus === 'fulfilled') {
            dispatch(
              addActivity(`Checked in: ${capitalize(guest.name)} at ${timeIn}`)
            );
            successCount++;
          } else if (result.payload?.message?.includes('Visitation Revoked')) {
            toast.error(`${capitalize(guest.name)}: Visitation revoked`);
            failCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error('Check-in error for guest:', guest, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Checked in ${successCount} guest${successCount > 1 ? 's' : ''}`
        );
      }

      if (failCount > 0 && successCount === 0) {
        toast.error('Failed to check in guests');
      }

      // Reset and close
      setTimeout(() => {
        if (onClose) onClose();
      }, 800);
    } catch (error) {
      toast.error('An error occurred during check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Add New Guest click
  const handleAddNewGuest = () => {
    if (!onAddNewGuest) return;

    onAddNewGuest({
      room,
      hostId: selectedHost?.id,
      hostName: selectedHost?.name || '',
    });

    if (onClose) onClose();
  };

  // Close overlay
  const closeOverlay = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

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

  const selectedCount = selectedGuests.length;

  return (
    <div className="checkin-overlay" onClick={closeOverlay}>
      <div className="checkin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="checkin-header">
          <div className="checkin-title">
            {step !== 'room' && (
              <button
                type="button"
                className="checkin-back"
                onClick={handleBack}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2>
                <LogIn size={20} />
                Guest Check-In
              </h2>
              <p className="checkin-subtitle">
                {step === 'room' && 'Enter the host room number'}
                {step === 'host' && `Select a host from Room ${room}`}
                {step === 'guests' &&
                  `Select guests for ${capitalize(selectedHost?.name || '')}`}
              </p>
            </div>
          </div>
          <button type="button" className="checkin-close" onClick={closeOverlay}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="checkin-content">
          {/* Step 1: Room Input */}
          {step === 'room' && (
            <div className="checkin-step">
              <FormField
                icon={Building2}
                label="Host Room"
                hint="Format: N/S followed by 3 digits (e.g., N101, S222)"
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
                  {room && room.length === 4 && !roomError && hosts.length > 0 && (
                    <span className="input-status valid">
                      <Check size={16} />
                    </span>
                  )}
                </div>
              </FormField>

              {isLoading && room.length === 4 && (
                <div className="checkin-loading">
                  <LoadingSpinner />
                  <span>Looking up residents...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Host Selection */}
          {step === 'host' && (
            <div className="checkin-step">
              <div className="checkin-step-info">
                <Building2 size={16} />
                <span>Room {room}</span>
                <span className="checkin-step-divider">•</span>
                <span>{hosts.length} resident{hosts.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="host-list">
                {hosts.map((host) => (
                  <HostCard
                    key={host.id}
                    host={host}
                    isSelected={selectedHost?.id === host.id}
                    onSelect={handleSelectHost}
                    capitalize={capitalize}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Guest Selection */}
          {step === 'guests' && (
            <div className="checkin-step">
              {/* Info bar */}
              <div className="checkin-step-info">
                <User size={16} />
                <span>{capitalize(selectedHost?.name || '')}</span>
                <span className="checkin-step-divider">•</span>
                <span>Room {room}</span>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="checkin-loading">
                  <LoadingSpinner />
                  <span>Loading guests...</span>
                </div>
              )}

              {/* No guests found */}
              {!isLoading && guests.length === 0 && (
                <div className="checkin-empty">
                  <Users size={32} />
                  <h3>No Previous Guests</h3>
                  <p>This host doesn't have any registered guests yet.</p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleAddNewGuest}
                  >
                    <UserPlus size={16} />
                    Add New Guest
                  </button>
                </div>
              )}

              {/* Guest list */}
              {!isLoading && guests.length > 0 && (
                <>
                  {/* Search & count toolbar */}
                  <div className="checkin-toolbar">
                    <div className="checkin-search">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Search guests..."
                        value={guestSearch}
                        onChange={(e) => setGuestSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="checkin-guest-count">
                      <Users size={16} />
                      <span>
                        {filteredGuests.length} guest
                        {filteredGuests.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Guest cards */}
                  <div className="checkin-guest-list-container">
                    <div className="checkin-guest-list">
                      {filteredGuests.map((guest) => (
                        <GuestCard
                          key={guest.id}
                          guest={guest}
                          isSelected={isGuestSelected(guest)}
                          onToggle={handleToggleGuest}
                          capitalize={capitalize}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Add new guest option */}
                  <div className="checkin-add-guest">
                    <button
                      type="button"
                      className="btn btn-text"
                      onClick={handleAddNewGuest}
                    >
                      <UserPlus size={16} />
                      Add a new guest for this host
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="checkin-progress">
              <LoadingSpinner />
              <span>Processing check-in...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="checkin-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={step === 'room' ? closeOverlay : handleBack}
            disabled={isProcessing}
          >
            {step === 'room' ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={selectedGuests.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner />
                Processing...
              </>
            ) : (
              <>
                <LogIn size={18} />
                {selectedCount > 0
                  ? `Check In ${selectedCount} Guest${selectedCount > 1 ? 's' : ''}`
                  : 'Check In'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckInForm;