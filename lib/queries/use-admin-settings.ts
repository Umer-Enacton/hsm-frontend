'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

export interface AdminSettings {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  commissionRate?: number;
  currency?: string;
  timezone?: string;
  maintenanceMode?: boolean;
  minBookingAmount?: number;
  maxBookingAmount?: number;
  cancellationPolicy?: string;
  refundPolicy?: string;
  supportPhone?: string;
  supportEmail?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

/**
 * Fetch admin settings
 */
export function useAdminSettings() {
  return useQuery<AdminSettings>({
    queryKey: [QUERY_KEYS.ADMIN_SETTINGS],
    queryFn: async () => {
      const response = await api.get<AdminSettings>(API_ENDPOINTS.ADMIN_SETTINGS);
      return response;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - settings rarely change
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Update admin settings mutation
 */
export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AdminSettings>) => {
      return await api.put(API_ENDPOINTS.ADMIN_SETTINGS, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SETTINGS] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}
