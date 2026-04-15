'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

export interface AdminService {
  id: number;
  businessId: number;
  businessProfileId?: number;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  image?: string;
  isActive: boolean;
  is_active?: boolean;
  rating?: number;
  totalReviews?: number;
  createdAt?: string;
  // Provider info
  provider?: {
    id: number;
    businessName: string;
    providerName?: string;
    email?: string;
    phone?: string;
    city?: string;
    isVerified?: boolean;
  };
  // Category info
  category?: {
    id: number;
    name: string;
  };
}

export interface AdminBusiness {
  id: number;
  userId: number;
  providerId: number;
  businessName: string;
  name?: string;
  description?: string;
  categoryId?: number;
  category?: string;
  phone?: string;
  state?: string;
  city?: string;
  logo?: string;
  isVerified?: boolean;
  status?: string;
  rating?: number;
  totalReviews?: number;
}

/**
 * Fetch all services for admin with pagination and filters
 */
export function useAdminServices(params?: {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  search?: string;
}) {
  const { page = 1, limit = 10, status, search } = params || {};

  return useQuery<{
    services: AdminService[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [QUERY_KEYS.ADMIN_SERVICES, 'list', params || {}],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      const response = await api.get<{
        services: AdminService[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`${API_ENDPOINTS.ADMIN_SERVICES}?${queryParams.toString()}`);

      return {
        services: response.services || [],
        pagination: response.pagination || {
          page,
          limit,
          total: response.services?.length || 0,
          totalPages: Math.ceil((response.services?.length || 0) / limit),
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - services change moderately
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch service statistics for admin dashboard
 */
export function useServiceStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_SERVICES, 'stats'],
    queryFn: async () => {
      // Fetch all services with a high limit to calculate stats
      const response = await api.get<{
        services: AdminService[];
      }>(`${API_ENDPOINTS.ADMIN_SERVICES}?limit=10000`);

      const allServices = response.services || [];
      const activeCount = allServices.filter(s => s.isActive).length;

      return {
        total: allServices.length,
        active: activeCount,
        inactive: allServices.length - activeCount,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats change periodically
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch all businesses for admin (simple array version)
 * Note: For full-featured business management, use useAdminBusinessList from use-admin-business.ts
 */
export function useAdminBusinessesArray() {
  return useQuery<AdminBusiness[]>({
    queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'array'],
    queryFn: async () => {
      const response = await api.get<{ businesses: AdminBusiness[] }>(API_ENDPOINTS.BUSINESSES);
      return response.businesses || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - businesses change rarely
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Fetch service detail with related data
 */
export function useAdminServiceDetail(serviceId?: number) {
  return useQuery<{
    service: AdminService;
    business: AdminBusiness;
    user: { id: number; name: string; email: string; phone?: string; avatar?: string | null } | null;
  } | null>({
    queryKey: [QUERY_KEYS.ADMIN_SERVICES, 'detail', serviceId],
    queryFn: async (): Promise<{
      service: AdminService;
      business: AdminBusiness;
      user: { id: number; name: string; email: string; phone?: string; avatar?: string | null } | null;
    } | null> => {
      if (!serviceId) return null;

      const [serviceResponse, businessesResponse] = await Promise.all([
        api.get<{ service: AdminService }>(`${API_ENDPOINTS.SERVICES}/${serviceId}`),
        api.get<{ businesses: AdminBusiness[] }>(API_ENDPOINTS.BUSINESSES),
      ]);

      const service = serviceResponse.service || (serviceResponse as any);
      
      if (!service || (typeof service !== 'object')) {
        return null;
      }

      let business = businessesResponse.businesses?.find((b) => b.id === service.businessId);

      if (!business) {
        business = businessesResponse.businesses?.find((b) => b.id === service.businessProfileId);
      }

      const providerId = business?.userId || business?.providerId;
      let userData = null;

      if (providerId) {
        try {
          const userResponse: any = await api.get(`${API_ENDPOINTS.USERS}/${providerId}`);
          userData = userResponse.user || userResponse;
        } catch (e) {
          console.error("Hook could not fetch provider info:", e);
        }
      }

      return {
        service,
        business: business!,
        user: userData ? {
          id: userData.id || (providerId as number),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          avatar: userData.avatar || userData.profile_image,
        } : null,
      };
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Update service mutation
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, data }: { serviceId: number; data: Partial<AdminService> }) => {
      return await api.put(`${API_ENDPOINTS.SERVICES}/${serviceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SERVICES] });
      toast.success('Service updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service');
    },
  });
}

/**
 * Delete service mutation
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId }: { serviceId: number }) => {
      return await api.delete(`${API_ENDPOINTS.SERVICES}/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SERVICES] });
      toast.success('Service deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete service');
    },
  });
}

/**
 * Toggle service active status mutation
 */
export function useToggleServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: number; isActive: boolean }) => {
      return await api.patch(`${API_ENDPOINTS.SERVICES}/${serviceId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SERVICES] });
      toast.success('Service status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service status');
    },
  });
}

/**
 * Fetch user by ID
 */
export function useUserById(userId?: number) {
  return useQuery<{ id: number; name: string; email: string; phone?: string; avatar?: string | null; user?: { avatar?: string | null }; profile_image?: string | null } | null>({
    queryKey: ['users', userId],
    queryFn: async () => {
      if (!userId) return null;
      return await api.get(`${API_ENDPOINTS.USERS}/${userId}`);
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes - user data changes rarely
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Fetch business by ID
 */
export function useBusinessById(businessId?: string | number) {
  return useQuery<AdminBusiness | null>({
    queryKey: [QUERY_KEYS.ADMIN_BUSINESSES, 'detail', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const response = await api.get<{ business: AdminBusiness }>(API_ENDPOINTS.BUSINESS_BY_ID(String(businessId)));
      return response.business || response;
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch services by business ID
 */
export function useServicesByBusiness(businessId?: string | number) {
  return useQuery<AdminService[]>({
    queryKey: [QUERY_KEYS.ADMIN_SERVICES, 'business', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<{ services?: AdminService[] }>(API_ENDPOINTS.SERVICES_BY_BUSINESS(String(businessId)));
      return Array.isArray(response) ? response : response?.services || [];
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
