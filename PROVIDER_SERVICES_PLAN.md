# Provider Service Management - Implementation Plan 📋

## Executive Summary

This document outlines a comprehensive plan for building a **Provider Service Management** feature, similar to the Admin Business Management feature recently completed. This will allow service providers to create, manage, and control their service offerings.

---

## Current State Analysis

### What Exists Now
1. **Backend API Endpoints:**
   - `GET /services/business/:businessId` - Get all services for a business
   - `POST /services` - Create a new service
   - `GET /services/:id` - Get service by ID
   - `PUT /services/:id` - Update service (assumed)
   - `DELETE /services/:id` - Delete service (assumed)

2. **Frontend API Functions:**
   - `getBusinessServices(businessId)` - ✅ Implemented in `lib/provider/api.ts`
   - `createService(businessId, serviceData)` - ✅ Implemented

3. **Sidebar Navigation:**
   - "Services" tab already exists in provider sidebar (`/provider/services`) but no page exists

4. **Type Definitions:**
   - `Service` interface exists in `types/provider/index.ts` with:
     - id, businessId, name, description, price, duration, image, isActive, createdAt, updatedAt

### What's Missing
1. **No services page** at `/provider/services`
2. **No service management components**
3. **No update/delete API functions** in frontend
4. **No service upload image function** (service images need upload endpoint)
5. **No service statistics/insights**

---

## Features to Implement

### Priority 0 (Must Have) - Core CRUD
- [ ] Services list/grid view
- [ ] Create new service dialog/form
- [ ] Edit existing service dialog/form
- [ ] Delete service with confirmation
- [ ] Toggle service active/inactive status
- [ ] Service image upload

### Priority 1 (Should Have) - Enhanced Features
- [ ] Search services by name/description
- [ ] Filter by status (Active/Inactive)
- [ ] Sort by price, name, date added
- [ ] Service statistics cards
- [ ] Service detail modal/view
- [ ] Bulk actions (activate all, deactivate all)

### Priority 2 (Nice to Have) - Advanced Features
- [ ] Duplicate service functionality
- [ ] Service templates (quick add common services)
- [ ] Drag & drop to reorder services
- [ ] Service categories/tags
- [ ] Export services to CSV
- [ ] Service analytics (most booked, revenue per service)

---

## UI/UX Design Plan

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Provider Services                                              │
│  Manage your service offerings                                 │
│                    [Refresh] [+ Add New Service]                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Total   │ │ Active  │ │Inactive │  │ Avg     │              │
│  │Services │ │Services │ │Services │  │ Price   │              │
│  │   12    │ │    10   │ │    2    │  │ ₹1,250  │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  [Search services...] [All Status ▼] [Sort by: Name ▼]         │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Image]  Basic Plumbing Check        [Active] [⋮]         │ │
│  │          Household • ₹500 • 2 hours                       │ │
│  │          Includes inspection and basic fixes              │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Image]  Emergency Pipe Repair      [Active] [⋮]         │ │
│  │          Household • ₹1,500 • 4 hours                     │ │
│  │          24/7 emergency service                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Image]  Full Bathroom Installation  [Inactive] [⋮]      │ │
│  │          Renovation • ₹15,000 • 2 days                    │ │
│  │          Complete fixture installation                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Card Design

Each service card will display:
- **Service image** (or default icon)
- **Service name** (title)
- **Category badge** (derived from business category)
- **Price** with currency symbol
- **Duration** (e.g., "2 hours", "30 mins", "2 days")
- **Status badge** (Active=green, Inactive=gray)
- **Short description** (truncated if long)
- **Action buttons:**
  - Toggle active/inactive
  - Edit
  - Delete (in dropdown menu)

### Create/Edit Service Dialog

```
┌──────────────────────────────────────────────────────────┐
│  Add New Service                          [×]             │
├──────────────────────────────────────────────────────────┤
│  Service Image:                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │           [📷 Upload Image]                     │    │
│  │           or drag and drop                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Service Name: *                         [____________] │
│                                                          │
│  Description:                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Describe what this service includes...          │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Price (₹): *                            [_______]      │
│                                                          │
│  Duration: *                                            │
│  ┌───────────────────┐ ┌───────────────────┐           │
│  │ [_____]  Number   │ │ [Hours ▼]         │           │
│  └───────────────────┘ └───────────────────┘           │
│                                                          │
│  Status:                                                │
│  ◉ Active  ○ Inactive                                   │
│                                                          │
│  [Cancel]                      [Create Service]         │
└──────────────────────────────────────────────────────────┘
```

### Actions Dropdown Menu

```
┌─────────────────┐
│ 👁 View Details  │
│ ✏️ Edit          │
│ ─────────────────  │
│ ✓ Activate       │ (if inactive)
│ ✕ Deactivate     │ (if active)
│ ─────────────────  │
│ 📋 Duplicate      │
│ ─────────────────  │
│ 🗑️ Delete         │
└─────────────────┘
```

---

## File Structure

```
app/(pages)/provider/services/
└── page.tsx                           # Main services page

lib/provider/
└── services.ts                        # Service API functions (NEW)

components/provider/services/
├── index.ts                          # Barrel export
├── ServiceStats.tsx                  # Statistics cards
├── ServiceFilters.tsx                # Search & filters
├── ServiceList.tsx                   # Services grid
├── ServiceCard.tsx                   # Individual service card
├── ServiceDialog.tsx                 # Create/Edit dialog
└── ServiceDetailModal.tsx            # Detail view modal (optional)
```

---

## Implementation Phases

### Phase 1: Setup & API Layer (15 min)
- [ ] Create `lib/provider/services.ts` with API functions
- [ ] Add updateService function
- [ ] Add deleteService function
- [ ] Add toggleServiceStatus function
- [ ] Add uploadServiceImage function (if endpoint exists)
- [ ] Get service statistics function

### Phase 2: Main Page Structure (15 min)
- [ ] Create `app/(pages)/provider/services/page.tsx`
- [ ] Set up state management
- [ ] Load business and services
- [ ] Handle loading/error states

### Phase 3: Statistics Cards (10 min)
- [ ] Create `ServiceStats.tsx` component
- [ ] Display: Total Services, Active, Inactive, Average Price

### Phase 4: Service List & Cards (25 min)
- [ ] Create `ServiceList.tsx` with grid layout
- [ ] Create `ServiceCard.tsx` component
- [ ] Display service image, name, price, duration
- [ ] Show status badge
- [ ] Add action buttons

### Phase 5: Create/Edit Dialog (25 min)
- [ ] Create `ServiceDialog.tsx`
- [ ] Form with validation
- [ ] Image upload handling
- [ ] Duration selector (minutes, hours, days)
- [ ] Price input with currency
- [ ] Active/inactive toggle

### Phase 6: Filters & Search (10 min)
- [ ] Create `ServiceFilters.tsx` component
- [ ] Search by name/description (debounced)
- [ ] Status filter (All/Active/Inactive)
- [ ] Sort options (Name, Price, Date)

### Phase 7: Actions & Integration (15 min)
- [ ] Implement create service
- [ ] Implement edit service
- [ ] Implement delete with confirmation
- [ ] Implement toggle status
- [ ] Toast notifications
- [ ] Refresh functionality

### Phase 8: Testing & Polish (15 min)
- [ ] Test all CRUD operations
- [ ] Test image upload
- [ ] Test filters and search
- [ ] Responsive design check
- [ ] Loading states
- [ ] Empty states

**Total Estimated Time:** ~2 hours 15 min

---

## API Functions Required

### New File: `lib/provider/services.ts`

```typescript
import { api, API_BASE_URL } from "@/lib/api";
import type { Service } from "@/types/provider";

/**
 * Get all services for a business
 */
export async function getBusinessServices(businessId: number): Promise<Service[]>;

/**
 * Get service by ID
 */
export async function getServiceById(serviceId: number): Promise<Service>;

/**
 * Create a new service
 */
export async function createService(
  businessId: number,
  serviceData: Partial<Service>
): Promise<Service>;

/**
 * Update a service
 */
export async function updateService(
  serviceId: number,
  serviceData: Partial<Service>
): Promise<Service>;

/**
 * Delete a service
 */
export async function deleteService(serviceId: number): Promise<void>;

/**
 * Toggle service active status
 */
export async function toggleServiceStatus(
  serviceId: number,
  isActive: boolean
): Promise<Service>;

/**
 * Upload service image
 */
export async function uploadServiceImage(file: File): Promise<{ url: string }>;

/**
 * Get service statistics
 */
export async function getServiceStats(businessId: number): Promise<{
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
}>;
```

---

## Backend Endpoints Needed

Assuming these exist or need to be verified:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/services/business/:businessId` | GET | Get all services |
| `/services` | POST | Create service |
| `/services/:id` | GET | Get single service |
| `/services/:id` | PUT | Update service |
| `/services/:id` | DELETE | Delete service |
| `/services/:id/toggle` | PATCH | Toggle active status |
| `/service-image` | POST | Upload service image |
| `/services/business/:businessId/stats` | GET | Get statistics |

---

## Type Definitions

Update `types/provider/index.ts` if needed:

```typescript
export interface Service {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  durationUnit?: 'minutes' | 'hours' | 'days'; // Optional enhancement
  image?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  price: number;
  duration: number;
  image?: File | null;
  isActive: boolean;
}
```

---

## Color Coding

### Status Badges

**Active:**
- Green background (#dcfce7)
- Green-700 text (#166534)
- Green border (#22c55e)
- CheckCircle icon

**Inactive:**
- Gray background (#f3f4f6)
- Gray-700 text (#374151)
- Gray border (#9ca3af)
- XCircle icon

---

## User Flow Examples

### Add New Service
1. Click "+ Add New Service" button
2. Dialog opens with form
3. Fill in service details:
   - Upload image (optional)
   - Service name (required)
   - Description (optional)
   - Price (required)
   - Duration (required)
   - Status (default: Active)
4. Click "Create Service"
5. Toast: "Service created successfully"
6. Service appears in list

### Edit Service
1. Click "Edit" on service card or in dropdown
2. Dialog opens with pre-filled data
3. Modify fields as needed
4. Click "Save Changes"
5. Toast: "Service updated successfully"
6. Card updates with new data

### Toggle Service Status
1. Click status badge or "Activate/Deactivate" in dropdown
2. Service status toggles immediately
3. Toast: "Service activated" or "Service deactivated"
4. Badge and card update

### Delete Service
1. Click "Delete" in dropdown menu
2. Confirmation dialog:
   ```
   Are you sure you want to delete "Basic Plumbing"?
   This action cannot be undone.
   ```
3. Confirm → Service deleted
4. Toast: "Service deleted successfully"
5. Stats update automatically

---

## Testing Checklist

- [ ] Services page loads without errors
- [ ] Business loads correctly
- [ ] Services display in grid
- [ ] Statistics show correct counts
- [ ] Add service works with validation
- [ ] Edit service saves changes
- [ ] Delete service shows confirmation
- [ ] Delete removes service from list
- [ ] Toggle status updates badge
- [ ] Search filters services
- [ ] Status filter works (active/inactive)
- [ ] Sort options work correctly
- [ ] Image upload works (if endpoint exists)
- [ ] Toast notifications appear
- [ ] Responsive on mobile/tablet/desktop
- [ ] Empty state shows when no services

---

## Future Enhancements (Optional)

These can be added later if needed:

1. **Service Categories/Tags** - Group services by custom tags
2. **Service Packages** - Bundle multiple services together
3. **Discount/Promo Codes** - Offer discounts on specific services
4. **Service Availability** - Link services to specific time slots
5. **Service Requirements** - Specify what customer needs to provide
6. **Service Gallery** - Multiple images per service
7. **FAQ per Service** - Common questions about the service
8. **Service Reviews** - Show reviews specific to each service
9. **Booking Analytics** - Track which services are most popular
10. **Price History** - Track price changes over time

---

## Next Steps

1. **Verify backend endpoints** exist for all operations
2. **Confirm image upload** endpoint for service images
3. **Review this plan** with the user
4. **Start implementation** beginning with Phase 1

---

## Status

📋 **PLANNING COMPLETE - READY FOR IMPLEMENTATION**

This plan provides a comprehensive roadmap for building the Provider Service Management feature. All core CRUD operations, UI components, and user flows have been defined.

**Estimated Completion Time:** 2-2.5 hours
**Priority:** High (provider side needs service management)
**Dependencies:** Backend service endpoints (verify before starting)
