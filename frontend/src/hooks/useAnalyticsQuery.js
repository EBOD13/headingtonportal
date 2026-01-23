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
// Selectors - FIXED
// ==============================

// Read from state.guests (matches your store.js)
const selectGuestState = (state) => state.guests || initialGuestState;

// Safely read Clerk token
const selectAuthToken = (state) => state.auth?.clerk?.token ?? null;

// ==============================
// Helpers
// ==============================

const normalizeGuest = (g) => {
  if (!g) return g;

  const hostName = g.hostName || 'Unknown Host';
  const hostRoom = g.hostRoom || null;
  const room = g.room || hostRoom || '';
  const wing = g.wing || 
    (room && room[0]?.toUpperCase() === 'S' ? 'South' : 
     room && room[0]?.toUpperCase() === 'N' ? 'North' : 'Unknown');

  return {
    ...g,
    id: g._id || g.id,
    hostName,
    hostRoom,
    wing,
  };
};

/**
 * useGuests - FIXED
 */
export const useGuests = (options = {}) => {
  const { enabled = true, onError } = options || {};

  const dispatch = useDispatch();
  const guestState = useSelector(selectGuestState);
  
  const {
    guests = [],
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = '',
  } = guestState;

  const clerkToken = useSelector(selectAuthToken);
  const notifiedErrorRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Auto-fetch all guests ONCE
  useEffect(() => {
    if (!enabled) return;
    if (!clerkToken) return;
    if (hasFetchedRef.current) return;

    // console.log('[useGuests] Fetching guests...');
    hasFetchedRef.current = true;
    dispatch(getAllGuests());
  }, [dispatch, clerkToken, enabled]);

  // Build Error object
  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch guests');
  }, [isError, message]);

  // Optional onError callback
  useEffect(() => {
    if (isError && errorObj && onError && !notifiedErrorRef.current) {
      onError(errorObj);
      notifiedErrorRef.current = true;
    }
    if (!isError) {
      notifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  // Manual refetch
  const refetch = useCallback(() => {
    if (!clerkToken) return;
    // console.log('[useGuests] Manual refetch');
    dispatch(clearGuestError());
    dispatch(getAllGuests());
  }, [dispatch, clerkToken]);

  // Normalize guests for the UI
  const data = useMemo(
    () => (guests || []).map(normalizeGuest),
    [guests]
  );

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
 * useCheckedInGuests - FIXED
 */
export const useCheckedInGuests = (options = {}) => {
  const { enabled = true, onError } = options || {};

  const dispatch = useDispatch();
  const guestState = useSelector(selectGuestState);
  
  const {
    checkedInGuests = [],
    checkedInRooms = [],
    checkedInCount = 0,
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = '',
  } = guestState;

  const clerkToken = useSelector(selectAuthToken);
  const notifiedErrorRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Auto-fetch checked-in guests ONCE
  useEffect(() => {
    if (!enabled) return;
    if (!clerkToken) return;
    if (hasFetchedRef.current) return;

    // console.log('[useCheckedInGuests] Fetching checked-in guests...');
    hasFetchedRef.current = true;
    dispatch(getCheckedInGuests());
  }, [dispatch, clerkToken, enabled]);

  const data = useMemo(
    () => (checkedInGuests || []).map(normalizeGuest),
    [checkedInGuests]
  );

  const rooms = checkedInRooms || [];
  const count = checkedInCount || 0;

  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch checked-in guests');
  }, [isError, message]);

  useEffect(() => {
    if (isError && errorObj && onError && !notifiedErrorRef.current) {
      onError(errorObj);
      notifiedErrorRef.current = true;
    }
    if (!isError) {
      notifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  const refetch = useCallback(() => {
    if (!clerkToken) return;
    // console.log('[useCheckedInGuests] Manual refetch');
    dispatch(clearGuestError());
    dispatch(getCheckedInGuests());
  }, [dispatch, clerkToken]);

  return {
    data,
    rooms,
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
 * useGuestActions - FIXED
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
    (guestData) => dispatch(registerGuest(guestData)).unwrap(),
    [dispatch]
  );

  const checkIn = useCallback(
    (guestId) => dispatch(checkInGuest(guestId)).unwrap(),
    [dispatch]
  );

  const checkOut = useCallback(
    (guestId) => dispatch(checkOutGuest(guestId)).unwrap(),
    [dispatch]
  );

  const clearError = useCallback(
    () => dispatch(clearGuestError()),
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