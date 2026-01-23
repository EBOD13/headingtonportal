// frontend/src/hooks/useAdminResidents.js
import { useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchResidentRoster,
  setResidentStatusAdmin,
  removeResidentAdmin,
  importResidents,
  clearAdminError,
  setSelectedResidentLocal,
} from "../features/admin/adminSlice";

const selectAdminState = (state) => state.admin || {};

export const useAdminResidents = (options = {}) => {
  const { enabled = true, filters = {}, onError } = options || {};
  const dispatch = useDispatch();
  const adminState = useSelector(selectAdminState);
  const token = useSelector((state) => state.auth?.clerk?.token ?? null);

  const {
    residents = [],
    selectedResident = null,
    isLoading = false,
    isError = false,
    isSuccess = false,
    message = "",
  } = adminState;

  const hasFetchedRef = useRef(false);
  const notifiedErrorRef = useRef(false);

  // Fetch roster with optional filters
  useEffect(() => {
    if (!enabled) return;
    if (!token) return;

    // We *do* want to refetch on filters change
    hasFetchedRef.current = true;
    dispatch(fetchResidentRoster(filters));
  }, [dispatch, token, enabled, JSON.stringify(filters)]);

  const errorObj = useMemo(() => {
    if (!isError) return null;
    return new Error(message || "Admin resident error");
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
    dispatch(fetchResidentRoster(filters));
  }, [dispatch, token, filters]);

  const toggleActive = useCallback(
    (resident) => {
      if (!resident?._id) return;
      const updates = { active: !resident.active };
      return dispatch(
        setResidentStatusAdmin({ id: resident._id, updates })
      ).unwrap();
    },
    [dispatch]
  );

  const deleteResident = useCallback(
    (id) => {
      if (!id) return;
      return dispatch(removeResidentAdmin(id)).unwrap();
    },
    [dispatch]
  );

  const importFromFile = useCallback(
    (file) => {
      if (!file) return;
      return dispatch(importResidents(file)).unwrap();
    },
    [dispatch]
  );

  const setSelectedResident = useCallback(
    (resident) => {
      dispatch(setSelectedResidentLocal(resident));
    },
    [dispatch]
  );

  return {
    residents,
    selectedResident,
    isLoading,
    isError,
    isSuccess,
    message,
    error: errorObj,
    refetch,
    toggleActive,
    deleteResident,
    importFromFile,
    setSelectedResident,
  };
};

export default useAdminResidents;
