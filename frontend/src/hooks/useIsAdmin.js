// frontend/src/hooks/useIsAdmin.js
import { useSelector } from 'react-redux';

/**
 * useIsAdmin
 *
 * Centralized admin check so we don't duplicate logic
 * across AppShell, routes, AdminScreen, etc.
 */
export const useIsAdmin = () => {
  const { clerk } = useSelector((state) => state.auth);

  return Boolean(
    clerk?.isAdmin === true ||
      clerk?.role === 'admin' ||
      clerk?.role === 'superadmin'
  );
};

/**
 * Optional helper if you ever want easy access
 * to the current clerk object.
 */
export const useCurrentClerk = () => {
  const { clerk } = useSelector((state) => state.auth);
  return clerk || null;
};
