'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

export interface Payout {
  id: number;
  providerId: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  utr?: string;
  createdAt: string;
  processedAt?: string;
  provider?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface PayoutFilters {
  status?: string;
  providerId?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Fetch all payouts for admin
 */
export function useAdminPayouts(filters?: PayoutFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.providerId) params.append('providerId', filters.providerId.toString());
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const queryString = params.toString();

  return useQuery<Payout[]>({
    queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'list', filters],
    queryFn: async () => {
      const url = API_ENDPOINTS.ADMIN_PAYOUTS + (queryString ? `?${queryString}` : '');
      const response = await api.get<{ payouts: Payout[] }>(url);
      return response.payouts || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - payout status changes
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Process payout mutation
 */
export function useProcessPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId }: { payoutId: number }) => {
      return await api.post(`${API_ENDPOINTS.ADMIN_PAYOUTS}/${payoutId}/process`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS] });
      toast.success('Payout processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payout');
    },
  });
}

/**
 * Get payouts by provider
 */
export function useProviderPayouts(providerId?: number) {
  return useQuery<Payout[]>({
    queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'provider', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const response = await api.get<{ payouts: Payout[] }>(`${API_ENDPOINTS.ADMIN_PAYOUTS_BY_PROVIDER}/${providerId}`);
      return response.payouts || [];
    },
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// Provider payout with payment details
export interface ProviderPayout {
  providerId: number;
  providerName: string;
  providerEmail: string;
  providerPhone: string | null;
  businessName: string;
  businessId: number;
  totalPending: number;
  bookingCount: number;
  paymentIds: number[];
  canProcessPayout: boolean;
  minimumPayoutAmount: number;
  paymentDetails?: {
    upiId?: string | null;
    bankAccount?: string | null;
    bankAccountMasked?: string | null;
    ifscCode?: string | null;
    accountHolderName?: string | null;
  };
}

export interface ProviderPayoutsResponse {
  providers: ProviderPayout[];
  minimumPayoutAmount: number;
}

export interface PayoutSummary {
  totalPendingAmount: number;
  totalPaidAmount: number;
  pendingCount: number;
  paidCount: number;
  minimumPayoutAmount: number;
}

/**
 * Fetch provider-grouped payouts with filter
 */
export function useProviderGroupedPayouts(filter: string = "all") {
  return useQuery<ProviderPayout[]>({
    queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'grouped', filter],
    queryFn: async () => {
      const response = await api.get<ProviderPayoutsResponse>(
        `${API_ENDPOINTS.ADMIN_PAYOUTS_BY_PROVIDER}?filter=${filter}`,
      );
      return response.providers || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - payout status changes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch payout summary
 */
export function usePayoutSummary() {
  return useQuery<PayoutSummary>({
    queryKey: [QUERY_KEYS.ADMIN_PAYOUTS, 'summary'],
    queryFn: async () => {
      return await api.get<PayoutSummary>(`${API_ENDPOINTS.ADMIN_PAYOUTS}/summary`);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Pay all pending payouts for a provider
 */
export function usePayProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerId }: { providerId: number }) => {
      return await api.put(`${API_ENDPOINTS.ADMIN_PAYOUTS}/provider/${providerId}/pay-all`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS] });
      toast.success('Provider payout processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process provider payment');
    },
  });
}

/**
 * Pay multiple providers at once (bulk payment)
 */
export function usePayBulkProviders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerIds }: { providerIds: number[] }) => {
      // Process all providers in parallel
      const promises = providerIds.map((providerId) =>
        api.put(`${API_ENDPOINTS.ADMIN_PAYOUTS}/provider/${providerId}/pay-all`, {})
      );
      return await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS] });
      toast.success(
        `Successfully paid ${variables.providerIds.length} provider${variables.providerIds.length > 1 ? 's' : ''}`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process some payments');
    },
  });
}
