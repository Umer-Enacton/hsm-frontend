'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';

// Types
export interface Staff {
  id: number;
  userId: number;
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: "active" | "inactive" | "on_leave" | "terminated";
  totalEarnings: number;
  pendingPayout: number;
  totalPaid: number;
  joinDate: string;
  createdAt: string;
}

export interface StaffLeave {
  id: number;
  staffId: number;
  staffName: string;
  staffEmail: string;
  staffAvatar: string | null;
  employeeId: string;
  leaveType: "full_day" | "half_day" | "hours";
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

export interface StaffFilters {
  status: "all" | "active" | "inactive" | "on_leave";
  search: string;
}

/**
 * Query keys for staff
 */
export const STAFF_QUERY_KEYS = {
  all: ['staff'] as const,
  business: ['staff', 'business'] as const,
  leave: ['staff', 'leave'] as const,
};

/**
 * Fetch all staff for provider
 */
export function useProviderStaff() {
  return useQuery<Staff[]>({
    queryKey: [STAFF_QUERY_KEYS.all],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: Staff[] }>(
        API_ENDPOINTS.STAFF,
      );
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch staff leave requests for business
 */
export function useStaffLeaveRequests() {
  return useQuery<StaffLeave[]>({
    queryKey: [STAFF_QUERY_KEYS.leave],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: StaffLeave[] }>(
        API_ENDPOINTS.STAFF_LEAVE_BUSINESS,
      );
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Filter staff hook (client-side filtering)
 */
export function useFilteredStaff(staff: Staff[], filters: StaffFilters) {
  return useMemo(() => {
    return staff.filter((staffMember) => {
      // Status filter
      if (filters.status !== 'all' && staffMember.status !== filters.status) {
        return false;
      }

      // Search filter (name or email)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase().trim();
        const matchesName = staffMember.name.toLowerCase().includes(searchLower);
        const matchesEmail = staffMember.email.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [staff, filters]);
}

/**
 * Delete staff mutation
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(API_ENDPOINTS.STAFF_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.all] });
      toast.success('Staff member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove staff member');
    },
  });
}

/**
 * Update staff status mutation
 */
export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Staff["status"] }) => {
      return await api.patch(API_ENDPOINTS.STAFF_UPDATE_STATUS(id), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.all] });
      toast.success('Staff status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update staff status');
    },
  });
}

/**
 * Add staff mutation
 */
export function useAddStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: Partial<Staff>) => {
      return await api.post(API_ENDPOINTS.STAFF, staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.all] });
      toast.success('Staff member added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add staff member');
    },
  });
}

/**
 * Update staff mutation
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Staff>) => {
      return await api.put(API_ENDPOINTS.STAFF_BY_ID(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.all] });
      toast.success('Staff updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update staff');
    },
  });
}
