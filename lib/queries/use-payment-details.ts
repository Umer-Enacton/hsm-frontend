'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

export interface PaymentDetail {
  id: number;
  userId: number;
  paymentType: 'upi' | 'bank';
  upiId?: string;
  bankAccount?: string;
  ifscCode?: string;
  accountHolderName?: string;
  razorpayContactId?: string;
  razorpayFundAccountId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Payment Details Hook
// ============================================================================

/**
 * Fetch payment details for the logged-in provider
 * Payment details change rarely (only when provider adds/removes payment methods)
 */
export function usePaymentDetails() {
  return useQuery<PaymentDetail[]>({
    queryKey: [QUERY_KEYS.PROFILE, 'payment-details'],
    queryFn: async () => {
      const response = await api.get<{ details: PaymentDetail[] }>(
        API_ENDPOINTS.PAYMENT_DETAILS
      );
      return response.details || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - payment details rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * Set a payment detail as active
 */
export function useSetActivePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ detailId }: { detailId: number }) => {
      await api.patch(API_ENDPOINTS.PAYMENT_DETAILS_SET_ACTIVE(detailId), {});
      return { detailId };
    },
    onSuccess: () => {
      // Invalidate payment details queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, 'payment-details'] });
      toast.success('Payment method set as active');
    },
    onError: (error: any) => {
      console.error('Error setting active payment:', error);
      toast.error(error.message || 'Failed to set active payment method');
    },
  });
}

/**
 * Add a new payment detail
 */
export function useAddPaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      paymentType: 'upi' | 'bank';
      upiId?: string;
      bankAccount?: string;
      ifscCode?: string;
      accountHolderName?: string;
    }) => {
      const response = await api.post(API_ENDPOINTS.PAYMENT_DETAILS, data);
      return response;
    },
    onSuccess: () => {
      // Invalidate payment details queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, 'payment-details'] });
      toast.success('Payment method added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding payment detail:', error);
      toast.error(error.message || 'Failed to add payment method');
    },
  });
}

/**
 * Update a payment detail
 */
export function useUpdatePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ detailId, data }: {
      detailId: number;
      data: {
        paymentType: 'upi' | 'bank';
        upiId?: string;
        bankAccount?: string;
        ifscCode?: string;
        accountHolderName?: string;
      };
    }) => {
      await api.put(`${API_ENDPOINTS.PAYMENT_DETAILS}/${detailId}`, data);
      return { detailId };
    },
    onSuccess: () => {
      // Invalidate payment details queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, 'payment-details'] });
      toast.success('Payment method updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating payment detail:', error);
      toast.error(error.message || 'Failed to update payment method');
    },
  });
}

/**
 * Delete a payment detail
 */
export function useDeletePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ detailId }: { detailId: number }) => {
      await api.delete(API_ENDPOINTS.PAYMENT_DETAILS_DELETE(detailId));
      return { detailId };
    },
    onSuccess: () => {
      // Invalidate payment details queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, 'payment-details'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting payment detail:', error);
      toast.error(error.message || 'Failed to delete payment method');
    },
  });
}
