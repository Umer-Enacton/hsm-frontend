/**
 * Query Keys Factory
 * Hierarchical query keys for React Query
 */

export const queryKeys = {
  addresses: {
    all: ["address"] as const,
  },
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

  // Provider-specific query keys
  provider: {
    all: ["provider"] as const,
    bookings: {
      all: ["provider", "bookings"] as const,
      lists: () => [...queryKeys.provider.bookings.all, "list"] as const,
      list: (filters: { status?: string }) =>
        [...queryKeys.provider.bookings.lists(), filters] as const,
      detail: (id: number) =>
        [...queryKeys.provider.bookings.all, "detail", id] as const,
    },
    business: {
      all: ["provider", "business"] as const,
      detail: (userId?: number) =>
        [...queryKeys.provider.business.all, "detail", userId] as const,
    },
    services: {
      all: ["provider", "services"] as const,
      forBusiness: (businessId: number) =>
        [...queryKeys.provider.services.all, businessId] as const,
    },
    dashboard: {
      all: ["provider", "dashboard"] as const,
      stats: () => [...queryKeys.provider.dashboard.all, "stats"] as const,
    },
    revenue: {
      all: ["provider", "revenue"] as const,
      stats: () => [...queryKeys.provider.revenue.all, "stats"] as const,
    },
    analytics: {
      all: ["provider", "analytics"] as const,
      revenue: (period: string) =>
        [...queryKeys.provider.analytics.all, "revenue", period] as const,
      services: (period: string) =>
        [...queryKeys.provider.analytics.all, "services", period] as const,
      status: (period: string) =>
        [...queryKeys.provider.analytics.all, "status", period] as const,
    },
  },
} as const;
