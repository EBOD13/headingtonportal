// frontend/src/hooks/useResidentsQuery.js
import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllResidents,
  getResidentByRoom,
  getGuestsByHost,
  clearError,
  clearSelectedResidents,
} from '../features/residents/residentSlice';

/**
 * useResidents
 *
 * Wraps the Redux resident slice + thunks in a hook-style API that
 * looks very similar to React Query:
 *
 *   const {
 *     data,
 *     isLoading,
 *     isError,
 *     error,
 *     refetch,
 *   } = useResidents(clerk?.token, { onError });
 *
 * The `token` argument is optional because we can read it from the store.
 */
export const useResidents = (tokenFromCaller, options = {}) => {
  const dispatch = useDispatch();
  const {
    residents,
    isLoading,
    isError,
    isSuccess,
    message,
  } = useSelector((state) => state.resident);

  const clerkToken = useSelector((state) => state.auth.clerk?.token);
  const effectiveToken = tokenFromCaller || clerkToken;

  const { onError } = options || {};
  const hasNotifiedErrorRef = useRef(false);

  const residentCount = residents?.length || 0;

  // Fetch all residents once (or when token changes & list is empty)
  useEffect(() => {
    if (!effectiveToken) return;

    if (!residents || residents.length === 0) {
      dispatch(getAllResidents());
    }
  }, [dispatch, effectiveToken, residentCount]); // safe: only refetch if count is 0

  // Build an Error-like object for consumers
  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch residents');
  }, [isError, message]);

  // Optional onError callback (like React Query)
  useEffect(() => {
    if (isError && errorObj && onError && !hasNotifiedErrorRef.current) {
      onError(errorObj);
      hasNotifiedErrorRef.current = true;
    }

    if (!isError) {
      hasNotifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  // Refetch wrapper
  const refetch = useCallback(() => {
    if (!effectiveToken) return;
    // Clear previous errors before trying again
    dispatch(clearError());
    dispatch(getAllResidents());
  }, [dispatch, effectiveToken]);

  // `data` mirrors React Query naming
  const data = residents;

  return {
    data,
    isLoading,
    isError,
    isSuccess,
    error: errorObj,
    message,
    refetch,
  };
};

/**
 * useResidentByRoom
 *
 * Fetches residents by room number using the Redux thunk `getResidentByRoom`.
 * API shape is similar to React Query:
 *
 *   const { data, isLoading, isError, error, refetch } =
 *     useResidentByRoom(roomNumber, { enabled, onError });
 *
 * Options:
 *   - enabled?: boolean (default true) – auto-fetch on mount/room change
 *   - onError?: (error: Error) => void
 *   - onSuccess?: (data) => void
 */
export const useResidentByRoom = (roomNumber, options = {}) => {
  const {
    enabled = true,
    onError,
    onSuccess,
  } = options || {};

  const dispatch = useDispatch();
  const {
    selectedResidents,
    isLoading,
    isError,
    isSuccess,
    message,
  } = useSelector((state) => state.resident);

  const clerkToken = useSelector((state) => state.auth.clerk?.token);
  const effectiveToken = clerkToken; // thunk already reads from state

  const normalizedRoom = useMemo(
    () => (roomNumber ? roomNumber.trim().toUpperCase() : ''),
    [roomNumber]
  );

  const errorRef = useRef(null);
  const notifiedErrorRef = useRef(false);
  const notifiedSuccessRef = useRef(false);

  // Auto-fetch when room changes (if enabled)
  useEffect(() => {
    if (!enabled) return;
    if (!effectiveToken) return;
    if (!normalizedRoom) return;

    dispatch(getResidentByRoom(normalizedRoom));
  }, [dispatch, effectiveToken, normalizedRoom, enabled]);

  const data = selectedResidents || [];

  // Build Error object
  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch resident(s) by room');
  }, [isError, message]);

  // Error / success callbacks
  useEffect(() => {
    if (isError && errorObj && onError && !notifiedErrorRef.current) {
      onError(errorObj);
      notifiedErrorRef.current = true;
    }
    if (!isError) {
      notifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  useEffect(() => {
    if (isSuccess && onSuccess && !notifiedSuccessRef.current) {
      onSuccess(data);
      notifiedSuccessRef.current = true;
    }
    if (!isSuccess) {
      notifiedSuccessRef.current = false;
    }
  }, [isSuccess, onSuccess, data]);

  // Manual refetch
  const refetch = useCallback(() => {
    if (!effectiveToken) return;
    if (!normalizedRoom) return;
    dispatch(clearError());
    dispatch(getResidentByRoom(normalizedRoom));
  }, [dispatch, effectiveToken, normalizedRoom]);

  // Optional reset hook for callers who want to clear room-specific state
  const reset = useCallback(() => {
    dispatch(clearSelectedResidents());
    dispatch(clearError());
  }, [dispatch]);

  return {
    data,              // array of residents for that room
    isLoading,
    isError,
    isSuccess,
    error: errorObj,
    message,
    refetch,
    reset,
  };
};

/**
 * useGuestsByHost
 *
 * Fetches guests for a given host (resident) using `getGuestsByHost`.
 *
 *   const { data, isLoading, isError, error, refetch } =
 *     useGuestsByHost(hostId, { enabled, onError, onSuccess });
 */
export const useGuestsByHost = (hostId, options = {}) => {
  const {
    enabled = true,
    onError,
    onSuccess,
  } = options || {};

  const dispatch = useDispatch();
  const {
    guestsByHost,
    isLoading,
    isError,
    isSuccess,
    message,
  } = useSelector((state) => state.resident);

  const clerkToken = useSelector((state) => state.auth.clerk?.token);
  const effectiveToken = clerkToken; // thunk reads from state

  const normalizedHostId = useMemo(
    () => (hostId ? String(hostId).trim() : ''),
    [hostId]
  );

  const notifiedErrorRef = useRef(false);
  const notifiedSuccessRef = useRef(false);

  // Auto-fetch when hostId changes (if enabled)
  useEffect(() => {
    if (!enabled) return;
    if (!effectiveToken) return;
    if (!normalizedHostId) return;

    dispatch(getGuestsByHost(normalizedHostId));
  }, [dispatch, effectiveToken, normalizedHostId, enabled]);

  const data = guestsByHost || [];

  // Build Error object
  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || 'Failed to fetch guests for host');
  }, [isError, message]);

  // Error / success callbacks
  useEffect(() => {
    if (isError && errorObj && onError && !notifiedErrorRef.current) {
      onError(errorObj);
      notifiedErrorRef.current = true;
    }
    if (!isError) {
      notifiedErrorRef.current = false;
    }
  }, [isError, errorObj, onError]);

  useEffect(() => {
    if (isSuccess && onSuccess && !notifiedSuccessRef.current) {
      onSuccess(data);
      notifiedSuccessRef.current = true;
    }
    if (!isSuccess) {
      notifiedSuccessRef.current = false;
    }
  }, [isSuccess, onSuccess, data]);

  // Manual refetch
  const refetch = useCallback(() => {
    if (!effectiveToken) return;
    if (!normalizedHostId) return;
    dispatch(clearError());
    dispatch(getGuestsByHost(normalizedHostId));
  }, [dispatch, effectiveToken, normalizedHostId]);

  return {
    data,              // array of guests (shape based on controller)
    isLoading,
    isError,
    isSuccess,
    error: errorObj,
    message,
    refetch,
  };
};

export default useResidents;
