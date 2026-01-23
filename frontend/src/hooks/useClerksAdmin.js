// frontend/src/hooks/useClerksAdmin.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

export const clerkKeys = {
  all: ['clerks'],
  list: () => [...clerkKeys.all, 'list'],
};

/**
 * API helpers
 * Adjust endpoints to match your backend routes.
 */
const clerksAPI = {
  // GET /api/clerks  -> returns array of clerks
  getAll: async (token) => {
    const { data } = await axios.get('/api/clerks', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  // PATCH /api/clerks/:id/role  -> { role: "admin" | "clerk" }
  // Adjust path/body to whatever you actually implement.
  updateRole: async ({ id, role, token }) => {
    const { data } = await axios.patch(
      `/api/clerks/${id}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  },
};

/**
 * useClerksAdmin
 *
 * Admin-focused hook: lists all clerks
 * and lets you change roles (e.g. toggle admin).
 */
export const useClerksAdmin = () => {
  const { clerk } = useSelector((state) => state.auth);
  // 🔸 Adjust this if your token lives somewhere else (e.g. clerk.accessToken)
  const token = clerk?.token || clerk?.accessToken;
  const queryClient = useQueryClient();

  const {
    data: clerks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: clerkKeys.list(),
    queryFn: () => clerksAPI.getAll(token),
    enabled: !!token,
  });

  const {
    mutateAsync: updateRole,
    isLoading: isUpdatingRole,
  } = useMutation({
    mutationFn: ({ id, role }) => clerksAPI.updateRole({ id, role, token }),
    onSuccess: () => {
      toast.success('Updated clerk role');
      queryClient.invalidateQueries(clerkKeys.list());
    },
    onError: (err) => {
      console.error('[useClerksAdmin] updateRole error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update clerk role';
      toast.error(msg);
    },
  });

  const toggleAdmin = async (clerk) => {
    const isAdmin =
      clerk.isAdmin === true ||
      clerk.role === 'admin' ||
      clerk.role === 'superadmin';

    const nextRole = isAdmin ? 'clerk' : 'admin';

    await updateRole({
      id: clerk.id || clerk._id,
      role: nextRole,
    });
  };

  return {
    clerks,
    isLoading,
    isError,
    error,
    refetch,
    toggleAdmin,
    isUpdatingRole,
  };
};
