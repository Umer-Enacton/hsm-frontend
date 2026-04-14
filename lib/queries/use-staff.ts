'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';

// Types
export interface StaffBooking {
  id: number;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatar?: string;
  businessAddress: string;
  bookingDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'missed' | 'reschedule_pending';
  totalPrice: number;
  completionOtp?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completionNotes?: string;
  staff_earning_type?: 'commission' | 'fixed' | null;
  staff_commission_percent?: number | null;
  staff_fixed_amount?: number | null;
  staff_earning?: number | null;
  assignedAt?: string;
}

export interface StaffEarning {
  id: number;
  amount: number;
  payoutStatus: "pending" | "processing" | "paid" | "failed";
  calculationType: string;
  bookingId: number;
  createdAt: string;
  payoutDate: string | null;
}

export interface StaffLeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  rejectionReason?: string;
}

export interface StaffDashboard {
  todayBookings: StaffBooking[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    totalEarnings: number;
    pendingEarnings: number;
  };
}

export interface StaffPaymentDetail {
  id: number;
  paymentType: "upi" | "bank";
  upiId: string | null;
  bankAccount: string | null;
  ifscCode: string | null;
  accountHolderName: string | null;
  isActive: boolean;
  createdAt: string;
}

// For backwards compatibility
export type StaffPaymentDetails = StaffPaymentDetail[];

export interface StaffProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  employeeId: string;
}

/**
 * Query keys for staff
 */
export const STAFF_QUERY_KEYS = {
  all: ['staff'] as const,
  dashboard: ['staff', 'dashboard'] as const,
  bookings: ['staff', 'bookings'] as const,
  earnings: ['staff', 'earnings'] as const,
  leave: ['staff', 'leave'] as const,
  payment: ['staff', 'payment'] as const,
  profile: ['staff', 'profile'] as const,
} as const;

/**
 * Fetch staff dashboard data
 */
export function useStaffDashboard() {
  return useQuery({
    queryKey: [STAFF_QUERY_KEYS.dashboard],
    queryFn: async (): Promise<StaffDashboard> => {
      const [bookingsRes, statsRes] = await Promise.all([
        api.get<{ message: string; data: StaffBooking[] }>(
          API_ENDPOINTS.BOOKING_STAFF_MY_BOOKINGS
        ),
        api.get<{ message: string; data: any }>(
          '/staff/stats'
        ).catch(() => ({ data: { totalBookings: 0, completedBookings: 0, totalEarnings: 0, pendingEarnings: 0 } })),
      ]);

      // Filter today's bookings
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = (bookingsRes?.data || []).filter(
        (b: StaffBooking) => b.bookingDate.startsWith(today)
      );

      return {
        todayBookings,
        stats: statsRes?.data || { totalBookings: 0, completedBookings: 0, totalEarnings: 0, pendingEarnings: 0 },
      };
    },
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Fetch staff bookings
 */
export function useStaffBookings() {
  return useQuery({
    queryKey: [STAFF_QUERY_KEYS.bookings],
    queryFn: async (): Promise<StaffBooking[]> => {
      const response = await api.get<{ message: string; data: StaffBooking[] }>(
        API_ENDPOINTS.BOOKING_STAFF_MY_BOOKINGS
      );
      return response?.data || [];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch staff earnings with totals
 */
export function useStaffEarnings(period: string = "month") {
  return useQuery({
    queryKey: [STAFF_QUERY_KEYS.earnings, period],
    queryFn: async () => {
      const response = await api.get<{
        message: string;
        data: {
          earnings: StaffEarning[];
          totals: {
            totalEarnings: number;
            pendingPayout: number;
            paidAmount: number;
            completedBookings: number;
          };
        };
      }>(`${API_ENDPOINTS.STAFF_PAYOUTS_MY_EARNINGS}?period=${period}`);
      return response?.data || { earnings: [], totals: { totalEarnings: 0, pendingPayout: 0, paidAmount: 0, completedBookings: 0 } };
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch staff leave history
 */
export function useStaffLeaveHistory(status?: string) {
  return useQuery({
    queryKey: [STAFF_QUERY_KEYS.leave, status],
    queryFn: async (): Promise<StaffLeaveRequest[]> => {
      const url = status
        ? `${API_ENDPOINTS.STAFF_LEAVE_MY_LEAVE}?status=${status}`
        : API_ENDPOINTS.STAFF_LEAVE_MY_LEAVE;

      const response = await api.get<{ message: string; data: StaffLeaveRequest[] }>(url);
      return response?.data || [];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch staff payment details
 */
export function useStaffPaymentDetails() {
  return useQuery({
    queryKey: [STAFF_QUERY_KEYS.payment],
    queryFn: async (): Promise<StaffPaymentDetails> => {
      const response = await api.get<{ message: string; data: StaffPaymentDetails }>(
        '/staff/payment-details'
      ).catch(() => ({ data: [] }));

      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch staff profile
 */
export function useStaffProfile() {
  return useQuery({
    queryKey: [STAFF_QUERY_KEYS.profile],
    queryFn: async (): Promise<StaffProfile | null> => {
      const response = await api.get<{ message: string; data: StaffProfile }>(
        '/staff/me'
      ).catch(() => null);

      return response?.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create staff leave mutation
 */
export function useCreateStaffLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { leaveType: string; startDate: string; endDate: string; reason?: string }) => {
      const response = await api.post<{
        message: string;
        data: StaffLeaveRequest;
        warning?: any;
      }>(API_ENDPOINTS.STAFF_LEAVE, data);

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Leave request submitted');

      if (response.warning) {
        toast.warning(response.warning.message, { duration: 5000 });
      }

      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.leave] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit leave request');
    },
  });
}

/**
 * Cancel staff leave mutation
 */
export function useCancelStaffLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaveId: number) => {
      return api.patch(`${API_ENDPOINTS.STAFF_LEAVE_CANCEL(leaveId)}`, {});
    },
    onSuccess: () => {
      toast.success('Leave request cancelled');
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.leave] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel leave request');
    },
  });
}

/**
 * Update staff profile mutation
 */
export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; phone?: string; avatar?: string }) => {
      return api.put('/staff/profile', data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.profile] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

/**
 * Upsert staff payment details mutation
 */
export function useUpsertPaymentDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { paymentType: 'upi' | 'bank'; upiId?: string; bankAccountNumber?: string; bankIfsc?: string; bankAccountHolder?: string }) => {
      return api.post('/staff/payment-details', data);
    },
    onSuccess: () => {
      toast.success('Payment details saved successfully');
      queryClient.invalidateQueries({ queryKey: [STAFF_QUERY_KEYS.payment] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save payment details');
    },
  });
}
