'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';
import type { Service } from '@/types/provider';

export interface ProviderServiceStats {
  totalServices: number;
  activeServices: number;
  averagePrice: number;
  totalReviews: number;
  averageRating: number;
}

// ============================================================================
// Provider Services Hook
// ============================================================================

/**
 * Fetch services for a provider business
 * Services change moderately (providers add/update/remove services)
 */
export function useProviderServices(businessId?: number) {
  return useQuery<Service[]>({
    queryKey: [QUERY_KEYS.PROVIDER_SERVICES, businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<{ services: Service[] }>(
        API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId)
      );
      return response.services || [];
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes - services change moderately
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch service stats for a business
 */
export function useProviderServiceStats(businessId?: number) {
  return useQuery<ProviderServiceStats>({
    queryKey: [QUERY_KEYS.PROVIDER_SERVICES, businessId, 'stats'],
    queryFn: async () => {
      if (!businessId) {
        return {
          totalServices: 0,
          activeServices: 0,
          averagePrice: 0,
          totalReviews: 0,
          averageRating: 0,
        };
      }
      const response = await api.get<{ stats: ProviderServiceStats }>(
        `${API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId)}/stats`
      );
      return response.stats || {
        totalServices: 0,
        activeServices: 0,
        averagePrice: 0,
        totalReviews: 0,
        averageRating: 0,
      };
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, serviceData }: {
      businessId: number;
      serviceData: {
        name: string;
        description?: string;
        price: number;
        duration?: number;
        image?: string;
        isActive?: boolean;
      };
    }) => {
      const response = await api.post(API_ENDPOINTS.SERVICES, {
        businessProfileId: businessId,
        ...serviceData,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES, variables.businessId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES, variables.businessId, 'stats'] });
      toast.success('Service created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Failed to create service');
    },
  });
}

/**
 * Update an existing service
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, serviceData }: {
      serviceId: number;
      serviceData: {
        name?: string;
        description?: string;
        price?: number;
        duration?: number;
        image?: string;
        isActive?: boolean;
      };
    }) => {
      const response = await api.put(`${API_ENDPOINTS.SERVICES}/${serviceId}`, serviceData);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate all provider services queries (we don't have businessId here, so invalidate all)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] });
      toast.success('Service updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Failed to update service');
    },
  });
}

/**
 * Delete a service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, businessId }: { serviceId: number; businessId?: number }) => {
      await api.delete(`${API_ENDPOINTS.SERVICES}/${serviceId}`);
      return { serviceId, businessId };
    },
    onSuccess: (_, variables) => {
      if (variables.businessId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES, variables.businessId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES, variables.businessId, 'stats'] });
      } else {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES] });
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] });
      toast.success('Service deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
    },
  });
}

/**
 * Toggle service active status
 */
export function useToggleServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, isActive, businessId }: {
      serviceId: number;
      isActive: boolean;
      businessId?: number;
    }) => {
      await api.patch(`${API_ENDPOINTS.SERVICES}/${serviceId}`, { isActive });
      return { serviceId, isActive, businessId };
    },
    onSuccess: (_, variables) => {
      if (variables.businessId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES, variables.businessId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES, variables.businessId, 'stats'] });
      } else {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES] });
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] });
      toast.success(variables.isActive ? 'Service activated' : 'Service deactivated');
    },
    onError: (error: any) => {
      console.error('Error toggling service status:', error);
      toast.error(error.message || 'Failed to update service status');
    },
  });
}

/**
 * Upload service image
 */
export function useUploadServiceImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'services_preset');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return { url: data.secure_url, publicId: data.public_id };
    },
    onError: (error: any) => {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    },
  });
}
