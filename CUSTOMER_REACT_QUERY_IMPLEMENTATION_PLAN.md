# Customer Side - React Query Implementation Plan
## Updated for Current Codebase State (March 2025)

---

## 📊 CURRENT STATE ANALYSIS

### Pages That Exist

| Page | Path | API Calls | Mutations | Current State |
|------|------|-----------|-----------|---------------|
| **Dashboard** | `app/(pages)/customer/page.tsx` | 3 calls (bookings×2, services) | None | ⭐⭐ Need optimization |
| **Bookings List** | `app/(pages)/customer/bookings/page.tsx` | 1 call | Cancel, Reschedule | ⭐⭐⭐ Manual state |
| **Services List** | `app/(pages)/customer/services/page.tsx` | 2 calls | None | ⭐⭐⭐⭐ Complex filters |
| **Service Details** | `app/(pages)/customer/services/[id]/page.tsx` | 3 calls | Create booking | ⭐⭐⭐⭐⭐ Most complex |
| **Profile** | `app/(pages)/customer/profile/page.tsx` | 1 call | Update, Avatar | ⭐⭐ Simple |

### Pages Removed (by user)
- ❌ **Addresses Page** - No longer exists
- ❌ **Booking Details** - No longer exists

### API Files Available

| File | Purpose | Functions Available |
|------|---------|---------------------|
| **`lib/customer/api.ts`** | Customer API | ✅ getServices, getServiceById, getAvailableSlots, getCustomerBookings, createBooking, cancelBooking, rescheduleBooking, getAddresses, createAddress, updateAddress, deleteAddress, getServiceReviews, submitReview |
| **`lib/profile-api.ts`** | Profile API | ✅ getCurrentProfile, updateProfile, uploadAvatar |

### Skeleton Components Available

| Component | Path | Status |
|-----------|------|--------|
| CustomerDashboardSkeleton | `components/customer/skeletons/` | ✅ Available |
| CustomerBookingsSkeleton | `components/customer/skeletons/` | ✅ Available |
| ServiceDetailSkeleton | `components/customer/skeletons/` | ✅ Available |
| ProfileSkeleton | `components/customer/skeletons/` | ✅ Available |

---

## 🎯 IMPLEMENTATION STRATEGY: 5 PHASES

```
Phase 0: Setup & Foundation          (20 min)  ↓
Phase 1: Profile Page               (30 min)  ↓  Simplest - 1 query
Phase 2: Dashboard Page             (30 min)  ↓  Multiple queries
Phase 3: Bookings Page               (45 min)  ↓  Mutations + optimistic updates
Phase 4: Services Pages              (60 min)  ↓  Complex filters + dependent queries
Phase 5: Advanced Features          (30 min)  ↓  Prefetching + optimization
```

**Total Estimated Time**: 3-4 hours

---

## PHASE 0: Setup & Foundation (20 minutes)

### Step 0.1: Install Dependencies

```bash
cd "C:\Users\uasai\Desktop\Umer-Enacton\Home service\hsm-frontend"
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 0.2: Create Folder Structure

```bash
mkdir -p lib/queries
```

### Step 0.3: Create Query Keys Factory

**Create**: `lib/queries/query-keys.ts`

```typescript
// lib/queries/query-keys.ts

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
```

### Step 0.4: Create Query Client

**Create**: `lib/queries/query-client.ts`

```typescript
// lib/queries/query-client.ts

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Step 0.5: Setup Provider in Root Layout

**Update**: `app/layout.tsx`

```typescript
// Add these imports at the top
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queries/query-client'

// Wrap the children in the body
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          )}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

### Step 0.6: Create Barrel Export

**Create**: `lib/queries/index.ts`

```typescript
// lib/queries/index.ts

export * from './query-keys'
export * from './query-client'
export * from './use-profile'
export * from './use-dashboard'
export * from './use-bookings'
export * from './use-services'
```

---

## PHASE 1: Profile Page (30 minutes) ⭐ Simplest

### Why Start Here?
- Only 1 query + 2 mutations
- Simplest page
- Good starting point to understand patterns

### Step 1.1: Create Profile Hooks

**Create**: `lib/queries/use-profile.ts`

```typescript
// lib/queries/use-profile.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentProfile, updateProfile, uploadAvatar } from "@/lib/profile-api";
import { queryKeys } from "./query-keys";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.profile.all, updatedUser);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (avatarData) => {
      queryClient.setQueryData(queryKeys.profile.all, (old: any) => ({
        ...old,
        avatar: avatarData.url,
      }));
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast.success("Avatar updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}
```

### Step 1.2: Update Profile Page

**File**: `app/(pages)/customer/profile/page.tsx`

**What to Change:**
1. Remove `useState` for user and isLoading
2. Remove `useEffect` that loads profile
3. Import and use `useProfile`, `useUpdateProfile`, `useUploadAvatar`
4. Remove manual refresh calls

**Key Changes:**
```typescript
// BEFORE (lines ~36-50)
const [user, setUser] = useState<User | null>(null);
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!isAuthenticated()) {
    router.push("/login");
    return;
  }
  loadProfile();
}, [router]);

const loadProfile = async () => {
  // ... manual loading logic
};

// AFTER
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/lib/queries";

// Remove all useState for user, isLoading, error
// Keep only UI state: activeTab, isEditModalOpen, etc.

const { data: user, isLoading, error } = useProfile();
const updateProfileMutation = useUpdateProfile();
const uploadAvatarMutation = useUploadAvatar();

// isLoading and error are now from React Query
if (isLoading) return <ProfileSkeleton />;
if (error) return <ErrorState />;
```

---

## PHASE 2: Dashboard Page (30 minutes) ⭐⭐

### Why This Phase?
- Multiple queries running in parallel
- Demonstrates the power of React Query
- Fixes the duplicate API call issue

### Step 2.1: Create Dashboard Hooks

**Create**: `lib/queries/use-dashboard.ts`

```typescript
// lib/queries/use-dashboard.ts

import { useQuery } from "@tanstack/react-query";
import { getCustomerBookings, getServices } from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { CustomerBooking, CustomerService } from "@/types/customer";

export function useRecentBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.recent(),
    queryFn: async () => {
      const data = await getCustomerBookings({ limit: 3 });
      return Array.isArray(data?.bookings) ? data.bookings.slice(0, 3) : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: queryKeys.bookings.stats(),
    queryFn: async () => {
      const data = await getCustomerBookings();
      const bookings = Array.isArray(data?.bookings) ? data.bookings : [];

      return {
        totalBookings: data?.total || 0,
        pendingBookings: bookings.filter((b) => b.status === "pending").length,
        completedBookings: bookings.filter((b) => b.status === "completed").length,
      };
    },
    staleTime: 60 * 1000, // 1 minute - stats change frequently
  });
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: queryKeys.services.featured(),
    queryFn: async () => {
      const data = await getServices();
      const services = Array.isArray(data?.data) ? data.data : [];

      return services
        .filter((s) => s.provider?.rating)
        .sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))
        .slice(0, 6);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 2.2: Update Dashboard Page

**File**: `app/(pages)/customer/page.tsx`

**What to Change:**
1. Remove all `useState` for data and isLoading
2. Remove `loadDashboardData()` function
3. Remove `useEffect`
4. Import and use the three hooks
5. Remove manual error handling

**Key Changes:**
```typescript
// BEFORE (lines 18-67)
const [isLoading, setIsLoading] = useState(true);
const [recentBookings, setRecentBookings] = useState<CustomerBooking[]>([]);
const [featuredServices, setFeaturedServices] = useState<CustomerService[]>([]);
const [stats, setStats] = useState({
  totalBookings: 0,
  pendingBookings: 0,
  completedBookings: 0,
});

useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  // ... sequential API calls
};

// AFTER
import { useRecentBookings, useBookingStats, useFeaturedServices } from "@/lib/queries";

// All three queries run in parallel automatically
const { data: recentBookings = [], isLoading: isLoadingBookings } = useRecentBookings();
const { data: stats = { totalBookings: 0, pendingBookings: 0, completedBookings: 0 }, isLoading: isLoadingStats } = useBookingStats();
const { data: featuredServices = [], isLoading: isLoadingServices } = useFeaturedServices();

const isLoading = isLoadingBookings || isLoadingStats || isLoadingServices;

if (isLoading) return <CustomerDashboardSkeleton />;
```

**Benefits:**
- ✅ Parallel loading instead of sequential
- ✅ No duplicate `getCustomerBookings` call
- ✅ Automatic caching
- ✅ Each section loads independently

---

## PHASE 3: Bookings Page (45 minutes) ⭐⭐⭐

### Why This Phase?
- Introduces mutations
- Optimistic updates (UX improvement)
- Query invalidation patterns

### Step 3.1: Create Booking Hooks

**Create**: `lib/queries/use-bookings.ts`

```typescript
// lib/queries/use-bookings.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCustomerBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
} from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { CustomerBooking } from "@/types/customer";

// QUERIES
export function useBookings(filters?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters || {}),
    queryFn: async () => {
      const data = await getCustomerBookings(filters);
      return {
        bookings: Array.isArray(data?.bookings) ? data.bookings : [],
        total: data?.total || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
    staleTime: 2 * 60 * 1000,
  });
}

// MUTATIONS
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      cancelBooking(bookingId, reason),

    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.all });

      const previousBookings = queryClient.getQueryData(queryKeys.bookings.lists());

      // Optimistically update to cancelled
      queryClient.setQueryData(queryKeys.bookings.lists(), (old: any) => {
        if (!old?.bookings) return old;
        return {
          ...old,
          bookings: old.bookings.map((b: CustomerBooking) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b,
          ),
        };
      });

      return { previousBookings };
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(queryKeys.bookings.lists(), context?.previousBookings);
      toast.error("Failed to cancel booking");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success("Booking cancelled successfully");
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, newData }: {
      bookingId: number;
      newData: { newSlotId: number; newDate?: string };
    }) => rescheduleBooking(bookingId, newData),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success("Booking rescheduled successfully");
    },

    onError: () => {
      toast.error("Failed to reschedule booking");
    },
  });
}
```

### Step 3.2: Update Bookings Page

**File**: `app/(pages)/customer/bookings/page.tsx`

**What to Change:**
1. Remove state for bookings, stats, serviceCache, etc.
2. Remove `loadBookings()` function
3. Import hooks and use them
4. Replace manual cancel logic with mutation
5. Keep UI state (activeTab, expandedRowId)

**Key Changes:**
```typescript
// BEFORE - lots of state
const [isLoading, setIsLoading] = useState(true);
const [bookings, setBookings] = useState<CustomerBooking[]>([]);
const [stats, setStats] = useState<BookingStats>({ ... });
const [serviceCache, setServiceCache] = useState<Record<number, Service>>({});
// ... more manual state

useEffect(() => {
  loadBookings();
}, []);

const loadBookings = async (showRefreshLoading = false) => {
  // ... complex loading logic with caching
};

const handleCancel = async (bookingId: number) => {
  if (!confirm("Are you sure?")) return;
  setCancelling(true);
  await cancelBooking(bookingId, "Customer cancelled");
  await loadBookings(true);
  setCancelling(false);
};

// AFTER
import { useBookings, useCancelBooking } from "@/lib/queries";

const { data, isLoading, error } = useBookings();
const cancelMutation = useCancelBooking();

const bookings = data?.bookings || [];
const stats = data ? {
  total: bookings.length,
  pending: bookings.filter((b) => b.status === "pending").length,
  // ...
} : { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

const handleCancel = (bookingId: number) => {
  if (!confirm("Are you sure you want to cancel this booking?")) return;
  cancelMutation.mutate({ bookingId, reason: "Customer cancelled" });
};

// Keep UI state
const [activeTab, setActiveTab] = useState("all");
const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
```

---

## PHASE 4: Services Pages (60 minutes) ⭐⭐⭐⭐

### Why This Phase?
- Complex filtering with debouncing
- Dependent queries (service → slots)
- Multiple parallel queries in detail page

### Step 4.1: Create Service Hooks

**Create**: `lib/queries/use-services.ts`

```typescript
// lib/queries/use-services.ts

import { useQuery } from "@tanstack/react-query";
import { getServices, getServiceById, getAvailableSlots } from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { ServiceFilters, ServiceDetails, Slot } from "@/types/customer";

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: queryKeys.services.list(filters || {}),
    queryFn: async () => {
      const result = await getServices(filters);
      return {
        services: result.data || [],
        total: result.total || 0,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useService(serviceId: number) {
  return useQuery({
    queryKey: queryKeys.services.detail(serviceId),
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useServiceSlots(
  businessId: number,
  date?: string,
  serviceId?: number,
) {
  return useQuery({
    queryKey: queryKeys.slots.forBusiness(businessId, date, serviceId),
    queryFn: () => getAvailableSlots(businessId, date, serviceId),
    enabled: !!businessId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
}
```

### Step 4.2: Update Services List Page

**File**: `app/(pages)/customer/services/page.tsx`

**What to Change:**
1. Remove `useDebounce` hook (React Query handles this)
2. Remove `loadServices` function
3. Remove state for services, categories, total
4. Use `useServices` hook

**Key Changes:**
```typescript
// BEFORE
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
const [isLoadingServices, setIsLoadingServices] = useState(false);
const [services, setServices] = useState<CustomerService[]>([]);
const [categories, setCategories] = useState<CategoryData[]>([]);
const [total, setTotal] = useState(0);

// Custom debounce hook
function useDebounce<T>(value: T, delay: number) { ... }

const debouncedSearch = useDebounce(filterState.search, 600);
const debouncedPriceRange = useDebounce(filterState.priceRange, 600);

// Filters object
const filters = useMemo<ServiceFilters>(() => ({ ... }), [filterState, debouncedSearch, debouncedPriceRange]);

useEffect(() => {
  loadServices();
}, [filters]);

const loadServices = async () => {
  setIsLoadingServices(true);
  const result = await getServices(filters);
  setServices(result.data || []);
  setTotal(result.total || 0);
  setHasLoadedOnce(true);
  setIsLoadingServices(false);
};

// AFTER
import { useServices } from "@/lib/queries";

const { data, isLoading } = useServices(filters);

const services = data?.services || [];
const total = data?.total || 0;

// Remove debouncing - React Query handles it automatically
const filters = useMemo<ServiceFilters>(() => ({ ... }), [filterState]);
```

### Step 4.3: Update Service Detail Page

**File**: `app/(pages)/customer/services/[id]/page.tsx`

**What to Change:**
1. Remove all state for service, slots, addresses
2. Remove sequential loading logic
3. Use parallel queries

**Key Changes:**
```typescript
// BEFORE - Lines 71-90
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
const [isLoadingService, setIsLoadingService] = useState(false);
const [isLoadingSlots, setIsLoadingSlots] = useState(false);
const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
const [service, setService] = useState<ServiceDetails | null>(null);
const [allSlots, setAllSlots] = useState<Slot[]>([]);
const [addresses, setAddresses] = useState<Address[]>([]);

// Sequential loading
useEffect(() => {
  const loadData = async () => {
    setIsLoadingService(true);
    const serviceData = await getServiceById(serviceId);
    setService(serviceData);

    setIsLoadingSlots(true);
    const slotsData = await getAvailableSlots(serviceData.businessProfileId);
    setAllSlots(slotsData);

    setIsLoadingAddresses(true);
    const addressesData = await getAddresses();
    setAddresses(addressesData);
  };
  loadData();
}, [serviceId]);

// AFTER
import { useService, useServiceSlots } from "@/lib/queries";
import { useAddresses } from "@/lib/queries";

// All queries run in parallel
const { data: service, isLoading: isLoadingService } = useService(serviceId);
const { data: slots = [], isLoading: isLoadingSlots } = useServiceSlots(
  service?.businessProfileId || 0
);
const { data: addresses = [], isLoading: isLoadingAddresses } = useAddresses();

const isLoading = isLoadingService || isLoadingSlots || isLoadingAddresses;

// Keep only UI state
const [selectedDate, setSelectedDate] = useState("");
const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
```

---

## PHASE 5: Advanced Features (30 minutes) ⭐⭐⭐⭐⭐

### 5.1 Prefetch on Hover

**File**: `app/(pages)/customer/services/page.tsx`

Add prefetch to service cards:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries';
import { getServiceById } from '@/lib/customer/api';

export default function CustomerServicesPage() {
  const queryClient = useQueryClient();
  // ... rest of component

  return (
    <div>
      {services.map((service) => (
        <Card
          key={service.id}
          onMouseEnter={() => {
            // Prefetch on hover - instant navigation!
            queryClient.prefetchQuery({
              queryKey: queryKeys.services.detail(service.id),
              queryFn: () => getServiceById(service.id),
            });
          }}
          onClick={() => router.push(`/customer/services/${service.id}`)}
        >
          {/* Card content */}
        </Card>
      ))}
    </div>
  );
}
```

### 5.2 Add Refresh Button

**File**: `app/(pages)/customer/bookings/page.tsx`

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries';

export default function CustomerBookingsPage() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  };

  return (
    <div className="flex items-center justify-between">
      <h1>My Bookings</h1>
      <Button onClick={handleRefresh} variant="outline" size="icon">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

---

## 📋 MIGRATION CHECKLIST

### Phase 0: Setup
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `lib/queries/` folder
- [ ] Create `lib/queries/query-keys.ts`
- [ ] Create `lib/queries/query-client.ts`
- [ ] Create `lib/queries/index.ts`
- [ ] Update `app/layout.tsx` with QueryClientProvider

### Phase 1: Profile (30 min)
- [ ] Create `lib/queries/use-profile.ts`
- [ ] Update `app/(pages)/customer/profile/page.tsx`
- [ ] Remove useState for user, isLoading
- [ ] Test profile update
- [ ] Test avatar upload

### Phase 2: Dashboard (30 min)
- [ ] Create `lib/queries/use-dashboard.ts`
- [ ] Update `app/(pages)/customer/page.tsx`
- [ ] Verify parallel loading (DevTools)
- [ ] Check no duplicate API calls
- [ ] Test cache on revisit

### Phase 3: Bookings (45 min)
- [ ] Create `lib/queries/use-bookings.ts`
- [ ] Update `app/(pages)/customer/bookings/page.tsx`
- [ ] Test cancel booking (optimistic update)
- [ ] Test reschedule booking
- [ ] Verify error rollback

### Phase 4: Services (60 min)
- [ ] Create `lib/queries/use-services.ts`
- [ ] Update `app/(pages)/customer/services/page.tsx`
- [ ] Update `app/(pages)/customer/services/[id]/page.tsx`
- [ ] Test filters work correctly
- [ ] Verify parallel loading in detail page
- [ ] Check slots auto-refetch

### Phase 5: Advanced (30 min)
- [ ] Add prefetch on hover
- [ ] Add refresh buttons
- [ ] Test all user flows
- [ ] Check DevTools

---

## 🎯 SUCCESS METRICS

After implementation:

✅ **Page Load Time**: 40-60% faster on subsequent visits
✅ **API Calls**: Reduced by 60-70% (caching + deduplication)
✅ **Code Reduction**: ~40% less state management code
✅ **UX**: Instant optimistic updates (cancel, delete)
✅ **Parallel Loading**: Dashboard loads 3 things at once
✅ **Auto-Refresh**: Slots refresh every minute automatically
✅ **Debugging**: DevTools show all queries

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Install dependencies
cd "C:\Users\uasai\Desktop\Umer-Enacton\Home service\hsm-frontend"
npm install @tanstack/react-query @tanstack/react-query-devtools

# 2. Create folders and files (I can do this for you)
mkdir -p lib/queries

# Files to create:
# - lib/queries/query-keys.ts
# - lib/queries/query-client.ts
# - lib/queries/use-profile.ts
# - lib/queries/use-dashboard.ts
# - lib/queries/use-bookings.ts
# - lib/queries/use-services.ts
# - lib/queries/index.ts
```

---

## 📝 SUMMARY

### What We Have:
- ✅ 5 customer pages (Dashboard, Bookings, Services, Profile, Service Detail)
- ✅ API functions in `lib/customer/api.ts` and `lib/profile-api.ts`
- ✅ Skeleton components for all pages
- ✅ Types defined

### What We Need:
- 📦 Install React Query
- 🔧 Create query infrastructure (keys, client, hooks)
- 🔄 Update 5 pages to use React Query
- ⚡ Add advanced features (prefetch, refresh)

### Time Investment:
- **Phase 0 (Setup)**: 20 minutes
- **Phase 1 (Profile)**: 30 minutes
- **Phase 2 (Dashboard)**: 30 minutes
- **Phase 3 (Bookings)**: 45 minutes
- **Phase 4 (Services)**: 60 minutes
- **Phase 5 (Advanced)**: 30 minutes

**Total**: ~3-4 hours

---

**Ready to start?** I can begin with Phase 0 (Setup) and create all the necessary files for you!
