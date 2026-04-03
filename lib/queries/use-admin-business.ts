'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';
import type { Business } from '@/types/provider';

export interface AdminBusinessListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'pending' | 'verified' | 'blocked';
  state?: string;
  categoryId?: number;
  sortBy?: 'name' | 'createdAt' | 'rating' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface BusinessStats {
  total: number;
  pending: number;
  verified: number;
  blocked: number;
  suspended: number;
}

/**
 * Fetch all businesses for admin with filters
 */
export function useAdminBusinessList(params: AdminBusinessListParams = {}) {
  const { page = 1, limit = 10 } = params;

  return useQuery<{
    businesses: Business[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'list', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.state) queryParams.append('state', params.state);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const endpoint = `${API_ENDPOINTS.BUSINESSES}?${queryParams.toString()}`;

      const response = await api.get<{
        businesses: Business[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(endpoint);

      return {
        businesses: response.businesses || [],
        pagination: response.pagination || {
          page,
          limit,
          total: response.businesses?.length || 0,
          totalPages: Math.ceil((response.businesses?.length || 0) / limit),
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - business list changes moderately
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch business statistics for admin dashboard
 */
export function useBusinessStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'stats'],
    queryFn: async (): Promise<BusinessStats> => {
      // Fetch all businesses and calculate stats
      // TODO: Create dedicated stats endpoint in backend
      const response = await api.get<{ businesses: Business[] }>(
        `${API_ENDPOINTS.BUSINESSES}?limit=1000`
      );
      const businesses = response.businesses || [];

      return {
        total: businesses.length,
        pending: businesses.filter(b => !b.isVerified && !b.isBlocked).length,
        verified: businesses.filter(b => b.isVerified && !b.isBlocked).length,
        blocked: businesses.filter(b => b.isBlocked).length,
        suspended: 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats change periodically
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Verify business mutation
 */
export function useVerifyBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessId: number) => {
      return await api.put<{ message: string; business: Business }>(
        API_ENDPOINTS.VERIFY_BUSINESS(businessId),
        {}
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'stats'] });
      toast.success('Business verified successfully', {
        description: data.business.name,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify business');
    },
  });
}

/**
 * Unverify business mutation
 */
export function useUnverifyBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessId: number) => {
      return await api.put<{ message: string; business: Business }>(
        API_ENDPOINTS.UPDATE_BUSINESS(businessId),
        { isVerified: false }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'stats'] });
      toast.success('Business unverified', {
        description: `${data.business.name} is now pending verification`,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unverify business');
    },
  });
}

/**
 * Block business mutation
 */
export function useBlockBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, reason }: { businessId: number; reason: string }) => {
      return await api.put<{ message: string; business: Business }>(
        API_ENDPOINTS.ADMIN_BLOCK_BUSINESS(businessId),
        { reason }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'stats'] });
      toast.success('Business blocked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to block business');
    },
  });
}

/**
 * Unblock business mutation
 */
export function useUnblockBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessId: number) => {
      return await api.put<{ message: string; business: Business }>(
        API_ENDPOINTS.ADMIN_UNBLOCK_BUSINESS(businessId),
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'stats'] });
      toast.success('Business unblocked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unblock business');
    },
  });
}
