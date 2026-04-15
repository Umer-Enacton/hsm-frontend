'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

// ============================================================================
// Types
// ============================================================================

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  EstimateDuration?: number;
  imageUrl?: string;
  isActive: boolean;
  is_active?: boolean;
}

export interface Review {
  id: number;
  rating: number;
  comments?: string;
  customerName?: string;
  serviceName?: string;
  createdAt?: string;
}

export interface BusinessStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  totalRevenue: number;
  averageJobValue: number;
  totalReviews: number;
  averageRating: number;
  recentReviews: Review[];
}

export interface BusinessProfile {
  id: number;
  providerId: number;
  userId: number;
  businessName: string;
  name: string;
  description?: string;
  categoryId?: number;
  category?: string;
  phone?: string;
  state: string;
  city: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  isVerified: boolean;
  hasPaymentDetails?: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  status: string;
  totalReviews: number;
  rating?: number;
  email?: string;
  createdAt?: string;
}

// ============================================================================
// Provider Business Profile Hook
// ============================================================================

/**
 * Hook to fetch provider business profile with stats
 * All data is cached with appropriate staleTime based on how often it changes
 */
export function useProviderBusinessProfile(userId?: number) {
  // Fetch business profile
  const businessQuery = useQuery<BusinessProfile>({
    queryKey: [QUERY_KEYS.PROVIDER_BUSINESS, 'profile', userId],
    queryFn: async () => {
      const response = await api.get<{ business: BusinessProfile }>(
        API_ENDPOINTS.BUSINESS_BY_PROVIDER(userId || 0)
      );
      return response.business;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes - business rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    retry: false,
  });

  const businessId = businessQuery.data?.id;

  // Fetch services for this business
  const servicesQuery = useQuery<{ services: Service[] }>({
    queryKey: [QUERY_KEYS.PROVIDER_SERVICES, businessId, 'all'],
    queryFn: async () => {
      if (!businessId) return { services: [] };
      const response = await api.get<{ services: Service[] }>(
        API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId)
      );
      return response;
    },
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000, // 15 minutes - services change moderately
    gcTime: 30 * 60 * 1000,
  });

  // Fetch bookings for stats
  const bookingsQuery = useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, 'list', { businessId }],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<{ bookings?: any[] }>(API_ENDPOINTS.PROVIDER_BOOKINGS);
      return Array.isArray(response) ? response : response?.bookings || [];
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes - bookings can change status
    gcTime: 15 * 60 * 1000,
  });

  // Fetch reviews
  const reviewsQuery = useQuery<{ feedback: Review[] }>({
    queryKey: [QUERY_KEYS.PROVIDER_REVIEWS, businessId],
    queryFn: async () => {
      if (!businessId) return { feedback: [] };
      try {
        const response = await api.get<{ feedback: Review[] }>(
          API_ENDPOINTS.FEEDBACK_BUSINESS(businessId)
        );
        return response;
      } catch {
        return { feedback: [] };
      }
    },
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000, // 15 minutes - reviews change rarely
    gcTime: 30 * 60 * 1000,
  });

  // Calculate stats from bookings
  const stats: BusinessStats | null = businessQuery.data && bookingsQuery.data
    ? (() => {
        const bookings = bookingsQuery.data as any[];
        const services = servicesQuery.data?.services || [];
        const reviews = reviewsQuery.data?.feedback || [];

        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
        const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
        const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
        const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled').length;
        const completionRate = totalBookings > 0
          ? Math.round((completedBookings / totalBookings) * 100)
          : 0;

        const totalRevenue = bookings
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + (b.price || b.totalPrice || 0), 0);

        const averageJobValue = completedBookings > 0
          ? Math.round(totalRevenue / completedBookings)
          : 0;

        const activeServices = services.filter(
          (s: any) => s.isActive || s.is_active
        ).length;

        return {
          totalServices: services.length,
          activeServices,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
          completionRate,
          totalRevenue,
          averageJobValue,
          totalReviews: businessQuery.data.totalReviews || 0,
          averageRating: businessQuery.data.rating || 0,
          recentReviews: reviews.slice(0, 5),
        };
      })()
    : null;

  const isLoading = businessQuery.isLoading ||
    (!!businessId && (servicesQuery.isLoading || bookingsQuery.isLoading || reviewsQuery.isLoading));

  const isRefreshing = businessQuery.isFetching ||
    servicesQuery.isFetching ||
    bookingsQuery.isFetching ||
    reviewsQuery.isFetching;

  const error = businessQuery.error ||
    servicesQuery.error ||
    bookingsQuery.error ||
    reviewsQuery.error;

  const refetch = () => {
    businessQuery.refetch();
    servicesQuery.refetch();
    bookingsQuery.refetch();
    reviewsQuery.refetch();
  };

  return {
    business: businessQuery.data,
    services: servicesQuery.data?.services || [],
    stats,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
