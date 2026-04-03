'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';
import type { Category, CategoryFormData } from '@/types/category';

/**
 * Fetch all categories for admin with pagination
 */
export function useAdminCategories(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 10 } = params || {};

  return useQuery<{
    categories: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [QUERY_KEYS.CATEGORIES, 'admin', params || {}],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const response = await api.get<{
        categories: Category[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`${API_ENDPOINTS.CATEGORIES}?${queryParams.toString()}`);

      return {
        categories: response.categories || [],
        pagination: response.pagination || {
          page,
          limit,
          total: response.categories?.length || 0,
          totalPages: Math.ceil((response.categories?.length || 0) / limit),
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories change rarely
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Add category mutation
 */
export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return await api.post<{ category: Category }>(API_ENDPOINTS.CATEGORIES, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success('Category added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add category');
    },
  });
}

/**
 * Update category mutation
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      return await api.put<{ category: Category }>(`/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success('Category updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

/**
 * Delete category mutation
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}
