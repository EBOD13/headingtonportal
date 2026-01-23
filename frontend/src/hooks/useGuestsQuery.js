// frontend/src/hooks/useGuestsQuery.js
import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllGuests,
  getCheckedInGuests,
  registerGuest,
  checkInGuest,
  checkOutGuest,
  clearGuestError,
  initialGuestState,
} from '../features/guests/guestSlice';

// ==============================
// Selectors
// ==============================

const selectGuestState = (state) => state.guests || initialGuestState;
const selectAuthToken = (state) => state.auth?.clerk?.token ?? null;

// ==============================
// Helper Functions
// ==============================

const normalizeGuest = (g) => {
  if (!g) return null;

  console.log('[normalizeGuest] Raw guest data:', g);

  // Extract critical properties with multiple fallbacks
  const name = g.name || g.guestName || (g.firstName && g.lastName ? `${g.firstName} ${g.lastName}`.trim() : 'Unknown Guest');
  const room = g.room || g.hostRoom || (g.host && g.host.roomNumber) || (g.host && g.host.room) || 'N/A';
  const hostName = g.hostName || (g.host && g.host.name) || (g.host && g.host.firstName && g.host.lastName ? `${g.host.firstName} ${g.host.lastName}`.trim() : 'Unknown Host');
  
  // Check if guest is checked in
  const isCheckedIn = g.isCheckedIn === true || g.checkedIn === true || g.checkInStatus === 'checked-in';
  
  // Get guest ID
  const guestId = g._id || g.id;
  
  // Get wing from room
  const wing = 
    (room && room[0]?.toUpperCase() === 'S') ? 'South' : 
    (room && room[0]?.toUpperCase() === 'N') ? 'North' : 
    'Unknown';

  const normalized = {
    ...g,
    id: guestId,
    name, // REQUIRED by GuestItem component
    room, // REQUIRED by GuestItem component
    hostName,
    hostRoom: room,
    wing,
    isCheckedIn,
    
    // Ensure all properties exist for GuestDetailModal
    contact: g.contact || g.phone || '',
    IDNumber: g.IDNumber || g.studentId || g.idNumber || '',
    studentAtOU: g.studentAtOU || false,
    flagged: g.flagged || false,
    checkIn: g.checkIn || g.timeIn || null,
    checkout: g.checkout || g.timeOut || null,
    createdAt: g.createdAt || g.registrationDate || new Date().toISOString(),
  };

  console.log('[normalizeGuest] Normalized:', normalized);
  return normalized;
};

// ==============================
// Custom Hooks
// ==============================

/**
 * useGuests - Fetches ALL guests from the backend
 */
export const useGuests = (options = {}) => {
  const { enabled = true, onError } = options || {};

  const dispatch = useDispatch();
  const guestState = useSelector(selectGuestState);
  const clerkToken = useSelector(selectAuthToken);
  
  const {
    guests = [],
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = '',
  } = guestState;

  const notifiedErrorRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Auto-fetch all guests ONCE when enabled and token exists
  useEffect(() => {
    if (!enabled) {
      console.log('[useGuests] Hook disabled, skipping fetch');
      return;
    }
    
    if (!clerkToken) {
      console.log('[useGuests] No auth token available, skipping fetch');
      return;
    }
    
    if (hasFetchedRef.current) {
      console.log('[useGuests] Already fetched, skipping');
      return;
    }

    console.log('[useGuests] Fetching all guests...');
    hasFetchedRef.current = true;
    dispatch(getAllGuests());
  }, [dispatch, clerkToken, enabled]);

  // Build error object for consistent error handling
  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch guests');
  }, [isError, message]);

  // Trigger onError callback if provided
  useEffect(() => {
    if (isError && errorObj && onError && !notifiedErrorRef.current) {
      onError(errorObj);
      notifiedErrorRef.current = true;
    }
    if (!isError) {
      notifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  // Manual refetch function
  const refetch = useCallback(() => {
    if (!clerkToken) {
      console.warn('[useGuests] Cannot refetch: no auth token');
      return;
    }
    
    console.log('[useGuests] Manually refetching guests...');
    dispatch(clearGuestError());
    dispatch(getAllGuests());
  }, [dispatch, clerkToken]);

  // Normalize guest data for consistent UI consumption
  const data = useMemo(() => {
    const normalized = (guests || [])
      .map(normalizeGuest)
      .filter(g => g !== null);
    
    console.log('[useGuests] Final normalized data count:', normalized.length, 'guests');
    return normalized;
  }, [guests]);

  return {
    data,
    count: data.length,
    isLoading,
    isError,
    isSuccess,
    error: errorObj,
    message,
    refetch,
  };
};

/**
 * useCheckedInGuests - Fetches and filters checked-in guests
 */
export const useCheckedInGuests = (options = {}) => {
  const { enabled = true, onError } = options || {};

  const dispatch = useDispatch();
  const guestState = useSelector(selectGuestState);
  const clerkToken = useSelector(selectAuthToken);
  
  const {
    guests = [],
    checkedInGuests = [],
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = '',
  } = guestState;

  const notifiedErrorRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Fetch checked-in guests specifically
  useEffect(() => {
    if (!enabled) {
      console.log('[useCheckedInGuests] Hook disabled, skipping fetch');
      return;
    }
    
    if (!clerkToken) {
      console.log('[useCheckedInGuests] No auth token available, skipping fetch');
      return;
    }
    
    if (hasFetchedRef.current) {
      console.log('[useCheckedInGuests] Already fetched, skipping');
      return;
    }

    console.log('[useCheckedInGuests] Fetching checked-in guests...');
    hasFetchedRef.current = true;
    dispatch(getCheckedInGuests());
  }, [dispatch, clerkToken, enabled]);

  // Calculate checked-in guests data
  const checkedInData = useMemo(() => {
    let result = [];
    
    // Strategy 1: Use dedicated checkedInGuests from Redux if available
    if (checkedInGuests.length > 0) {
      console.log('[useCheckedInGuests] Using dedicated checkedInGuests array');
      result = checkedInGuests.map(normalizeGuest).filter(g => g !== null);
    } 
    // Strategy 2: Fallback to filtering all guests
    else if (guests.length > 0) {
      console.log('[useCheckedInGuests] Filtering from all guests array');
      result = guests
        .map(normalizeGuest)
        .filter(g => g !== null && g.isCheckedIn === true);
    }
    
    console.log('[useCheckedInGuests] Final checked-in data:', {
      count: result.length,
      guests: result.map(g => ({ id: g.id, name: g.name, room: g.room, isCheckedIn: g.isCheckedIn }))
    });
    
    return result;
  }, [guests, checkedInGuests]);

  const count = checkedInData.length;

  // Build error object
  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch checked-in guests');
  }, [isError, message]);

  // Trigger onError callback if provided
  useEffect(() => {
    if (isError && errorObj && onError && !notifiedErrorRef.current) {
      onError(errorObj);
      notifiedErrorRef.current = true;
    }
    if (!isError) {
      notifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  // Manual refetch function
  const refetch = useCallback(() => {
    if (!clerkToken) {
      console.warn('[useCheckedInGuests] Cannot refetch: no auth token');
      return;
    }
    
    console.log('[useCheckedInGuests] Manually refetching checked-in guests...');
    dispatch(clearGuestError());
    dispatch(getCheckedInGuests());
  }, [dispatch, clerkToken]);

  return {
    data: checkedInData,
    count,
    isLoading,
    isError,
    isSuccess,
    error: errorObj,
    message,
    refetch,
  };
};

/**
 * useGuestActions - Provides guest-related actions (register, checkIn, checkOut)
 */
export const useGuestActions = () => {
  const dispatch = useDispatch();
  const guestState = useSelector(selectGuestState);
  
  const {
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = '',
  } = guestState;

  const register = useCallback(
    (guestData) => {
      console.log('[useGuestActions] Registering guest:', guestData);
      return dispatch(registerGuest(guestData)).unwrap();
    },
    [dispatch]
  );

  const checkIn = useCallback(
    (guestId) => {
      console.log('[useGuestActions] Checking in guest:', guestId);
      return dispatch(checkInGuest(guestId)).unwrap();
    },
    [dispatch]
  );

  const checkOut = useCallback(
    (guestId) => {
      console.log('[useGuestActions] Checking out guest:', guestId);
      return dispatch(checkOutGuest(guestId)).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(
    () => {
      console.log('[useGuestActions] Clearing guest errors');
      dispatch(clearGuestError());
    },
    [dispatch]
  );

  return {
    register,
    checkIn,
    checkOut,
    clearError,
    isLoading,
    isError,
    isSuccess,
    message,
  };
};

export default useGuests;