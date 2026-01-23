// frontend/src/components/AddNewGuest.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useResidentByRoom } from '../hooks/useResidentsQuery';
import { useGuestActions } from '../hooks/useGuestsQuery';
import './AddNewGuest.css';

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
  UserPlus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  GraduationCap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  IdCard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 12h8M8 8h8M8 16h2" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
function AddNewGuest({ onClose, initialRoom = '', initialHostId = '', initialHostName = '' }) {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    host: initialHostId,
    room: initialRoom,
    contact: '',
    studentAtOU: '',
    IDNumber: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const { lastName, firstName, host, room, contact, studentAtOU, IDNumber } = formData;

  const {
    data: hosts,
    isLoading: isLoadingHosts,
    isError: roomError,
    error: roomErrorObj,
  } = useResidentByRoom(room, {
    enabled: room.length === 4,
  });

  const {
    register,
    isLoading,
    isError: registerError,
    message: registerMessage,
    clearError,
  } = useGuestActions();

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === 'room') {
      const uppercaseValue = value.toUpperCase();
      setFormData((prev) => ({
        ...prev,
        room: uppercaseValue,
        host: uppercaseValue.length === 4 ? prev.host : '',
      }));

      if (formErrors.room) {
        setFormErrors((prev) => ({ ...prev, room: '' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name]) {
        setFormErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }

    if (registerError) {
      clearError();
    }
  };

  const handleHostSelect = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, host: value }));
    if (formErrors.host) {
      setFormErrors((prev) => ({ ...prev, host: '' }));
    }
  };

  const toBoolean = (stringValue) => {
    switch (stringValue?.toLowerCase()?.trim()) {
      case 'yes':
        return true;
      case 'no':
        return false;
      default:
        return undefined;
    }
  };

  // Auto-fill initial room/host from props
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      room: initialRoom || prev.room,
      host: initialHostId || prev.host,
    }));
  }, [initialRoom, initialHostId]);

  const validateForm = () => {
    const errors = {};
    const roomRegex = /^[NS]\d{3}$/;

    if (!room || room.length !== 4) {
      errors.room = 'Room must be 4 characters';
    } else if (!roomRegex.test(room)) {
      errors.room = 'Use format: N101, S222';
    }

    if (!host) errors.host = 'Select a host';

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';

    if (!contact || contact.length !== 10) {
      errors.contact = '10-digit phone number required';
    } else if (!/^\d+$/.test(contact)) {
      errors.contact = 'Only digits allowed';
    }

    if (!studentAtOU) errors.studentAtOU = 'Select student status';

    if (studentAtOU === 'yes' && !IDNumber.trim()) {
      errors.IDNumber = 'ID number required for OU students';
    }

    return errors;
  };

  const validatePhoneNumber = async (phoneNumber) => {
    const apiKey = '95AHo81aT51ptHSAqYH1vCUemuWJ0kcigTNgQH4s';
    const number = '+1' + phoneNumber;

    try {
      const response = await fetch(
        `https://api.api-ninjas.com/v1/validatephone?number=${number}`,
        {
          headers: { 'X-Api-Key': apiKey },
        }
      );

      if (!response.ok) {
        console.warn('Phone validation API did not return OK:', response.status);
        return true;
      }

      const data = await response.json();
      console.log('Phone validation response:', data);

      if (data.is_valid === false) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Phone validation error (non-blocking):', error);
      return true;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);

      const firstError = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }

      return;
    }

    try {
      const isValidPhone = await validatePhoneNumber(contact);
      if (!isValidPhone) {
        setFormErrors((prev) => ({ ...prev, contact: 'Invalid phone number' }));
        return;
      }

      const studentAtOUBool = toBoolean(studentAtOU);
      const name = `${firstName.trim().toLowerCase()} ${lastName.trim().toLowerCase()}`;

      const guestData = {
        name,
        host,
        contact,
        IDNumber: studentAtOUBool ? IDNumber : '',
        studentAtOU: studentAtOUBool,
        room,
      };

      console.log('Submitting guestData:', guestData);

      const result = await register(guestData);

      console.log('Register guest result:', result);

      if (result?.success) {
        toast.success(result.message || 'Guest registered successfully!');

        setFormData({
          lastName: '',
          firstName: '',
          host: '',
          room: '',
          contact: '',
          studentAtOU: '',
          IDNumber: '',
        });

        setTimeout(() => {
          if (onClose) onClose();
        }, 800);
      } else {
        toast.error(result?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error (frontend):', error);
      toast.error(error.message || 'Error registering guest');
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
  }, [closeOverlay]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!onClose) return null;

  return (
    <div className="modal-overlay addguest-overlay" onClick={closeOverlay}>
      <div className="modal-container addguest-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header addguest-header">
          <div className="modal-title">
            <h2>
              <Icons.UserPlus />
              Register New Guest
            </h2>
            <p className="modal-subtitle">Add a new visitor to the system</p>
          </div>
          <button className="modal-close" onClick={closeOverlay}>
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content addguest-content">
          <form onSubmit={onSubmit} className="addguest-form">
            {/* Room Input */}
            <FormField
              icon={Icons.Building}
              label="Host Room"
              hint="Format: N/S followed by 3 digits"
              error={formErrors.room || (roomError && roomErrorObj?.message)}
              loading={room && room.length === 4 && isLoadingHosts}
            >
              <div className="input-with-icon">
                <input
                  type="text"
                  name="room"
                  value={room}
                  onChange={onChange}
                  maxLength="4"
                  placeholder="Enter room number"
                  className="room-input"
                  autoComplete="off"
                  autoFocus={!initialRoom}
                  disabled={isLoading}
                />
                {room &&
                  room.length === 4 &&
                  !formErrors.room &&
                  !roomError &&
                  hosts?.length > 0 && (
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
              hint={hosts?.length > 0 ? `${hosts.length} resident(s) found` : ''}
              error={formErrors.host}
              loading={isLoadingHosts && (!hosts || hosts.length === 0)}
            >
              <div className="select-wrapper">
                <select
                  name="host"
                  value={host}
                  onChange={handleHostSelect}
                  className="host-select"
                  disabled={!hosts?.length || isLoading}
                >
                  <option value="">
                    {isLoadingHosts
                      ? 'Loading...'
                      : !hosts?.length
                      ? 'Enter a valid room first'
                      : 'Select a host'}
                  </option>
                  {hosts?.map((hostItem) => (
                    <option
                      value={hostItem._id || hostItem.id}
                      key={hostItem._id || hostItem.id}
                    >
                      {hostItem.name
                        .split(' ')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(' ')}
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

            {/* Guest Name Fields */}
            <div className="name-fields">
              <FormField icon={Icons.User} label="First Name" error={formErrors.firstName}>
                <input
                  type="text"
                  name="firstName"
                  value={firstName}
                  onChange={onChange}
                  placeholder="Enter first name"
                  disabled={isLoading}
                />
              </FormField>

              <FormField icon={Icons.User} label="Last Name" error={formErrors.lastName}>
                <input
                  type="text"
                  name="lastName"
                  value={lastName}
                  onChange={onChange}
                  placeholder="Enter last name"
                  disabled={isLoading}
                />
              </FormField>
            </div>

            {/* Contact */}
            <FormField
              icon={Icons.Phone}
              label="Phone Number"
              hint="10 digits"
              error={formErrors.contact}
            >
              <input
                type="tel"
                name="contact"
                value={contact}
                onChange={onChange}
                maxLength="10"
                placeholder="Enter phone number"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (
                    !/\d/.test(e.key) &&
                    e.key !== 'Backspace' &&
                    e.key !== 'Delete' &&
                    e.key !== 'Tab' &&
                    e.key !== 'ArrowLeft' &&
                    e.key !== 'ArrowRight' &&
                    e.key !== 'Home' &&
                    e.key !== 'End'
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </FormField>

            {/* Student Status and ID */}
            <div className="guest-profile-fields">
              <FormField
                icon={Icons.GraduationCap}
                label="OU Student?"
                error={formErrors.studentAtOU}
              >
                <select
                  name="studentAtOU"
                  value={studentAtOU}
                  onChange={onChange}
                  disabled={isLoading}
                >
                  <option value="">Select status</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </FormField>

              {studentAtOU === 'yes' && (
                <FormField icon={Icons.IdCard} label="Student ID" error={formErrors.IDNumber}>
                  <input
                    type="text"
                    name="IDNumber"
                    value={IDNumber}
                    onChange={onChange}
                    placeholder="Enter student ID"
                    disabled={isLoading}
                  />
                </FormField>
              )}
            </div>

            {/* Register error */}
            {registerError && (
              <div className="register-error">
                <Icons.AlertCircle />
                <span>{registerMessage}</span>
              </div>
            )}

            {/* Progress Indicator */}
            {isLoading && (
              <div className="progress-indicator">
                <LoadingSpinner />
                <span>Validating and registering guest...</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer addguest-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeOverlay}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={isLoading || !host || !firstName || !lastName || !contact}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Processing...
              </>
            ) : (
              <>
                <Icons.UserPlus />
                Register Guest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddNewGuest;
