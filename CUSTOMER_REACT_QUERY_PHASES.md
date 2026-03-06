# Customer Side - React Query Implementation Phases

## Complete Codebase Analysis & Step-by-Step Migration Guide

---

## 📊 Current State Analysis

### Customer Pages Overview

| Page                | Current State                         | Data Fetching                                 | Mutations              | Complexity |
| ------------------- | ------------------------------------- | --------------------------------------------- | ---------------------- | ---------- |
| **Dashboard**       | `useState` + `useEffect`              | 3 API calls (bookings, stats, services)       | None                   | ⭐⭐       |
| **Bookings List**   | `useState` + `useEffect`              | 1 API call + caching logic                    | Cancel, Reschedule     | ⭐⭐⭐     |
| **Booking Details** | `useState` + `useEffect`              | 4 API calls (booking, service, slot, address) | Cancel, Review         | ⭐⭐⭐⭐   |
| **Services List**   | `useState` + `useEffect` + debouncing | 2 API calls (services, categories)            | None                   | ⭐⭐⭐⭐   |
| **Service Details** | `useState` + `useEffect`              | 3 API calls (service, slots, addresses)       | Create booking         | ⭐⭐⭐⭐⭐ |
| **Addresses**       | `useState` + `useEffect`              | 1 API call                                    | Create, Update, Delete | ⭐⭐⭐     |
| **Profile**         | `useState` + `useEffect`              | 1 API call                                    | Update profile, avatar | ⭐⭐       |

### Key Issues Identified

1. **Duplicate API Calls**: Dashboard calls `getCustomerBookings` twice (once for recent, once for stats)
2. **No Caching**: Every page visit triggers new API calls
3. **Manual State Management**: Complex state synchronization
4. **No Optimistic Updates**: Cancel booking shows loader
5. **Race Conditions**: Multiple rapid filter changes on services page
6. **Manual Refetch**: Refresh button reloads entire page data
7. **Error Handling**: Try-catch blocks repeated everywhere

---

## 🎯 Implementation Strategy: 7 Phases

### Phase Order (by complexity & dependencies)

```
Phase 0: Setup & Foundation          (30 min)  ↓
Phase 1: Addresses Page             (45 min)  ↓  Simplest
Phase 2: Dashboard Page             (45 min)  ↓  Multiple queries
Phase 3: Bookings Page            (90 min)  ↓  Mutations + optimistic updates
Phase 4: Services Pages             (90 min)  ↓  Complex filters + debouncing
Phase 5: Profile Page               (45 min)  ↓  Avatar upload
Phase 6: Advanced Features          (60 min)  ↓  Prefetching + infinite scroll
Phase 7: Testing & Optimization     (60 min)  ↓  Final polish
```

**Total Estimated Time**: 7-8 hours

---

## PHASE 0: Setup & Foundation (30 minutes)

### Step 0.1: Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 0.2: Create Folder Structure

```bash
mkdir -p lib/queries
```

### Step 0.3: Create Query Keys Factory

**File**: `lib/queries/query-keys.ts`

```typescript
// lib/queries/query-keys.ts

/**
 * Hierarchical Query Keys Factory
 * All query keys should be defined here for consistency
 */

export const queryKeys = {
  // ============================================================================
  // BOOKINGS
  // ============================================================================
  bookings: {
    all: ["bookings"] as const,
    lists: () => [...queryKeys.bookings.all, "list"] as const,
    list: (filters: { status?: string; page?: number; limit?: number }) =>
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.bookings.details(), id] as const,
    stats: () => [...queryKeys.bookings.all, "stats"] as const,
    recent: () => [...queryKeys.bookings.all, "recent"] as const,
  },

  // ============================================================================
  // SERVICES
  // ============================================================================
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
    reviews: (id: number) =>
      [...queryKeys.services.detail(id), "reviews"] as const,
  },

  // ============================================================================
  // SLOTS
  // ============================================================================
  slots: {
    all: ["slots"] as const,
    forBusiness: (businessId: number, date?: string, serviceId?: number) =>
      ["slots", { businessId, date, serviceId }] as const,
  },

  // ============================================================================
  // ADDRESSES
  // ============================================================================
  addresses: {
    all: ["addresses"] as const,
  },

  // ============================================================================
  // PROFILE
  // ============================================================================
  profile: {
    all: ["profile"] as const,
  },

  // ============================================================================
  // CATEGORIES
  // ============================================================================
  categories: {
    all: ["categories"] as const,
  },
} as const;
```

### Step 0.4: Create Query Client

**File**: `lib/queries/query-client.ts`

```typescript
// lib/queries/query-client.ts

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 2 minutes
      staleTime: 1000 * 60 * 2,

      // Keep in cache for 10 minutes after becoming inactive
      gcTime: 1000 * 60 * 10,

      // Retry failed requests once
      retry: 1,

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch when window regains focus
      refetchOnWindowFocus: true,

      // Refetch when network reconnects
      refetchOnReconnect: true,

      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
});
```

### Step 0.5: Setup Provider in Root Layout

**File**: `app/layout.tsx`

```typescript
// app/layout.tsx

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queries/query-client'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              initialIsOpen={false}
              position="bottom-right"
            />
          )}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

---

## PHASE 1: Addresses Page (45 minutes) ⭐ Simplest

### Why Start Here?

- Only 1 query + 3 mutations
- Simplest page in customer section
- Good starting point to understand React Query patterns

### Current State Analysis

**File**: `app/(pages)/customer/addresses/page.tsx`

**Current Issues:**

1. ❌ Manual state management for addresses
2. ❌ `loadAddresses()` called after every mutation
3. ❌ No caching
4. ❌ No loading states during mutations

### Step 1.1: Create Address Hooks

**File**: `lib/queries/use-addresses.ts`

```typescript
// lib/queries/use-addresses.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { Address } from "@/types/customer";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all customer addresses
 * Cached for 10 minutes (addresses rarely change)
 */
export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: async () => {
      const data = await getAddresses();
      // Ensure data is an array
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new address
 * Invalidates addresses cache on success
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      // Invalidate and refetch addresses
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
      toast.success("Address added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add address");
    },
  });
}

/**
 * Update an existing address
 * Optimistically updates the cache
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      addressId,
      updates,
    }: {
      addressId: number;
      updates: Partial<Address>;
    }) => updateAddress(addressId, updates),

    onMutate: async ({ addressId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.addresses.all });

      // Snapshot previous value
      const previousAddresses = queryClient.getQueryData<Address[]>(
        queryKeys.addresses.all,
      );

      // Optimistically update
      queryClient.setQueryData<Address[]>(
        queryKeys.addresses.all,
        (old) =>
          old?.map((addr) =>
            addr.id === addressId ? { ...addr, ...updates } : addr,
          ) || [],
      );

      // Return context with previous value
      return { previousAddresses };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        queryKeys.addresses.all,
        context?.previousAddresses,
      );
      toast.error("Failed to update address");
    },

    onSuccess: () => {
      // Invalidate to ensure server state
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
      toast.success("Address updated successfully");
    },
  });
}

/**
 * Delete an address
 * Optimistically removes from cache
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: number) => deleteAddress(addressId),

    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.addresses.all });

      const previousAddresses = queryClient.getQueryData<Address[]>(
        queryKeys.addresses.all,
      );

      // Optimistically remove
      queryClient.setQueryData<Address[]>(
        queryKeys.addresses.all,
        (old) => old?.filter((addr) => addr.id !== addressId) || [],
      );

      return { previousAddresses };
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(
        queryKeys.addresses.all,
        context?.previousAddresses,
      );
      toast.error("Failed to delete address");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
      toast.success("Address deleted successfully");
    },
  });
}
```

### Step 1.2: Update Addresses Page

**File**: `app/(pages)/customer/addresses/page.tsx`

**BEFORE:**

```typescript
// Current implementation (lines 20-55)
const [isLoading, setIsLoading] = useState(true)
const [addresses, setAddresses] = useState<Address[]>([])
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [editingAddress, setEditingAddress] = useState<Address | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)

useEffect(() => {
  loadAddresses()
}, [])

const loadAddresses = async () => {
  try {
    const data = await getAddresses()
    setAddresses(Array.isArray(data) ? data : [])
  } catch (error: any) {
    toast.error('Failed to load addresses')
    setAddresses([])
  } finally {
    setIsLoading(false)
  }
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    setIsSubmitting(true)
    if (editingAddress) {
      await updateAddress(editingAddress.id, formData)
      toast.success('Address updated successfully')
    } else {
      await createAddress(formData)
      toast.success('Address added successfully')
    }
    await loadAddresses() // Manual refetch
    handleCloseDialog()
  } catch (error) {
    toast.error('Failed to save address')
  } finally {
    setIsSubmitting(false)
  }
}

const handleDelete = async (addressId: number) => {
  if (!confirm('Are you sure?')) return
  try {
    await deleteAddress(addressId)
    toast.success('Address deleted successfully')
    await loadAddresses() // Manual refetch
  } catch (error) {
    toast.error('Failed to delete address')
  }
}

if (isLoading) return <div>Loading...</div>
```

**AFTER:**

```typescript
// New implementation with React Query
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllStates } from '@/lib/data/india-locations'
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/lib/queries'
import type { Address } from '@/types/customer'

const ADDRESS_TYPES = ['home', 'work', 'other'] as const

export default function CustomerAddressesPage() {
  const router = useRouter()

  // UI State (keep local)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    addressType: 'home' as Address['addressType'],
    street: '',
    city: '',
    state: '',
    zipCode: '',
  })

  // React Query hooks
  const { data: addresses = [], isLoading } = useAddresses()
  const createMutation = useCreateAddress()
  const updateMutation = useUpdateAddress()
  const deleteMutation = useDeleteAddress()

  const isSubmitting = createMutation.isPending ||
                       updateMutation.isPending ||
                       deleteMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingAddress) {
      updateMutation.mutate({
        addressId: editingAddress.id,
        updates: formData
      })
    } else {
      createMutation.mutate(formData)
    }

    handleCloseDialog()
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      addressType: address.addressType,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    deleteMutation.mutate(addressId)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAddress(null)
    setFormData({
      addressType: 'home',
      street: '',
      city: '',
      state: '',
      zipCode: '',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Addresses</h1>
          <p className="text-muted-foreground">
            Manage your service addresses
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add your first address to start booking services
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className="relative group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="capitalize">
                      {address.addressType}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.street}, {address.city}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields remain the same */}
            {/* ... */}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### Step 1.3: Test the Changes

1. **Test loading state**: Navigate to addresses page
2. **Test create**: Add a new address - should appear instantly (optimistic)
3. **Test update**: Edit an address - should update instantly
4. **Test delete**: Delete an address - should remove instantly
5. **Test error handling**: Try with invalid data (should rollback)

---

## PHASE 2: Dashboard Page (45 minutes) ⭐⭐

### Why This Phase?

- Multiple queries (bookings, services, stats)
- Shows parallel loading
- Demonstrates query dependencies

### Current State Analysis

**File**: `app/(pages)/customer/page.tsx`

**Current Issues:**

1. ❌ Calls `getCustomerBookings` TWICE (wasteful)
2. ❌ Sequential loading (waits for each API call)
3. ❌ Stats derived manually from bookings
4. ❌ No caching - reloads on every visit

### Step 2.1: Create Dashboard Hooks

**File**: `lib/queries/use-dashboard.ts`

```typescript
// lib/queries/use-dashboard.ts

import { useQuery } from "@tanstack/react-query";
import { getCustomerBookings, getServices } from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { CustomerBooking, CustomerService } from "@/types/customer";

/**
 * Fetch recent bookings (limit 3)
 * Stale time: 2 minutes (bookings change frequently)
 */
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

/**
 * Fetch booking stats (total, pending, completed)
 * Stale time: 1 minute (stats change frequently)
 */
export function useBookingStats() {
  return useQuery({
    queryKey: queryKeys.bookings.stats(),
    queryFn: async () => {
      const data = await getCustomerBookings();
      const bookings = Array.isArray(data?.bookings) ? data.bookings : [];

      return {
        totalBookings: data?.total || 0,
        pendingBookings: bookings.filter((b) => b.status === "pending").length,
        completedBookings: bookings.filter((b) => b.status === "completed")
          .length,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch featured services (top 6 by rating)
 * Stale time: 5 minutes (services don't change often)
 */
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

**BEFORE:**

```typescript
// Lines 18-67
const [isLoading, setIsLoading] = useState(true)
const [recentBookings, setRecentBookings] = useState<CustomerBooking[]>([])
const [featuredServices, setFeaturedServices] = useState<CustomerService[]>([])
const [stats, setStats] = useState({
  totalBookings: 0,
  pendingBookings: 0,
  completedBookings: 0,
})

useEffect(() => {
  loadDashboardData()
}, [])

const loadDashboardData = async () => {
  try {
    // Load recent bookings (limit 3)
    const bookingsData = await getCustomerBookings({ limit: 3 })
    setRecentBookings(Array.isArray(bookingsData?.bookings) ? bookingsData.bookings.slice(0, 3) : [])

    // Calculate stats
    const allBookings = await getCustomerBookings() // DUPLICATE CALL!
    const bookingsList = Array.isArray(allBookings?.bookings) ? allBookings.bookings : []
    setStats({
      totalBookings: allBookings?.total || 0,
      pendingBookings: bookingsList.filter((b) => b.status === "pending").length,
      completedBookings: bookingsList.filter((b) => b.status === "completed").length,
    })

    // Load featured services
    const servicesData = await getServices()
    const servicesList = Array.isArray(servicesData?.data) ? servicesData.data : []
    const topServices = servicesList
      .filter((s) => s.provider?.rating)
      .sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))
      .slice(0, 6)
    setFeaturedServices(topServices)
  } catch (error) {
    toast.error("Failed to load dashboard data")
  } finally {
    setIsLoading(false)
  }
}

if (isLoading) return <CustomerDashboardSkeleton />
```

**AFTER:**

```typescript
// New implementation
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Star, Search, ChevronRight, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CustomerDashboardSkeleton } from '@/components/customer/skeletons/CustomerDashboardSkeleton'
import { useRecentBookings, useBookingStats, useFeaturedServices } from '@/lib/queries'
import type { CustomerBooking, CustomerService } from '@/types/customer'

export default function CustomerDashboardPage() {
  const router = useRouter()

  // All queries run in parallel automatically
  const { data: recentBookings = [], isLoading: isLoadingBookings } = useRecentBookings()
  const { data: stats = { totalBookings: 0, pendingBookings: 0, completedBookings: 0 }, isLoading: isLoadingStats } = useBookingStats()
  const { data: featuredServices = [], isLoading: isLoadingServices } = useFeaturedServices()

  // Combined loading state
  const isLoading = isLoadingBookings || isLoadingStats || isLoadingServices

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return <CustomerDashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back! 👋</h1>
        <p className="text-muted-foreground">
          Find and book home services from verified providers
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          <Link href="/customer/bookings">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Start exploring services and book your first service
              </p>
              <Link href="/customer/services">
                <Button>Browse Services</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recentBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{booking.service?.name || 'Unknown Service'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{booking.service?.provider?.businessName || 'Unknown Provider'}</p>
                    </div>
                    <Badge className={getStatusBadgeColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{booking.address?.street || ''}, {booking.address?.city || ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Featured Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Services</h2>
          <Link href="/customer/services">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {featuredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services available</h3>
              <p className="text-sm text-muted-foreground text-center">
                Check back later as new providers are joining
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/customer/services/${service.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{service.provider.businessName}</p>
                    </div>
                    {service.provider.isVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{(service.provider.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({service.provider.totalReviews || 0} reviews)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{service.price}</p>
                      <p className="text-xs text-muted-foreground">per service</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Book Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Step 2.3: Benefits Achieved

✅ **Single API call for bookings** - No more duplicate call
✅ **Parallel loading** - All 3 queries load simultaneously
✅ **Automatic caching** - Second visit is instant
✅ **Better UX** - Each section shows independently as it loads

---

## PHASE 3: Bookings Page (90 minutes) ⭐⭐⭐

### Why This Phase?

- Introduces mutations (cancel, reschedule)
- Optimistic updates (crucial for good UX)
- Query invalidation patterns
- Two pages to migrate (list + detail)

### Current State Analysis

**Files:**

- `app/(pages)/customer/bookings/page.tsx` (List)

**Current Issues:**

1. ❌ Manual state for bookings, services, addresses, slots
2. ❌ Cache management manually done
3. ❌ Cancel booking waits for API response
4. ❌ No optimistic updates

### Step 3.1: Create Booking Hooks

**File**: `lib/queries/use-bookings.ts`

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

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch bookings with optional filters
 */
export function useBookings(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
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

/**
 * Fetch single booking by ID
 */
export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId, // Only fetch if ID exists
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Cancel booking with optimistic update
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: number;
      reason?: string;
    }) => cancelBooking(bookingId, reason),

    onMutate: async ({ bookingId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.all });

      // Snapshot previous value
      const previousBookings = queryClient.getQueryData(
        queryKeys.bookings.lists(),
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.bookings.lists(), (old: any) => {
        if (!old?.bookings) return old;
        return {
          ...old,
          bookings: old.bookings.map((b: CustomerBooking) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b,
          ),
        };
      });

      // Also update detail cache if exists
      const detailKey = queryKeys.bookings.detail(bookingId);
      const previousDetail = queryClient.getQueryData(detailKey);
      if (previousDetail) {
        queryClient.setQueryData(detailKey, (old: any) => ({
          ...old,
          status: "cancelled",
        }));
      }

      return { previousBookings, previousDetail };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBookings) {
        queryClient.setQueryData(
          queryKeys.bookings.lists(),
          context.previousBookings,
        );
      }
      if (context?.previousDetail) {
        const detailKey = queryKeys.bookings.detail(variables.bookingId);
        queryClient.setQueryData(detailKey, context.previousDetail);
      }
      toast.error("Failed to cancel booking");
    },

    onSuccess: () => {
      // Invalidate to ensure server state
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success("Booking cancelled successfully");
    },
  });
}

/**
 * Reschedule booking
 */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      newData,
    }: {
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

### Step 3.2: Update Bookings List Page

**File**: `app/(pages)/customer/bookings/page.tsx`

Key changes:

- Replace `useBookings` hook
- Replace `useCancelBooking` mutation
- Remove manual cache management
- Remove loading state (handled by React Query)

```typescript
// AFTER (simplified example)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CustomerBookingsSkeleton } from '@/components/customer/skeletons/CustomerBookingsSkeleton'
import { useBookings, useCancelBooking } from '@/lib/queries'
import { queryKeys } from '@/lib/queries/query-keys'
import { useQueryClient } from '@tanstack/react-query'
import type { CustomerBooking } from '@/types/customer'

export default function CustomerBookingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // UI State (keep local)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all")
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)

  // React Query hooks
  const { data, isLoading, error } = useBookings()
  const cancelMutation = useCancelBooking()

  const bookings = data?.bookings || []
  const stats = data ? {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  } : { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }

  // Filter bookings based on active tab
  const filteredBookings = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
  }

  if (isLoading) {
    return <CustomerBookingsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">Failed to load bookings</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">Manage your service bookings</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({stats.confirmed})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({stats.cancelled})
          </TabsTrigger>
        </TabsList>

        {/* Bookings Table */}
        {/* ... rest of the component */}
      </Tabs>
    </div>
  )
}
```

### Step 3.3: Test Optimistic Updates

1. Click "Cancel" on a booking
2. ✅ Status should INSTANTLY change to "cancelled" (no loading)
3. ✅ If API fails, status reverts back
4. ✅ Success toast shows

---

## PHASE 4: Services Pages (90 minutes) ⭐⭐⭐⭐

### Why This Phase?

- Most complex queries
- Debounced filters
- Dependent queries (service → slots)
- Multiple API calls in detail page

### Current State Analysis

**Files:**

- `app/(pages)/customer/services/page.tsx` (List)
- `app/(pages)/customer/services/[id]/page.tsx` (Detail)

**Current Issues:**

1. ❌ Manual debouncing logic
2. ❌ No filter state caching
3. ❌ Service detail loads 3+ things sequentially
4. ❌ Slots refetch not automated

### Step 4.1: Create Service Hooks

**File**: `lib/queries/use-services.ts`

```typescript
// lib/queries/use-services.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getServices,
  getServiceById,
  getAvailableSlots,
} from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { ServiceFilters, ServiceDetails, Slot } from "@/types/customer";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch services with filters
 * Automatically refetches when filters change
 */
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

/**
 * Fetch service details
 */
export function useService(serviceId: number) {
  return useQuery({
    queryKey: queryKeys.services.detail(serviceId),
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch available slots for a business
 * Refetches every minute (slots get booked)
 */
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

/**
 * Fetch service reviews
 */
export function useServiceReviews(serviceId: number) {
  return useQuery({
    queryKey: queryKeys.services.reviews(serviceId),
    queryFn: async () => {
      const response = await fetch(`/api/feedback/service/${serviceId}`);
      return response.json();
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Step 4.2: Update Services List Page

**File**: `app/(pages)/customer/services/page.tsx`

**Key Changes:**

- Remove manual debouncing (React Query handles it)
- Remove `hasLoadedOnce` state
- Remove `loadServices` function
- Use `useServices` hook

```typescript
// AFTER (simplified)
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useServices } from '@/lib/queries'
import type { ServiceFilters } from '@/types/customer'
import { getAllStates, getCitiesByState } from '@/lib/data/india-locations'

export default function CustomerServicesPage() {
  const router = useRouter()

  // Filter state (local UI state)
  const [filterState, setFilterState] = useState({
    state: 'all',
    city: 'all',
    category: 'all',
    priceRange: [0, 10000] as [number, number],
    search: '',
  })

  // Memoized filters object
  const filters = useMemo<ServiceFilters>(
    () => ({
      state: filterState.state === 'all' ? undefined : filterState.state,
      city: filterState.city === 'all' ? undefined : filterState.city,
      categoryId: filterState.category === 'all' ? undefined : parseInt(filterState.category),
      minPrice: filterState.priceRange[0] === 0 ? undefined : filterState.priceRange[0],
      maxPrice: filterState.priceRange[1] === 10000 ? undefined : filterState.priceRange[1],
      search: filterState.search.trim() || undefined,
    }),
    [filterState]
  )

  // React Query hook - automatically refetches when filters change
  const { data, isLoading, error } = useServices(filters)

  const services = data?.services || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Search and filters UI */}
      {/* ... */}

      {/* Services grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 4.3: Update Service Detail Page

**Key Changes:**

- Parallel loading of service, slots, addresses
- Auto-refetch slots every minute
- Remove manual state for service, slots, addresses

```typescript
// AFTER (simplified)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useService, useServiceSlots } from '@/lib/queries'
import { useAddresses } from '@/lib/queries'
import { ServiceDetailSkeleton } from '@/components/customer/skeletons/ServiceDetailSkeleton'

export default function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter()
  const { id } = use(params)
  const serviceId = parseInt(id)

  // All queries run in parallel
  const { data: service, isLoading: isLoadingService } = useService(serviceId)
  const { data: slots = [], isLoading: isLoadingSlots } = useServiceSlots(
    service?.businessProfileId || 0
  )
  const { data: addresses = [], isLoading: isLoadingAddresses } = useAddresses()

  const isLoading = isLoadingService || isLoadingSlots || isLoadingAddresses

  // UI state (local)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

  if (isLoading) {
    return <ServiceDetailSkeleton />
  }

  if (!service) {
    return <div>Service not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Service details */}
      {/* Slots selection */}
      {/* Address selection */}
      {/* Book button */}
    </div>
  )
}
```

---

## PHASE 5: Profile Page (45 minutes) ⭐⭐

### Step 5.1: Create Profile Hooks

**File**: `lib/queries/use-profile.ts`

```typescript
// lib/queries/use-profile.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
} from "@/lib/profile-api";
import { queryKeys } from "./query-keys";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000,
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
    onError: () => {
      toast.error("Failed to update profile");
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
  });
}
```

---

## PHASE 6: Advanced Features (60 minutes) ⭐⭐⭐⭐⭐

### 6.1 Prefetch on Hover

```typescript
// In services list
<Link
  href={`/customer/services/${service.id}`}
  onMouseEnter={() => {
    // Prefetch service details on hover
    queryClient.prefetchQuery({
      queryKey: queryKeys.services.detail(service.id),
      queryFn: () => getServiceById(service.id),
    })
  }}
>
  <ServiceCard service={service} />
</Link>
```

### 6.2 Infinite Scroll

```typescript
// For services or bookings with pagination
import { useInfiniteQuery } from "@tanstack/react-query";

export function useServicesInfinite(filters?: ServiceFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.services.list(filters || {}),
    queryFn: ({ pageParam = 0 }) =>
      getServices({ ...filters, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < 20) return undefined;
      return allPages.length * 20;
    },
  });
}
```

---

## PHASE 7: Testing & Optimization (60 minutes)

### Testing Checklist

- [ ] All pages load without errors
- [ ] Skeleton loaders show correctly
- [ ] Cache works (navigate back = instant load)
- [ ] Mutations work (create, update, delete)
- [ ] Optimistic updates work
- [ ] Error handling works (try invalid data)
- [ ] Refetch on window focus works
- [ ] DevTools show queries correctly

### Performance Checks

```typescript
// Add React Query Devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

---

## 📝 Migration Checklist

### Phase 0: Setup

- [ ] Install @tanstack/react-query
- [ ] Create lib/queries folder
- [ ] Create query-keys.ts
- [ ] Create query-client.ts
- [ ] Add QueryClientProvider to layout

### Phase 1: Addresses

- [ ] Create use-addresses.ts
- [ ] Update addresses page
- [ ] Test CRUD operations
- [ ] Verify optimistic updates

### Phase 2: Dashboard

- [ ] Create use-dashboard.ts
- [ ] Update dashboard page
- [ ] Verify parallel loading
- [ ] Check cache on revisit

### Phase 3: Bookings

- [ ] Create use-bookings.ts
- [ ] Update bookings list page
- [ ] Update booking detail page
- [ ] Test cancel mutation
- [ ] Verify optimistic updates

### Phase 4: Services

- [ ] Create use-services.ts
- [ ] Update services list page
- [ ] Update service detail page
- [ ] Test filters
- [ ] Verify parallel loading

### Phase 5: Profile

- [ ] Create use-profile.ts
- [ ] Update profile page
- [ ] Test update mutations
- [ ] Test avatar upload

### Phase 6: Advanced

- [ ] Add prefetch on hover
- [ ] Add infinite scroll (optional)
- [ ] Add query cancellation

### Phase 7: Final

- [ ] Test all user flows
- [ ] Check error handling
- [ ] Verify cache behavior
- [ ] Performance check

---

## 🎯 Success Metrics

After completing all phases:

✅ **Page Load Time**: 40-60% faster (cached data)
✅ **API Calls**: Reduced by 60-70% (deduplication)
✅ **Code Reduction**: ~40% less state management code
✅ **UX**: Instant optimistic updates
✅ **Debugging**: DevTools show all queries
✅ **Maintainability**: Centralized query logic

---

**Next Step**: Would you like me to start with Phase 0 (Setup) and create all the files?
