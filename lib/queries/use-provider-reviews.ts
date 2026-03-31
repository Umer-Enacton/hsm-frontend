'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_ENDPOINTS } from '@/lib/api';
import { getUserData } from '@/lib/auth-utils';
import { QUERY_KEYS } from './query-keys';

export interface Service {
  id: number;
  name: string;
}

export interface ReviewData {
  id: number;
  bookingId: number;
  rating: number;
  comments?: string;
  createdAt: string;
  customerId: number;
  customer: {
    name: string;
    avatar?: string;
  };
  serviceId: number;
  isVisible: boolean;
  providerReply?: string;
  repliedAt?: string;
}

/**
 * Provider reviews hook
 * Reviews change rarely (only when new reviews are added or replies are made)
 */
export function useProviderReviews(businessId?: number, filters?: {
  rating?: string;
  serviceId?: string;
  isVisible?: boolean;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.rating) params.append('rating', filters.rating);
  if (filters?.serviceId) params.append('serviceId', filters.serviceId);
  if (filters?.isVisible !== undefined) params.append('isVisible', filters.isVisible.toString());
  if (filters?.search) params.append('search', filters.search);

  const queryString = params.toString();

  const reviewsQuery = useQuery<{
    feedback: ReviewData[];
  }>({
    queryKey: [QUERY_KEYS.PROVIDER_REVIEWS, businessId, filters],
    queryFn: () => {
      const url = API_ENDPOINTS.FEEDBACK_BUSINESS(businessId!) +
        (queryString ? `?${queryString}` : '');
      return api.get(url);
    },
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000, // 15 minutes - reviews change rarely
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });

  const servicesQuery = useQuery<{
    services: Service[];
  }>({
    queryKey: [QUERY_KEYS.PROVIDER_SERVICES, businessId],
    queryFn: () => api.get(API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId!)),
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes - services list changes moderately
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const isLoading = !businessId || reviewsQuery.isLoading || servicesQuery.isLoading;
  const isRefreshing = reviewsQuery.isFetching || servicesQuery.isFetching;

  return {
    reviews: reviewsQuery.data?.feedback || [],
    services: servicesQuery.data?.services || [],
    isLoading,
    isRefreshing,
    error: reviewsQuery.error || servicesQuery.error,
    refetch: () => {
      reviewsQuery.refetch();
      servicesQuery.refetch();
    },
  };
}
