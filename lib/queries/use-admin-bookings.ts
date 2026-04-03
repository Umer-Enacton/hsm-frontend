'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';
import { invalidateBookingQueries, invalidateNotificationQueries } from './query-invalidation';

export interface AdminBookingFilters {
  status?: string;
  search?: string;
  providerId?: number;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AdminBooking {
  id: number;
  bookingId: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  businessId: number;
  businessName: string;
  providerId: number;
  providerName: string;
  providerPhone: string;
  serviceId: number;
  serviceName: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  bookingDate: string;
  startTime: string;
  endTime: string;
  address: string;
  createdAt: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  completionNotes?: string | null;
}

/**
 * Fetch all admin bookings with optional filters and pagination
 * Bookings change status frequently, so shorter cache time
 */
export function useAdminBookings(filters?: AdminBookingFilters) {
  const { page = 1, limit = 10 } = filters || {};

  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.providerId) params.append('providerId', filters.providerId.toString());
  if (filters?.customerId) params.append('customerId', filters.customerId.toString());
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const queryString = params.toString();

  return useQuery<{
    bookings: AdminBooking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [QUERY_KEYS.ADMIN_BOOKINGS, 'list', filters],
    queryFn: async () => {
      const url = API_ENDPOINTS.ADMIN_BOOKINGS_ALL + (queryString ? `?${queryString}` : '');
      const response = await api.get<{
        bookings: AdminBooking[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(url);
      return {
        bookings: response.bookings || [],
        pagination: response.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - bookings change status often
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Accept booking mutation
 */
export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: number }) => {
      return await api.put(API_ENDPOINTS.ACCEPT_BOOKING(bookingId), {});
    },
    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success('Booking accepted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept booking');
    },
  });
}

/**
 * Reject booking mutation
 */
export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: number }) => {
      return await api.put(API_ENDPOINTS.REJECT_BOOKING(bookingId), {});
    },
    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success('Booking rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject booking');
    },
  });
}

/**
 * Cancel booking mutation
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: number }) => {
      return await api.put(API_ENDPOINTS.CANCEL_BOOKING(bookingId), {});
    },
    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success('Booking cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });
}
