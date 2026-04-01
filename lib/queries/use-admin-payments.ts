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
  isActive: boolean;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

/**
 * Fetch all payment details for admin
 */
export function useAdminPaymentDetails() {
  return useQuery<PaymentDetail[]>({
    queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'payment-details'],
    queryFn: async () => {
      const response = await api.get<{ details: PaymentDetail[] }>(API_ENDPOINTS.PAYMENT_DETAILS);
      return response.details || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Create payment detail mutation
 */
export function useCreatePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PaymentDetail>) => {
      return await api.post(API_ENDPOINTS.PAYMENT_DETAILS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'payment-details'] });
      toast.success('Payment detail added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add payment detail');
    },
  });
}

/**
 * Update payment detail mutation
 */
export function useUpdatePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ detailId, data }: { detailId: number; data: Partial<PaymentDetail> }) => {
      return await api.put(`${API_ENDPOINTS.PAYMENT_DETAILS}/${detailId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'payment-details'] });
      toast.success('Payment detail updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update payment detail');
    },
  });
}

/**
 * Set payment detail as active mutation
 */
export function useSetActivePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ detailId }: { detailId: number }) => {
      return await api.patch(API_ENDPOINTS.PAYMENT_DETAILS_SET_ACTIVE(detailId), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'payment-details'] });
      toast.success('Payment method set as active');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set active payment method');
    },
  });
}

/**
 * Delete payment detail mutation
 */
export function useDeletePaymentDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ detailId }: { detailId: number }) => {
      return await api.delete(API_ENDPOINTS.PAYMENT_DETAILS_DELETE(detailId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'payment-details'] });
      toast.success('Payment method deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete payment method');
    },
  });
}
