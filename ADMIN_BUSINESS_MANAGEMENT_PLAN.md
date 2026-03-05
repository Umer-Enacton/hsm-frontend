# Admin Business Management Feature - Implementation Plan

## Overview

Add a comprehensive business management feature to the admin panel that allows administrators to view, verify, and manage all provider businesses on the platform.

---

## 1. Features & Requirements

### 1.1 Business List View
**Page:** `/admin/business`

**Display:**
- Table/list of all registered businesses
- Search bar for business name
- Filter by verification status (All, Pending, Verified)
- Filter by state/region
- Sort by: Name, Date, Status, Rating
- Pagination (20 businesses per page)

**Business Card/Row Shows:**
- Business logo & name
- Provider name & email
- Category
- Location (City, State)
- Verification status badge (Pending/Verified)
- Rating (if any)
- Total reviews
- Created date
- Action buttons: View, Verify, Delete

### 1.2 Business Detail View
**Modal/Page:** Business detail view

**Information Sections:**
1. **Business Information**
   - Logo & Cover Image
   - Business Name
   - Description
   - Category
   - Phone (business)
   - Location (City, State)
   - Website
   - Verification Status

2. **Provider Information**
   - Provider Name
   - Provider Email
   - Provider Phone
   - Provider Avatar

3. **Services Offered**
   - List of all services
   - Pricing
   - Duration

4. **Statistics**
   - Total bookings
   - Completed bookings
   - Pending bookings
   - Average rating
   - Total reviews

### 1.3 Verification System
**Action:** Admin can verify/unverify businesses

**Verify Business:**
- Click "Verify" button on pending business
- Business status changes to "Verified"
- Provider gets notified (optional)
- Business appears in customer searches

**Unverify Business:**
- Click "Unverify" on verified business
- Business status changes to "Pending"
- Business hidden from customer searches
- Reason input (optional)

### 1.4 Business Actions
- **View Details** - Open business detail modal/page
- **Edit** - Allow admin to edit business details (if needed)
- **Delete** - Delete business with confirmation
  - Warning: "This will delete all services, bookings, and data associated with this business. Are you sure?"
  - Cascade delete confirmation
- **Suspend** - Temporarily suspend business (optional feature)

### 1.5 Search & Filter
**Search:**
- By business name
- By provider name
- By provider email
- By phone number

**Filters:**
- Verification Status: All, Pending, Verified
- State: All states dropdown
- Category: All categories dropdown
- Date Range: Created within [Last 7 days, 30 days, 90 days, All]

### 1.6 Bulk Actions (Optional)
- Select multiple businesses
- Bulk verify (all pending)
- Bulk delete (with warning)
- Export to CSV

---

## 2. UI/UX Design

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ HSM Admin                                                  │
│ └─ Businesses                                              │
├─────────────────────────────────────────────────────────────┤
│ [Search business...] [Filter▼] [Status▼] [State▼] [Refresh] │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 📊 124 Total Businesses | 45 Pending | 79 Verified      │ │
│ └───────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Business                    | Provider   | Status | Actions│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [Logo] QuickFix Plumbing      | John Doe   | ⏳ Pend.| [┋]  │ │
│ │        Plumbing, Lahore       | johndoe@..│         │ │
│ │        ⭐ 4.5 (23 reviews)    |           │         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [Logo] HomeClean Services     | Jane Smith | ✓ Verif.| [┋]  │ │
│ │        Cleaning, Mumbai       | jane@...   │         │ │
│ │        ⭐ 4.8 (156 reviews)   |           │         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                        ← Previous | 1 | 2 | 3 | Next →       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Business Detail Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Business Details                              [✕ Close]      │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │  [Cover Image - Full Width]                           │  │
│ │  ┌─────────────┐                                       │  │
│ │  │             │  QuickFix Plumbing Services           │  │
│ │  │   [Logo]    │  ⭐ 4.5 (23 reviews) ✓ Verified        │  │
│ │  │             │  Plumbing • Lahore, Punjab            │  │
│ │  └─────────────┘                                       │  │
│ │                                                       │  │
│ │  Description: Professional plumbing services...         │  │
│ │                                                       │  │
│ │  📊 Statistics:                                      │  │
│ │  • Total Bookings: 156                               │  │
│ │  • Completed: 142 (91%)                              │  │
│ │  • Pending: 8                                        │  │
│ │  • Avg Rating: 4.5/5                                 │  │
│ │                                                       │  │
│ │  👤 Provider:                                        │  │
│ │  Name: John Doe                                      │  │
│ │  Email: john@example.com                             │  │
│ │  Phone: +92 300 1234567                             │  │
│ │                                                       │  │
│ │  🔧 Services (5):                                    │  │
│ │  • Pipe Repair - $50/hr                               │  │
│ │  • Drain Cleaning - $80/hr                            │  │
│ │  • Water Heater - $100/hr                             │  │
│ │  • Bathroom Fitting - $120/hr                         │  │
│ │  • Emergency Service - $150/hr                        │  │
│ │                                                       │  │
│ │  [Verify Business] [Unverify] [Edit] [Delete]        │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Status Badges

**Pending Verification:**
```
⏳ Pending
- Gray background
- Warning color border
```

**Verified:**
```
✓ Verified
- Green background
- Green checkmark icon
```

**Suspended:**
```
⚠️ Suspended
- Yellow/Orange background
```

---

## 3. Backend API Endpoints

### Already Available:
- ✅ `GET /businesses` - Get all businesses
- ✅ `GET /businesses/:id` - Get business by ID
- ✅ `PUT /businesses/verify/:id` - Verify business
- ✅ `DELETE /businesses/:id` - Delete business
- ✅ `PUT /businesses/:id` - Update business

### May Need to Add:
- `GET /businesses?status=pending&state=Maharashtra&page=1&limit=20` - Filtered list
- `POST /businesses/:id/suspend` - Suspend business (optional)
- `POST /businesses/:id/unverify` - Unverify business

---

## 4. Frontend Components to Create

### 4.1 Main Page
**File:** `app/(pages)/admin/business/page.tsx`

### 4.2 Components (create in `components/admin/business/`)
```
components/admin/business/
├── BusinessList.tsx           # Main table/list
├── BusinessCard.tsx           # Business card for list view
├── BusinessDetailModal.tsx    # Detail view modal
├── BusinessActions.tsx        # Action buttons dropdown
├── BusinessFilters.tsx        # Search and filter bar
├── BusinessStats.tsx          # Statistics cards
└── VerifyConfirmDialog.tsx    # Confirmation dialog
```

### 4.3 Type Definitions
**File:** `types/admin.ts` (or extend existing)

```typescript
export interface AdminBusinessListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'pending' | 'verified';
  state?: string;
  categoryId?: number;
  sortBy?: 'name' | 'createdAt' | 'rating' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface BusinessStats {
  total: number;
  pending: number;
  verified: number;
  suspended: number;
}
```

---

## 5. Implementation Steps

### Phase 1: Setup (5 min)
1. Add "Businesses" to admin sidebar navigation
2. Import Briefcase icon for businesses tab
3. Create admin/business directory

### Phase 2: API Integration (10 min)
1. Create `lib/admin/business.ts` for API calls
2. Add functions:
   - `getAllBusinesses(params)` - Fetch with filters
   - `verifyBusiness(id)` - Verify business
   - `unverifyBusiness(id)` - Unverify business
   - `deleteBusiness(id)` - Delete business
   - `getBusinessStats()` - Get statistics

### Phase 3: Page Structure (15 min)
1. Create page layout with:
   - Header with title and description
   - Search bar
   - Filter dropdowns
   - Stats cards (Total, Pending, Verified)
   - Business list/table
   - Pagination

### Phase 4: Business List (20 min)
1. Create BusinessCard component
2. Display:
   - Business logo
   - Name & category
   - Location
   - Status badge
   - Rating
   - Provider info
   - Action buttons (View, Verify, Delete)

### Phase 5: Detail Modal (20 min)
1. Create BusinessDetailModal component
2. Sections:
   - Business info (logo, cover, details)
   - Provider info
   - Services list
   - Statistics
   - Action buttons

### Phase 6: Actions (15 min)
1. Verify action with confirmation
2. Unverify action with reason dialog
3. Delete action with warning
4. Toast notifications for all actions

### Phase 7: Search & Filter (15 min)
1. Implement search debouncing
2. Status filter dropdown
3. State filter dropdown
4. Apply filters to API call

### Phase 8: Polish (10 min)
1. Loading states
2. Error handling
3. Empty states
4. Responsive design
5. Animations

---

## 6. Color Scheme & Styling

### Status Colors:
```css
/* Pending */
.status-pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

/* Verified */
.status-verified {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #22c55e;
}

/* Suspended */
.status-suspended {
  background: #fed7aa;
  color: #9a3412;
  border: 1px solid #f97316;
}
```

---

## 7. File Structure

```
app/(pages)/admin/business/
└── page.tsx                           # Main page

components/admin/business/
├── BusinessList.tsx                   # Business list/table
├── BusinessCard.tsx                   # Individual business card
├── BusinessDetailModal.tsx            # Detail view modal
├── BusinessFilters.tsx                # Search & filter bar
├── BusinessStats.tsx                  # Statistics cards
├── BusinessActions.tsx                # Action buttons menu
└── types.ts                           # Type definitions

lib/admin/
└── business.ts                        # API functions

types/admin.ts                         # Extended type definitions
```

---

## 8. Mock Data for Testing

```typescript
const mockBusinesses = [
  {
    id: 1,
    name: "QuickFix Plumbing",
    providerName: "John Doe",
    providerEmail: "john@example.com",
    category: "Plumbing",
    city: "Mumbai",
    state: "Maharashtra",
    isVerified: false,
    rating: 4.5,
    totalReviews: 23,
    phone: "+91 98765 43210",
    logo: "https://...",
    coverImage: "https://...",
    createdAt: "2025-02-20"
  },
  // ... more businesses
];
```

---

## 9. Success Criteria

### Must Have:
- ✅ Businesses tab in admin sidebar
- ✅ List all businesses with pagination
- ✅ Search by name/provider
- ✅ Filter by verification status
- ✅ View business details
- ✅ Verify/unverify businesses
- ✅ Delete businesses with confirmation
- ✅ Responsive design

### Nice to Have:
- Export to CSV
- Bulk actions
- Suspend feature
- Advanced analytics
- Email notifications on verification

---

## 10. Priority Order

1. **P0 (Critical):**
   - Sidebar navigation
   - Business list view
   - Verify/unverify actions
   - Business details modal

2. **P1 (Important):**
   - Search functionality
   - Status filters
   - Delete with confirmation
   - Loading states

3. **P2 (Enhancement):**
   - State filter
   - Category filter
   - Statistics cards
   - Export functionality

---

## 11. Time Estimate

- **Total Time:** ~2 hours
- **Setup & API:** 15 min
- **List & Cards:** 35 min
- **Detail Modal:** 20 min
- **Actions:** 15 min
- **Search & Filters:** 15 min
- **Testing & Polish:** 20 min

---

## 12. Next Steps

Once you approve this plan, I will:

1. ✅ Add "Businesses" to admin sidebar
2. ✅ Create admin/business page structure
3. ✅ Implement business list with cards
4. ✅ Add detail modal with all sections
5. ✅ Implement verify/unverify/delete actions
6. ✅ Add search and filter functionality
7. ✅ Test all features

**Ready to proceed?** Please confirm if this plan meets your requirements or if you'd like any adjustments!
