# Category Management UI - Implementation Plan

## Overview
Admin can manage service categories with full CRUD operations (Create, Read, Update, Delete) for the HSM platform.

## Backend API Contract

### Endpoints

| Method | Endpoint | Protection | Purpose |
|--------|----------|------------|---------|
| GET | `/categories` | Public | Fetch all categories |
| POST | `/categories` | Admin only | Add new category |
| DELETE | `/categories/:id` | Admin only | Delete category |

### Data Structures

**Category Object:**
```typescript
{
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}
```

**API Request/Response:**

```typescript
// GET /categories - Response
{
  categories: Category[]
}

// POST /categories - Request
{
  name: string;
  description: string;
}

// POST /categories - Response (Success)
{
  message: "Category added successfully";
  category: Category;
}

// DELETE /categories/:id - Response (Success)
{
  message: "Category deleted successfully";
}

// Error Response
{
  message: string;
  error?: string;
}
```

---

## UI Component Structure

```
/app/(pages)/admin/categories/
├── page.tsx                    # Main categories page
└── components/
    ├── CategoryList.tsx         # Display all categories
    ├── CategoryCard.tsx         # Single category display
    ├── AddCategoryDialog.tsx    # Add category modal/form
    ├── DeleteCategoryDialog.tsx # Confirmation dialog
    └── CategorySearch.tsx       # Search/filter bar (optional)
```

---

## Implementation Steps

### Step 1: Setup Type Definitions

**File:** `types/category.ts`

```typescript
export interface Category {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryResponse {
  message: string;
  category: Category;
}
```

### Step 2: Update API Endpoints

**File:** `lib/api.ts`

Add to `API_ENDPOINTS`:
```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string | number) => `/categories/${id}`,
} as const;
```

### Step 3: Create Category API Utilities

**File:** `lib/category-api.ts`

```typescript
import { api, API_ENDPOINTS } from "./lib/api";
import type { CategoriesResponse, CategoryResponse, Category } from "./types/category";

/**
 * Fetch all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<CategoriesResponse>(API_ENDPOINTS.CATEGORIES);
  return response.categories;
};

/**
 * Add new category (Admin only)
 */
export const addCategory = async (data: {
  name: string;
  description: string;
}): Promise<Category> => {
  const response = await api.post<CategoryResponse>(
    API_ENDPOINTS.CATEGORIES,
    data
  );
  return response.category;
};

/**
 * Delete category (Admin only)
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
};
```

### Step 4: Create Category List Component

**File:** `app/(pages)/admin/categories/components/CategoryList.tsx`

**Features:**
- Display categories in grid/list view
- Loading state
- Empty state (no categories)
- Error state
- Responsive layout

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Categories (Page Title)                             │
│  + Add Category Button                               │
├─────────────────────────────────────────────────────┤
│  [Search Bar]  [Filter]  [Sort]                     │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ Category Card 1  │  │ Category Card 2  │        │
│  │ Name: Plumbing   │  │ Name: Cleaning   │        │
│  │ Desc: ...        │  │ Desc: ...        │        │
│  │ [Edit] [Delete]  │  │ [Edit] [Delete]  │        │
│  └──────────────────┘  └──────────────────┘        │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ Category Card 3  │  │ Category Card 4  │        │
│  └──────────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Step 5: Create Category Card Component

**File:** `app/(pages)/admin/categories/components/CategoryCard.tsx`

**Display:**
- Category name (bold, large)
- Description (truncated if too long)
- Created date (optional)
- Action buttons:
  - Edit icon/button
  - Delete icon/button

**Hover Effects:**
- Card elevation on hover
- Action buttons appear/highlight

### Step 6: Create Add Category Dialog

**File:** `app/(pages)/admin/categories/components/AddCategoryDialog.tsx`

**Features:**
- Modal dialog with form
- Form validation:
  - Name: Required, min 2 chars, max 100 chars
  - Description: Required, min 10 chars, max 500 chars
- Real-time validation feedback
- Character counters
- Loading state during submit
- Success/error toasts
- Close on success or cancel

**Form Fields:**
```
┌─────────────────────────────────────────┐
│  Add New Category                        │
├─────────────────────────────────────────┤
│  Name *                                  │
│  ┌─────────────────────────────────┐   │
│  │ Enter category name             │   │
│  └─────────────────────────────────┘   │
│  (2/100 characters)                     │
│                                          │
│  Description *                           │
│  ┌─────────────────────────────────┐   │
│  │ Enter description               │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│  (25/500 characters)                    │
│                                          │
│  [Cancel]              [Add Category]   │
└─────────────────────────────────────────┘
```

### Step 7: Create Delete Category Dialog

**File:** `app/(pages)/admin/categories/components/DeleteCategoryDialog.tsx`

**Features:**
- Confirmation dialog
- Shows category name and description
- Warning message about deletion
- Confirm/Cancel buttons
- Loading state during deletion
- Close after successful deletion

**UI:**
```
┌─────────────────────────────────────────┐
│  Delete Category?                        │
├─────────────────────────────────────────┤
│  Are you sure you want to delete this   │
│  category?                               │
│                                          │
│  Category: Plumbing                      │
│  Description: Professional plumbing...   │
│                                          │
│  ⚠️ This action cannot be undone.       │
│                                          │
│  [Cancel]              [Delete]          │
└─────────────────────────────────────────┘
```

### Step 8: Create Main Categories Page

**File:** `app/(pages)/admin/categories/page.tsx`

**Features:**
- Page header with title
- "Add Category" button (opens dialog)
- Fetch categories on mount
- Loading state
- Error handling
- Refresh functionality
- Search/Filter (optional)

**State Management:**
```typescript
interface State {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  isAddDialogOpen: boolean;
  deleteCategoryId: number | null;
  searchQuery: string;
}
```

### Step 9: Add Update Category Functionality (Optional Enhancement)

**Backend Note:** Update endpoint not shown in routes, but can be added later.

**For Now:** Delete and recreate = Update workflow

**Future Enhancement:**
- Add PUT `/categories/:id` endpoint
- Edit button opens dialog with pre-filled data
- Submit updates existing category

---

## Page Flow Diagram

```
User visits /admin/categories
    ↓
AdminLayout checks authentication
    ↓
Page loads with loading state
    ↓
Fetch categories (GET /categories)
    ↓
┌─────────────┬──────────────┬─────────────┐
│  Success    │    Error     │   Empty     │
├─────────────┼──────────────┼─────────────┤
│ Show list   │ Show error   │ Show empty  │
│ of cards    │ message      │ state +     │
│             │ + retry      │ add button  │
└─────────────┴──────────────┴─────────────┘
    ↓
User clicks "Add Category"
    ↓
Open AddCategoryDialog
    ↓
User fills form → Validates → Submits
    ↓
POST /categories (with token cookie)
    ↓
┌─────────────┬──────────────┐
│  Success    │    Error     │
├─────────────┼──────────────┤
│ Show success│ Show error   │
│ toast       │ toast        │
│ Close dialog│ Keep open    │
│ Refresh list│              │
└─────────────┴──────────────┘
    ↓
User clicks "Delete" on category
    ↓
Open DeleteCategoryDialog
    ↓
User confirms
    ↓
DELETE /categories/:id (with token cookie)
    ↓
┌─────────────┬──────────────┐
│  Success    │    Error     │
├─────────────┼──────────────┤
│ Show success│ Show error   │
│ toast       │ toast        │
│ Close dialog│ Keep open    │
│ Refresh list│              │
└─────────────┴──────────────┘
```

---

## Component Interactions

```
CategoriesPage (Parent)
    │
    ├── manages state:
    │   ├── categories (list)
    │   ├── isLoading
    │   ├── error
    │   ├── addDialogOpen
    │   └── deleteCategoryId
    │
    ├── fetches data on mount
    ├── handles refresh
    │
    ├── AddCategoryDialog
    │   ├── receives: onAddSuccess callback
    │   ├── submits: POST /categories
    │   └── notifies parent on success
    │
    ├── CategoryList
    │   ├── receives: categories, onDeleteClick
    │   └── renders: CategoryCard for each
    │
    └── DeleteCategoryDialog
        ├── receives: category, onDeleteSuccess
        ├── submits: DELETE /categories/:id
        └── notifies parent on success
```

---

## Validation Rules

### Add Category Form

| Field | Rules | Error Message |
|-------|-------|---------------|
| name | Required, min 2 chars, max 100 chars, unique | "Name must be 2-100 characters" / "Category already exists" |
| description | Required, min 10 chars, max 500 chars | "Description must be 10-500 characters" |

### Client-Side Validation

```typescript
// Name validation
const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

// Description validation
const validateDescription = (desc: string): boolean => {
  return desc.trim().length >= 10 && desc.trim().length <= 500;
};
```

### Backend Validation (Already Implemented)
- Name required
- Description required
- Returns 400 if validation fails

---

## Error Handling

### Scenarios

| Error | Display | Action |
|-------|---------|--------|
| Network error | Toast message | "Failed to connect. Please try again." |
| 400 Validation | Inline errors + Toast | Show field-specific errors |
| 401 Unauthorized | Toast + Redirect | "Session expired. Redirecting to login..." |
| 403 Forbidden | Toast | "You don't have permission to add categories." |
| 404 Not found | Toast | "Category not found." |
| 500 Server error | Toast | "Server error. Please try again later." |

### Error States

```typescript
// Page level error
{
  error: "Failed to load categories",
  onRetry: () => fetchCategories()
}

// Form level error
{
  name: "Category name is required",
  description: "Description is too short"
}
```

---

## Loading States

### Page Loading
```
┌─────────────────────────────────────┐
│  Categories                          │
│  + Add Category                      │
├─────────────────────────────────────┤
│  [Spinner] Loading categories...    │
└─────────────────────────────────────┘
```

### Action Loading
- Add button shows spinner: "Adding..."
- Delete button shows spinner: "Deleting..."
- Disable all actions during loading

---

## Empty State

```
┌─────────────────────────────────────────────┐
│  Categories                                  │
│  + Add Category                              │
├─────────────────────────────────────────────┤
│                                              │
│           ┌─────────────────┐               │
│         __│               │__               │
│        /  │               │  \              │
│       │   │    Empty      │   │             │
│        \  │               │  /              │
│         ││               ││                │
│          └─────────────────┘                │
│                                              │
│      No categories found                    │
│  Create your first category to get started  │
│                                              │
│          [Add Category]                     │
└─────────────────────────────────────────────┘
```

---

## Success Feedback

### Add Category Success
```
Toast: ✓ "Category 'Plumbing' added successfully"
- Dialog closes
- List refreshes
- New card highlights briefly
```

### Delete Category Success
```
Toast: ✓ "Category deleted successfully"
- Dialog closes
- List refreshes
- Deleted card fades out
```

---

## Accessibility Features

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels on buttons
- Focus management in dialogs
- Screen reader announcements
- High contrast mode support
- Error messages announced

---

## Responsive Design

### Desktop (> 1024px)
```
3 columns grid
Full descriptions visible
All actions visible
```

### Tablet (768px - 1024px)
```
2 columns grid
Descriptions truncated
Actions on hover
```

### Mobile (< 768px)
```
1 column stack
Descriptions truncated
Actions always visible
Horizontal scroll for cards
```

---

## Testing Checklist

- [ ] Load categories successfully
- [ ] Show loading state
- [ ] Show empty state when no categories
- [ ] Show error state on fetch failure
- [ ] Add category with valid data
- [ ] Show validation errors for invalid data
- [ ] Prevent adding duplicate category name
- [ ] Delete category successfully
- [ ] Show confirmation before delete
- [ ] Refresh list after add/delete
- [ ] Handle network errors gracefully
- [ ] Toast notifications for all actions
- [ ] Responsive layout on all screen sizes
- [ ] Keyboard navigation works
- [ ] Dialog closes on Escape key
- [ ] Focus trapped in dialog
- [ ] Delete button disabled during loading

---

## Optional Enhancements (Future)

1. **Edit Category**
   - Add PUT endpoint to backend
   - Edit button opens pre-filled dialog
   - Update existing category

2. **Bulk Actions**
   - Select multiple categories
   - Bulk delete
   - Bulk export

3. **Search & Filter**
   - Search by name
   - Filter by date created
   - Sort by name/date

4. **Pagination**
   - If many categories
   - Page size: 12, 24, 48

5. **Export**
   - Export categories as CSV
   - Export as PDF

6. **Activity Log**
   - Track who created/updated/deleted
   - Show timestamp of changes

7. **Categories Usage**
   - Show how many services use each category
   - Warn if category is in use before delete

8. **Category Icon/Image**
   - Upload category icon
   - Display in card

---

## Implementation Order

### Phase 1: Core Functionality (MVP)
1. ✅ Type definitions
2. ✅ API utilities
3. ✅ CategoryList component
4. ✅ CategoryCard component
5. ✅ AddCategoryDialog component
6. ✅ DeleteCategoryDialog component
7. ✅ Main page integration

### Phase 2: Polish & UX
8. Loading states
9. Error handling
10. Empty states
11. Success toasts
12. Validation feedback

### Phase 3: Enhancements (Optional)
13. Search functionality
14. Filter/sort options
15. Bulk operations
16. Export features

---

## File Structure Summary

```
types/
└── category.ts                 # Category types

lib/
└── category-api.ts            # Category API functions

app/(pages)/admin/categories/
├── page.tsx                   # Main categories page
├── components/
│   ├── CategoryList.tsx       # List of categories
│   ├── CategoryCard.tsx       # Single category display
│   ├── AddCategoryDialog.tsx  # Add category form
│   └── DeleteCategoryDialog.tsx # Delete confirmation
```

---

## Quick Start Code Snippets

### Fetch Categories Hook
```typescript
const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { categories, isLoading, error, refetch: () => getCategories().then(setCategories) };
};
```

### Add Category Handler
```typescript
const handleAddCategory = async (data: CategoryFormData) => {
  try {
    await addCategory(data);
    toast.success("Category added successfully");
    refetch(); // Refresh list
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Delete Category Handler
```typescript
const handleDeleteCategory = async (id: number) => {
  try {
    await deleteCategory(id);
    toast.success("Category deleted successfully");
    refetch(); // Refresh list
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

This plan provides a complete roadmap for building the Category Management UI with all necessary components, validations, error handling, and user experience considerations.
