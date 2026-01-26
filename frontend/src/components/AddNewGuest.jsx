// frontend/src/components/AddNewGuest.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useResidentByRoom } from '../hooks/useResidentsQuery';
import { useGuestActions } from '../hooks/useGuestsQuery';
import './AddNewGuest.css';

// ============================================================================
// Icons (using lucide-react)
// ============================================================================
import {
  X,
  UserPlus,
  Building2,
  User,
  GraduationCap,
  CreditCard,
  Phone,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';

const Icons = {
  X,
  UserPlus,
  Building: Building2,
  User,
  GraduationCap,
  IdCard: CreditCard,
  Phone,
  AlertCircle,
  Check,
  Loader: Loader2,
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

  // pulling checkIn from useGuestActions to check guests in when they are added 
  const {
    register,
    checkIn,
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
        { headers: { 'X-Api-Key': apiKey } }
      );

      if (!response.ok) {
        console.warn('Phone validation API did not return OK:', response.status);
        return true;
      }

      const data = await response.json();
      return data.is_valid !== false;
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

      // 1) Register guest
      const result = await register(guestData);

      if (!result?.success) {
        toast.error(result?.message || 'Registration failed');
        return;
      }

      // 2) Try to grab the new guest ID from common response shapes
      const newGuestId =
        result?.guest?.id ||
        result?.guest?._id ||
        result?.data?.id ||
        result?.data?._id ||
        result?.id ||
        result?._id ||
        null;

      // 3) If we got an ID, auto check-in
      if (newGuestId) {
        try {
          const checkInResult = await checkIn(newGuestId);

          if (checkInResult?.success === false) {
            toast.success(result.message || 'Guest registered successfully');
            toast.error(
              checkInResult?.message || 'Guest registered but check-in failed'
            );
          } else {
            toast.success(
              checkInResult?.message ||
                result.message ||
                'Guest registered and checked in successfully!'
            );
          }
        } catch (err) {
          console.error('Auto check-in error:', err);
          toast.success(result.message || 'Guest registered successfully');
          toast.error('Guest registered but automatic check-in failed');
        }
      } else {
        // Fallback: registration success but we could not auto check-in
        toast.success(result.message || 'Guest registered successfully');
      }

      // 4) Reset form + close
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
  }, []);

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
              <Icons.UserPlus size={20} />
              Register New Guest
            </h2>
            <p className="modal-subtitle">Add a new visitor to the system</p>
          </div>
          <button className="modal-close" onClick={closeOverlay}>
            <Icons.X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="addguest-content">
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
                {room && room.length === 4 && !formErrors.room && !roomError && hosts?.length > 0 && (
                  <span className="input-status valid">
                    <Icons.Check size={16} />
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
                    <option value={hostItem._id || hostItem.id} key={hostItem._id || hostItem.id}>
                      {hostItem.name
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')}
                    </option>
                  ))}
                </select>
                {host && (
                  <span className="input-status selected">
                    <Icons.Check size={16} />
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
              hint="10 digits, numbers only"
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
                    !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </FormField>

            {/* Student Status and ID */}
            <div className="student-fields">
              <FormField icon={Icons.GraduationCap} label="Student?" error={formErrors.studentAtOU}>
                <select name="studentAtOU" value={studentAtOU} onChange={onChange} disabled={isLoading}>
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
                <Icons.AlertCircle size={16} />
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
          <button type="button" className="btn btn-secondary" onClick={closeOverlay} disabled={isLoading}>
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
                <Icons.UserPlus size={18} />
                Register & Check-In
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddNewGuest;
