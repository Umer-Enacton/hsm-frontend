# React TanStack Query Implementation Plan - Customer Side

## 📋 Table of Contents
1. [Overview](#overview)
2. [Why React Query?](#why-react-query)
3. [Where to Use React Query](#where-to-use-react-query)
4. [Where NOT to Use React Query](#where-not-to-use-react-query)
5. [Query Keys Structure](#query-keys-structure)
6. [Custom Hooks Plan](#custom-hooks-plan)
7. [Implementation Strategy](#implementation-strategy)
8. [Cache Configuration](#cache-configuration)
9. [Important Considerations](#important-considerations)
10. [Migration Steps](#migration-steps)

---

## 🎯 Overview

### Current State
- Customer side uses `useState` + `useEffect` for all data fetching
- No caching mechanism
- Manual loading states
- No automatic refetching
- Race conditions possible
- Duplicate requests for same data

### Target State
- React TanStack Query for all server state
- Automatic caching and revalidation
- Optimistic updates
- Background refetching
- Pagination support
- Better UX with skeleton loading

---

## 💡 Why React Query?

### Benefits for Customer Side:
1. **Caching**: Services list, bookings cache - instant page navigation
2. **Auto-refetch**: Refetch on window focus, reconnect, interval
3. **Optimistic Updates**: Cancel booking looks instant
4. **Pagination**: Built-in support for infinite scroll
5. **Background Updates**: Data stays fresh without blocking UI
6. **Deduplication**: Multiple components requesting same data = single request
7. **Retries**: Automatic retry with exponential backoff
8. **DevTools**: Excellent debugging tools

---

## ✅ Where to Use React Query

### 1. **Data Fetching (GET requests)**
All server data that needs to be displayed:

#### Dashboard Page
```typescript
// ✅ USE: Recent bookings (cached, staleTime: 2min)
useQuery({
  queryKey: ['bookings', 'recent'],
  queryFn: () => getCustomerBookings({ limit: 3 }),
  staleTime: 2 * 60 * 1000 // 2 minutes
})

// ✅ USE: Featured services (cached, staleTime: 5min)
useQuery({
  queryKey: ['services', 'featured'],
  queryFn: () => getServices().then(services => sortTopRated(services)),
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// ✅ USE: Quick stats (derived from bookings, cacheTime: 1min)
useQuery({
  queryKey: ['bookings', 'stats'],
  queryFn: () => getCustomerBookings().then(calcStats),
  staleTime: 60 * 1000 // 1 minute
})
```

#### Bookings Page
```typescript
// ✅ USE: All bookings with filters
useQuery({
  queryKey: ['bookings', { status, page }],
  queryFn: () => getCustomerBookings({ status, limit: 10, offset: page * 10 }),
  staleTime: 30 * 1000 // 30 seconds
})

// ✅ USE: Single booking details
useQuery({
  queryKey: ['bookings', bookingId],
  queryFn: () => getBookingById(bookingId),
  staleTime: 5 * 60 * 1000 // 5 minutes
  enabled: !!bookingId
})
```

#### Services Page
```typescript
// ✅ USE: Services list with filters
useQuery({
  queryKey: ['services', { categoryId, state, city, search }],
  queryFn: () => getServices({ categoryId, state, city, search }),
  staleTime: 3 * 60 * 1000 // 3 minutes
})

// ✅ USE: Service details
useQuery({
  queryKey: ['services', serviceId],
  queryFn: () => getServiceById(serviceId),
  staleTime: 5 * 60 * 1000 // 5 minutes
  enabled: !!serviceId
})

// ✅ USE: Available slots (refetch every minute)
useQuery({
  queryKey: ['slots', businessId, date, serviceId],
  queryFn: () => getAvailableSlots(businessId, date, serviceId),
  staleTime: 60 * 1000, // 1 minute
  refetchInterval: 60 * 1000 // Auto-refetch every minute
})
```

#### Addresses Page
```typescript
// ✅ USE: Customer addresses
useQuery({
  queryKey: ['addresses'],
  queryFn: () => getAddresses(),
  staleTime: 10 * 60 * 1000 // 10 minutes (addresses rarely change)
})
```

#### Profile Page
```typescript
// ✅ USE: User profile data
useQuery({
  queryKey: ['profile'],
  queryFn: () => getCurrentProfile(),
  staleTime: 5 * 60 * 1000 // 5 minutes
})
```

### 2. **Mutations (POST, PUT, DELETE, PATCH)**
All state-changing operations:

```typescript
// ✅ USE: Create booking
useMutation({
  mutationFn: createBooking,
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }
})

// ✅ USE: Cancel booking (with optimistic update)
useMutation({
  mutationFn: cancelBooking,
  onMutate: async (bookingId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['bookings'] })
    // Snapshot previous value
    const previousBookings = queryClient.getQueryData(['bookings'])
    // Optimistically update
    queryClient.setQueryData(['bookings'], (old) => ...)
    return { previousBookings }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['bookings'], context.previousBookings)
  },
  onSuccess: () => {
    toast.success("Booking cancelled")
  }
})

// ✅ USE: Create/Update/Delete address
useMutation({
  mutationFn: createAddress,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['addresses'] })
    toast.success("Address added")
  }
})

// ✅ USE: Submit review
useMutation({
  mutationFn: submitReview,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] })
    queryClient.invalidateQueries({ queryKey: ['services', serviceId, 'reviews'] })
  }
})
```

### 3. **Complex Patterns**

#### Prefetching on Hover
```typescript
// In services list, prefetch service details on link hover
<Link
  href={`/services/${service.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['services', service.id],
      queryFn: () => getServiceById(service.id)
    })
  }}
>
```

#### Infinite Scroll (for services/bookings)
```typescript
useInfiniteQuery({
  queryKey: ['services', filters],
  queryFn: ({ pageParam = 0 }) =>
    getServices({ ...filters, offset: pageParam }),
  getNextPageParam: (lastPage, allPages) => {
    if (lastPage.data.length < 20) return undefined
    return allPages.length * 20
  }
})
```

---

## ❌ Where NOT to Use React Query

### 1. **Simple UI State**
```typescript
// ❌ DON'T: Modal open/close
const [isModalOpen, setIsModalOpen] = useState(false)

// ❌ DON'T: Active tab
const [activeTab, setActiveTab] = useState('overview')

// ❌ DON'T: Form input
const [searchQuery, setSearchQuery] = useState('')

// ❌ DON'T: View mode (grid/list)
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
```

### 2. **Authentication State**
```typescript
// ❌ DON'T: Auth token, user login state
// Use auth-utils.ts and context instead
```

### 3. **Client-side Derivations**
```typescript
// ❌ DON'T: Computed values from other state
const filteredServices = useMemo(() =>
  services.filter(s => s.categoryId === activeCategory),
  [services, activeCategory]
)
```

### 4. **One-time Operations**
```typescript
// ❌ DON'T: Log analytics, track events
// These don't need caching or retries
```

---

## 🔑 Query Keys Structure

### Hierarchical Key Design
```typescript
// lib/queries/query-keys.ts

export const queryKeys = {
  // Bookings
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters: { status?: string; page?: number }) =>
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: number) =>
      [...queryKeys.bookings.details(), id] as const,
    stats: () => [...queryKeys.bookings.all, 'stats'] as const,
  },

  // Services
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters: ServiceFilters) =>
      [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: number) =>
      [...queryKeys.services.details(), id] as const,
    featured: () => [...queryKeys.services.all, 'featured'] as const,
    reviews: (id: number) =>
      [...queryKeys.services.detail(id), 'reviews'] as const,
  },

  // Slots
  slots: {
    all: ['slots'] as const,
    forBusiness: (businessId: number, date?: string, serviceId?: number) =>
      ['slots', { businessId, date, serviceId }] as const,
  },

  // Addresses
  addresses: {
    all: ['addresses'] as const,
  },

  // Profile
  profile: {
    all: ['profile'] as const,
  },
}
```

---

## 🪝 Custom Hooks Plan

### File Structure
```
lib/queries/
├── query-keys.ts           # Query key factories
├── use-bookings.ts         # Booking queries & mutations
├── use-services.ts         # Service queries & mutations
├── use-addresses.ts        # Address queries & mutations
├── use-profile.ts          # Profile queries & mutations
└── index.ts                # Barrel export
```

### Hook Implementations

#### 1. `use-bookings.ts`
```typescript
// Queries
export function useBookings(filters?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters || {}),
    queryFn: () => getCustomerBookings(filters),
    staleTime: 30 * 1000,
  })
}

export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  })
}

export function useBookingStats() {
  return useQuery({
    queryKey: queryKeys.bookings.stats(),
    queryFn: async () => {
      const data = await getCustomerBookings()
      return calculateStats(data)
    },
    staleTime: 60 * 1000,
  })
}

// Mutations
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      cancelBooking(bookingId, reason),
    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.all })

      const previousBookings = queryClient.getQueryData(
        queryKeys.bookings.lists()
      )

      queryClient.setQueryData(
        queryKeys.bookings.lists(),
        (old: any) => old?.map((b: any) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        )
      )

      return { previousBookings }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKeys.bookings.lists(), context?.previousBookings)
      toast.error("Failed to cancel booking")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
      toast.success("Booking cancelled successfully")
    },
  })
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, newData }: { bookingId: number; newData: any }) =>
      rescheduleBooking(bookingId, newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
      toast.success("Booking rescheduled")
    },
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.slots.all })
      toast.success("Booking created successfully")
      // Navigate to booking details
      router.push(`/customer/bookings/${data.booking.id}`)
    },
  })
}
```

#### 2. `use-services.ts`
```typescript
export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: queryKeys.services.list(filters || {}),
    queryFn: () => getServices(filters),
    staleTime: 3 * 60 * 1000,
  })
}

export function useService(serviceId: number) {
  return useQuery({
    queryKey: queryKeys.services.detail(serviceId),
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: queryKeys.services.featured(),
    queryFn: async () => {
      const data = await getServices()
      return data.data
        .filter((s) => s.provider?.rating)
        .sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))
        .slice(0, 6)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useServiceSlots(
  businessId: number,
  date?: string,
  serviceId?: number
) {
  return useQuery({
    queryKey: queryKeys.slots.forBusiness(businessId, date, serviceId),
    queryFn: () => getAvailableSlots(businessId, date, serviceId),
    enabled: !!businessId,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useServiceReviews(serviceId: number) {
  return useQuery({
    queryKey: queryKeys.services.reviews(serviceId),
    queryFn: () => getServiceReviews(serviceId),
    enabled: !!serviceId,
  })
}
```

#### 3. `use-addresses.ts`
```typescript
export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: getAddresses,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all })
      toast.success("Address added successfully")
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ addressId, updates }: { addressId: number; updates: any }) =>
      updateAddress(addressId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all })
      toast.success("Address updated")
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (addressId: number) => deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all })
      toast.success("Address deleted")
    },
  })
}
```

#### 4. `use-profile.ts`
```typescript
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.profile.all, updatedUser)
      // Emit event for layout header update
      window.dispatchEvent(new CustomEvent('profile-updated'))
      toast.success("Profile updated successfully")
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (avatarData) => {
      queryClient.setQueryData(queryKeys.profile.all, (old: any) => ({
        ...old,
        avatar: avatarData.url,
      }))
      window.dispatchEvent(new CustomEvent('profile-updated'))
      toast.success("Avatar updated successfully")
    },
  })
}
```

---

## 🏗️ Implementation Strategy

### Phase 1: Setup (Foundation)
1. Install TanStack Query
2. Setup QueryClientProvider in root layout
3. Create query-keys structure
4. Create custom hooks folder structure

### Phase 2: Core Queries (Most Used)
1. Services queries (useServices, useService)
2. Bookings queries (useBookings, useBooking)
3. Addresses queries (useAddresses)

### Phase 3: Mutations (State Changes)
1. Booking mutations (create, cancel, reschedule)
2. Address mutations (create, update, delete)
3. Profile mutations (update, avatar upload)

### Phase 4: Page Migrations
Migrate pages in order of usage:
1. Dashboard
2. Services page
3. Bookings page
4. Addresses page
5. Profile page

### Phase 5: Advanced Features
1. Infinite scroll
2. Prefetching on hover
3. Optimistic updates
4. Error boundaries

---

## ⚙️ Cache Configuration

### Global Query Client Setup
```typescript
// lib/queries/query-client.ts

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time after which data is considered stale
      staleTime: 1000 * 60 * 2, // 2 minutes

      // Time before inactive queries are removed from cache
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)

      // Retry failed requests
      retry: 1,

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount (if stale)
      refetchOnMount: true,
    },
    mutations: {
      retry: 0, // Don't retry mutations by default
    },
  },
})
```

### Provider Setup
```typescript
// app/layout.tsx

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queries/query-client'

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

---

## ⚠️ Important Considerations

### 1. **Stale Time vs Cache Time**
```typescript
// ✅ GOOD: Services cache for 5min, stale after 3min
staleTime: 3 * 60 * 1000,  // Show fresh data for 3 min
gcTime: 5 * 60 * 1000,     // Keep in cache for 5 min

// ❌ BAD: Too long stale time
staleTime: 60 * 60 * 1000, // 1 hour - data too old
```

### 2. **Invalidation Strategy**
```typescript
// ✅ GOOD: Invalidate specific queries
queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })

// ❌ BAD: Invalidate all queries (performance hit)
queryClient.invalidateQueries()
```

### 3. **Optimistic Updates Careful**
```typescript
// ✅ GOOD: Rollback on error
onError: (err, variables, context) => {
  queryClient.setQueryData(['bookings'], context.previousBookings)
}

// ❌ BAD: No rollback - UI shows wrong state on error
```

### 4. **Enabled Condition**
```typescript
// ✅ GOOD: Only fetch when ID exists
useQuery({
  queryKey: ['bookings', bookingId],
  queryFn: () => getBookingById(bookingId),
  enabled: !!bookingId, // Don't fetch if no ID
})

// ❌ BAD: Fetches with undefined ID
```

### 5. **Loading States**
```typescript
// ✅ GOOD: Use isLoading for initial load, isFetching for background refetch
const { isLoading, isFetching, data } = useQuery(...)

if (isLoading) return <Skeleton />
if (isFetching) <RefreshIcon spinning />

// ❌ BAD: Show full skeleton on every refetch
```

### 6. **Error Handling**
```typescript
// ✅ GOOD: Handle errors gracefully
const { error, data } = useQuery(...)
if (error) return <ErrorState error={error} />

// ❌ BAD: Unhandled errors
```

### 7. **Dependent Queries**
```typescript
// ✅ GOOD: Second query waits for first
const { data: user } = useQuery({ queryKey: ['user'], queryFn: getUser })
const { data: bookings } = useQuery({
  queryKey: ['bookings', user?.id],
  queryFn: () => getBookings(user.id),
  enabled: !!user, // Only run when user exists
})
```

---

## 🔄 Migration Steps

### Step-by-Step Migration Pattern

#### Before (Current):
```typescript
const [bookings, setBookings] = useState([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const load = async () => {
    try {
      const data = await getCustomerBookings()
      setBookings(data.bookings)
    } catch (error) {
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }
  load()
}, [])
```

#### After (React Query):
```typescript
const { data, isLoading, error } = useBookings()

if (isLoading) return <CustomerBookingsSkeleton />
if (error) return <ErrorState error={error} />

// Use data.bookings directly
```

---

## 📊 Page-by-Page Migration Checklist

### Dashboard Page
- [ ] Replace `useEffect` with `useBookings` query
- [ ] Replace `useEffect` with `useFeaturedServices` query
- [ ] Remove local state for bookings and services
- [ ] Remove manual loading state
- [ ] Update skeleton integration

### Services Page
- [ ] Replace `useEffect` with `useServices(filters)` query
- [ ] Add `useService` for detail page
- [ ] Implement filters in query key
- [ ] Add search debouncing
- [ ] Prefetch on link hover

### Services Detail Page
- [ ] Replace `useEffect` with `useService(id)` query
- [ ] Replace `useEffect` with `useServiceSlots` query
- [ ] Replace `useEffect` with `useServiceReviews` query
- [ ] Implement auto-refetch for slots

### Bookings Page
- [ ] Replace `useEffect` with `useBookings(filters)` query
- [ ] Implement status filter in query key
- [ ] Replace `useEffect` with `useBooking(id)` for details
- [ ] Implement cancel mutation with optimistic update

### Addresses Page
- [ ] Replace `useEffect` with `useAddresses` query
- [ ] Implement create/update/delete mutations
- [ ] Add proper invalidation

### Profile Page
- [ ] Replace `useEffect` with `useProfile` query
- [ ] Implement update mutation
- [ ] Implement avatar upload mutation
- [ ] Remove manual refresh logic

---

## 🚀 Quick Start Commands

```bash
# Install TanStack Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# Create folder structure
mkdir -p lib/queries

# Create files
touch lib/queries/query-keys.ts
touch lib/queries/query-client.ts
touch lib/queries/use-bookings.ts
touch lib/queries/use-services.ts
touch lib/queries/use-addresses.ts
touch lib/queries/use-profile.ts
touch lib/queries/index.ts
```

---

## 📝 Summary

### Do's ✅
- Use React Query for ALL server state
- Use hierarchical query keys
- Implement optimistic updates for UX
- Set appropriate stale times
- Invalidate queries after mutations
- Handle errors gracefully
- Use query DevTools for debugging

### Don'ts ❌
- Don't use for local UI state
- Don't invalidate all queries
- Don't forget error rollback
- Don't set stale time too high
- Don't forget `enabled` condition
- Don't use for authentication state

---

## 🎯 Success Metrics

After implementation:
- ✅ Faster page navigation (cache hits)
- ✅ Better UX (optimistic updates)
- ✅ Less boilerplate code
- ✅ Automatic revalidation
- ✅ Better error handling
- ✅ Easier debugging with DevTools

---

**Estimated Implementation Time**: 4-6 hours for full customer side migration
**Recommended Approach**: Incremental migration, page by page, starting with Dashboard
