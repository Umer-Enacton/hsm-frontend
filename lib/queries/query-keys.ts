/**
 * Query Keys Factory
 * Hierarchical query keys for React Query
 */

export const queryKeys = {
  bookings: {
    all: ["bookings"] as const,
    lists: () => [...queryKeys.bookings.all, "list"] as const,
    list: (filters: { status?: string; limit?: number }) =>
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.bookings.details(), id] as const,
    stats: () => [...queryKeys.bookings.all, "stats"] as const,
    recent: () => [...queryKeys.bookings.all, "recent"] as const,
  },

  services: {
    all: ["services"] as const,
    lists: () => [...queryKeys.services.all, "list"] as const,
    list: (filters: {
      categoryId?: number;
      state?: string;
      city?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
    }) => [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.services.details(), id] as const,
    featured: () => [...queryKeys.services.all, "featured"] as const,
  },

  slots: {
    all: ["slots"] as const,
    forBusiness: (businessId: number, date?: string, serviceId?: number) =>
      ["slots", { businessId, date, serviceId }] as const,
  },

  profile: {
    all: ["profile"] as const,
  },

  categories: {
    all: ["categories"] as const,
  },
} as const;
