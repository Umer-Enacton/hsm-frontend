'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';
import type { AppUser, UserFilters } from '@/types/user';

/**
 * Fetch all users for admin
 */
export function useAdminUsers() {
  return useQuery<AppUser[]>({
    queryKey: [QUERY_KEYS.USERS, 'admin'],
    queryFn: async () => {
      const response = await api.get<{ users: AppUser[] }>('/users');
      return response.users || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - users change moderately
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Filter users hook (client-side filtering)
 */
export function useFilteredUsers(users: AppUser[], filters: UserFilters) {
  return useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (filters.role !== 'all' && user.roleId !== filters.role) {
        return false;
      }

      // Search filter (name or email)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase().trim();
        const matchesName = user.name.toLowerCase().includes(searchLower);
        const matchesEmail = user.email.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}
