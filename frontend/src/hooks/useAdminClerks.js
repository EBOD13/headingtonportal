// frontend/src/hooks/useAdminClerks.js
import { useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClerkRoster,
  fetchClerkDetail,
  setClerkStatus,
  removeClerk,
  importClerks,
  clearAdminError,
  setSelectedClerkLocal,
} from "../features/admin/adminSlice";

const selectAdminState = (state) => state.admin || {};

export function useAdminClerks(options = {}) { 
  const { enabled = true, onError } = options || {};
  const dispatch = useDispatch();
  const adminState = useSelector(selectAdminState);
  const token = useSelector((state) => state.auth?.clerk?.token ?? null);

  const {
    clerks = [],
    selectedClerk = null,
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = "",
  } = adminState;

  const hasFetchedRef = useRef(false);
  const notifiedErrorRef = useRef(false);

  // Auto-fetch roster once
  useEffect(() => {
    if (!enabled) return;
    if (!token) return;
    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    dispatch(fetchClerkRoster());
  }, [dispatch, token, enabled]);

  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || "Admin clerk error");
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
    if (!token) return;
    dispatch(clearAdminError());
    dispatch(fetchClerkRoster());
  }, [dispatch, token]);

  const loadDetail = useCallback(
    (id) => {
      if (!id) return;
      return dispatch(fetchClerkDetail(id)).unwrap();
    },
    [dispatch]
  );

  const toggleActive = useCallback(
    (clerk) => {
      if (!clerk?._id) return;
      const updates = { isActive: !clerk.isActive };
      return dispatch(setClerkStatus({ id: clerk._id, updates })).unwrap();
    },
    [dispatch]
  );

  const deleteClerkAction = useCallback(
    (id) => {
      if (!id) return;
      return dispatch(removeClerk(id)).unwrap();
    },
    [dispatch]
  );

  const importFromFile = useCallback(
    (file) => {
      if (!file) return;
      return dispatch(importClerks(file)).unwrap();
    },
    [dispatch]
  );

  const setSelectedClerk = useCallback(
    (clerk) => {
      dispatch(setSelectedClerkLocal(clerk));
    },
    [dispatch]
  );

  return {
    clerks,
    selectedClerk,
    isLoading,
    isError,
    isSuccess,
    message,
    error: errorObj,
    refetch,
    loadDetail,
    toggleActive,
    deleteClerk: deleteClerkAction,
    importFromFile,
    setSelectedClerk,
  };
}
export default useAdminClerks;
