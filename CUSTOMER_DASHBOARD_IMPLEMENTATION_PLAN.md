# Customer Dashboard Implementation Plan

## Table of Contents
1. [UI Structure & Navigation](#1-ui-structure--navigation)
2. [Feature & Functional Requirements](#2-feature--functional-requirements)
3. [Backend Architecture](#3-backend-architecture)
4. [System Design Considerations](#4-system-design-considerations)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Database Schema Updates](#6-database-schema-updates)
7. [API Endpoints Specification](#7-api-endpoints-specification)

---

## 1. UI Structure & Navigation

### 1.1 Design Philosophy
- **Minimal & Clean**: No sidebar, top navigation only
- **Action-Oriented**: Quick access to key customer actions
- **Mobile-First**: Responsive design prioritizing mobile users
- **Discoverability**: Easy service discovery and booking

### 1.2 Header Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] HSM    [Search Bar]    [Login/Profile ▼]              │
└─────────────────────────────────────────────────────────────────┘
```

#### Navigation Items (when logged in):

**Main Navigation (Dropdown Menu):**
- 🏠 **Browse Services** - Services marketplace
- 📅 **My Bookings** - Booking history and tracking
- 📍 **Addresses** - Manage saved addresses
- ⭐ **Reviews** - My reviews and ratings
- 👤 **Profile** - Account settings
- 🚪 **Logout**

**Quick Actions (Header Buttons):**
- 🔔 **Notifications** - Booking updates, reminders
- 🛒 **Cart** - Active bookings (if applicable)

### 1.3 Page Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (pages)/
│   ├── customer/
│   │   ├── layout.tsx           # Customer layout (header only)
│   │   ├── page.tsx             # Customer dashboard/home
│   │   ├── services/
│   │   │   ├── page.tsx         # Browse all services
│   │   │   └── [id]/            # Service details
│   │   ├── bookings/
│   │   │   ├── page.tsx         # My bookings list
│   │   │   ├── [id]/            # Booking details
│   │   │   └── new/
│   │   │       └── [serviceId]/  # Book a service
│   │   ├── addresses/
│   │   │   ├── page.tsx         # Manage addresses
│   │   │   └── new/
│   │   ├── reviews/
│   │   │   └── page.tsx         # My reviews
│   │   └── profile/
│   │       └── page.tsx         # Account settings
│   ├── provider/
│   └── admin/
```

---

## 2. Feature & Functional Requirements

### 2.1 Core Customer Workflows

#### Workflow 1: Service Discovery & Booking
```
1. Customer lands on dashboard → Sees featured services/categories
2. Browse/Filter services by category, location, price
3. View service details (provider info, pricing, reviews)
4. Select date & time slot
5. Select service address (or add new)
6. Confirm booking → Booking created (PENDING)
7. Provider confirms → Booking CONFIRMED
8. Service delivered → Booking COMPLETED
9. Customer leaves review
```

#### Workflow 2: Booking Management
```
1. View all bookings with status indicators
2. Filter by status (upcoming, completed, cancelled)
3. View booking details
4. Cancel booking (if PENDING)
5. Reschedule (if provider allows)
6. Track provider arrival
7. Complete & review
```

#### Workflow 3: Profile Management
```
1. Update personal information
2. Add/update/delete addresses
3. View booking history
4. Manage reviews
5. Notification preferences
```

### 2.2 Feature Requirements Matrix

| Feature | Description | Priority | Dependencies |
|---------|-------------|----------|--------------|
| **Browse Services** | Search/filter services by category, location, price | P0 | Categories API, Services API |
| **Service Details** | View provider info, pricing, reviews, availability | P0 | Provider API, Slots API |
| **Book Service** | Create booking with date, time, address selection | P0 | Slots API, Address API, Booking API |
| **My Bookings** | List all bookings with status tracking | P0 | Booking API |
| **Booking Details** | View detailed booking info, actions (cancel/reschedule) | P1 | Booking API |
| **Address Management** | CRUD operations for addresses | P0 | Address API |
| **Leave Review** | Rate and review completed bookings | P1 | Feedback API |
| **Notifications** | Real-time booking updates | P2 | WebSocket/SSE |
| **Search** | Full-text service search | P1 | Search API |
| **Favorites** | Save favorite services/providers | P2 | Wishlist API |

### 2.3 Data Flow & State Management

#### Global State (Zustand/Context)
```typescript
interface CustomerState {
  user: User | null;
  addresses: Address[];
  currentBooking: BookingSession | null;
  notifications: Notification[];

  // Actions
  setUser: (user: User) => void;
  addAddress: (address: Address) => void;
  setCurrentBooking: (booking: BookingSession) => void;
}
```

#### Booking Session State
```typescript
interface BookingSession {
  serviceId: number;
  providerId: number;
  businessId: number;
  selectedDate: string;
  selectedSlot: string;
  selectedAddress: Address;
  estimatedPrice: number;
}
```

### 2.4 Error Handling Strategy

| Error Type | User Message | Action |
|------------|--------------|--------|
| Auth required | "Please login to continue" | Redirect to login |
| Service unavailable | "This service is currently not available" | Show alternative services |
| Slot booked | "This time slot is no longer available" | Refresh slots, show alternatives |
| Invalid address | "Please select a valid address" | Open address modal |
| Booking failed | "Unable to complete booking. Please try again" | Retry with toast |

---

## 3. Backend Architecture

### 3.1 Database Schema (Existing + Enhancements)

#### Existing Tables (Already Implemented)
```sql
-- Users (customer, provider, admin)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL -- 'customer', 'provider', 'admin'
);

-- Addresses
CREATE TABLE address (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  address_type VARCHAR(20) DEFAULT 'home',
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL
);

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(1000),
  image VARCHAR(500)
);

-- Business Profiles
CREATE TABLE business_profiles (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  business_name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  phone VARCHAR(20) NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  website VARCHAR(255),
  logo VARCHAR(500),
  cover_image VARCHAR(500),
  rating DECIMAL(3,2),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Services
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  business_profile_id INTEGER REFERENCES business_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  price INTEGER NOT NULL,
  estimate_duration INTEGER NOT NULL,
  image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Slots (Provider availability)
CREATE TABLE slots (
  id SERIAL PRIMARY KEY,
  business_profile_id INTEGER REFERENCES business_profiles(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id INTEGER REFERENCES business_profiles(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
  address_id INTEGER REFERENCES address(id) ON DELETE CASCADE,
  booking_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  total_price INTEGER NOT NULL
);

-- Feedback
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  rating DECIMAL(2,1) NOT NULL,
  comments VARCHAR(2000),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Additional Tables Needed (Future Enhancements)
```sql
-- Notifications (for customer notifications)
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'booking_created', 'booking_confirmed', 'booking_completed', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id INTEGER, -- booking_id, service_id, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wishlist (saved services)
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, service_id)
);
```

### 3.2 API Routes Specification

#### Customer-Focused Endpoints

```javascript
// ============ SERVICES ============
// Browse all services (with filters)
GET  /services
Query Params: ?category_id=&state=&city=&min_price=&max_price=&search=
Response: { services: Service[], total: number }

// Get service details
GET  /services/:id
Response: { service: Service, provider: Provider, slots: Slot[], reviews: Review[] }

// Get available slots for a business on a specific date
GET  /slots/public/:businessId
Query Params: ?date=YYYY-MM-DD
Response: { slots: Slot[], bookedSlots: number[] }

// ============ BOOKINGS ============
// Create new booking
POST /booking
Body: { serviceId, slotId, addressId, bookingDate }
Response: { booking: Booking, message: "Booking created successfully" }

// Get customer bookings
GET  /bookings/customer
Query Params: ?status=&limit=&offset=
Response: { bookings: Booking[], total: number }

// Get booking details
GET  /booking/:id
Response: { booking: Booking, service: Service, provider: Provider, slot: Slot, address: Address }

// Cancel booking (customer only)
PUT  /booking/:id/cancel
Body: { reason? }
Response: { booking: Booking, message: "Booking cancelled" }

// Reschedule booking (if pending)
PUT  /booking/:id/reschedule
Body: { newSlotId, newDate }
Response: { booking: Booking, message: "Booking rescheduled" }

// ============ ADDRESSES ============
// Get customer addresses
GET  /address
Response: { addresses: Address[] }

// Create new address
POST /address
Body: { addressType, street, city, state, zipCode }
Response: { address: Address }

// Update address
PUT  /address/:id
Body: { addressType?, street?, city?, state?, zipCode? }
Response: { address: Address }

// Delete address
DELETE /address/:id
Response: { message: "Address deleted successfully" }

// ============ FEEDBACK ============
// Get reviews for a service/business
GET  /feedback/service/:serviceId
Response: { feedback: Feedback[], averageRating: number }

// Submit review for completed booking
POST /feedback
Body: { bookingId, rating, comments }
Response: { feedback: Feedback, message: "Review submitted" }

// ============ NOTIFICATIONS ============
// Get user notifications
GET  /notifications
Query Params: ?unread_only=&limit=&offset=
Response: { notifications: Notification[], unreadCount: number }

// Mark notification as read
PUT  /notifications/:id/read
Response: { notification: Notification }

// Mark all notifications as read
PUT  /notifications/read-all
Response: { message: "All notifications marked as read" }

// ============ SEARCH ============
// Search services
GET  /search/services
Query Params: ?q=&category=&state=&city=&page=&limit=
Response: { services: Service[], total: number, filters: FilterOptions }
```

### 3.3 Controller Specifications

#### Booking Controller (`controllers/booking.controller.js`)
```javascript
class BookingController {
  // Create booking
  static async createBooking(req, res) {
    // 1. Validate: customer = req.user, serviceId, slotId, addressId
    // 2. Check if service exists and is active
    // 3. Check if slot is available (not already booked)
    // 4. Check if address belongs to customer
    // 5. Calculate total price
    // 6. Create booking with status = 'pending'
    // 7. Notify provider
    // 8. Send confirmation to customer
  }

  // Get customer bookings
  static async getCustomerBookings(req, res) {
    // 1. customer_id = req.user.id
    // 2. Fetch bookings with service, provider, slot details
    // 3. Filter by status if provided
    // 4. Pagination
  }

  // Cancel booking
  static async cancelBooking(req, res) {
    // 1. Validate: booking belongs to customer
    // 2. Check if booking can be cancelled (only PENDING)
    // 3. Update status to 'cancelled'
    // 4. Release slot
    // 5. Notify provider
  }

  // Reschedule booking
  static async rescheduleBooking(req, res) {
    // 1. Validate: booking belongs to customer, is PENDING
    // 2. Check new slot availability
    // 3. Update slot_id
    // 4. Notify provider
  }
}
```

#### Service Controller (Customer methods)
```javascript
class ServiceController {
  // Browse services with filters
  static async getServices(req, res) {
    // 1. Extract filters: category_id, state, city, min_price, max_price, search
    // 2. Build query with joins to business_profiles
    // 3. Filter: is_verified=true, is_active=true
    // 4. Pagination
    // 5. Return services with provider info
  }

  // Get service details
  static async getServiceById(req, res) {
    // 1. Fetch service by id
    // 2. Include: provider info, business profile, reviews, available slots
    // 3. Check if service is active and provider is verified
  }
}
```

#### Address Controller
```javascript
class AddressController {
  // Get customer addresses
  static async getAddresses(req, res) {
    // 1. customer_id = req.user.id
    // 2. Fetch all addresses
  }

  // Create address
  static async createAddress(req, res) {
    // 1. Validate input
    // 2. user_id = req.user.id
    // 3. Insert address
  }

  // Update address
  static async updateAddress(req, res) {
    // 1. Validate: address belongs to user
    // 2. Update fields
  }

  // Delete address
  static async deleteAddress(req, res) {
    // 1. Validate: address belongs to user
    // 2. Check if address is used in any active booking
    // 3. Delete or cascade
  }
}
```

### 3.4 Security & Validation

#### Input Validation (Yup Schemas)
```javascript
// Booking validation
const bookingSchema = yup.object({
  serviceId: yup.number().required().positive(),
  slotId: yup.number().required().positive(),
  addressId: yup.number().required().positive(),
  bookingDate: yup.date().min(new Date()).required()
});

// Address validation
const addressSchema = yup.object({
  addressType: yup.string().oneOf(['home', 'work', 'other']).required(),
  street: yup.string().min(5).max(255).required(),
  city: yup.string().min(2).max(100).required(),
  state: yup.string().min(2).max(100).required(),
  zipCode: yup.string().min(4).max(20).required()
});

// Review validation
const reviewSchema = yup.object({
  bookingId: yup.number().required().positive(),
  rating: yup.number().min(1).max(5).required(),
  comments: yup.string().max(2000)
});
```

#### Access Control
```javascript
// Middleware: customerOnly
const customerOnly = (req, res, next) => {
  if (req.user.role_id !== 1) { // CUSTOMER = 1
    return res.status(403).json({ message: "Customer access only" });
  }
  next();
};

// Apply to customer routes
router.get('/bookings/customer', auth, customerOnly, bookingController.getCustomerBookings);
```

---

## 4. System Design Considerations

### 4.1 Scalability & Performance

#### Database Optimization
```sql
-- Indexes for customer queries
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_services_business_profile_id ON services(business_profile_id);
CREATE INDEX idx_slots_business_profile_id ON slots(business_profile_id);
CREATE INDEX idx_address_user_id ON address(user_id);

-- Composite indexes
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_services_category_active ON services(business_profile_id, is_active);
```

#### Caching Strategy
- **Service Listings**: Cache for 5 minutes (Redis)
- **Provider Slots**: Cache for 1 minute (highly dynamic)
- **Categories**: Cache for 1 hour (rarely changes)
- **Customer Profile**: Cache for 10 minutes

```javascript
// Example: Cached service listing
app.get('/services', cache('5 minutes'), async (req, res) => {
  const services = await getServices(filters);
  res.json({ services });
});
```

### 4.2 Slot Availability & Concurrency

#### Problem: Race Conditions in Booking
Two customers book the same slot simultaneously.

#### Solutions:

**Option 1: Database Locks (Recommended)**
```javascript
// Use SELECT FOR UPDATE to lock slot during booking
static async createBooking(req, res) {
  const { slotId } = req.body;

  await db.transaction(async (tx) => {
    // Lock the slot row
    const [slot] = await tx.select()
      .from(slots)
      .where(eq(slots.id, slotId))
      .for('update'); // Lock this row

    // Check if already booked
    const existingBooking = await tx.select()
      .from(bookings)
      .where(eq(bookings.slotId, slotId))
      .and(notInArray(bookings.status, ['cancelled']));

    if (existingBooking.length > 0) {
      throw new Error('Slot already booked');
    }

    // Create booking
    await tx.insert(bookings).values({...});
  });
}
```

**Option 2: Atomic Check-and-Set**
```javascript
// Use INSERT with constraint check
CREATE UNIQUE INDEX idx_unique_slot_booking
ON bookings(slot_id)
WHERE status != 'cancelled';
```

### 4.3 Error Handling Strategy

#### Global Error Handler
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors
    });
  }

  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      message: 'Resource already exists or slot already booked'
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
```

### 4.4 Logging & Monitoring

```javascript
// utils/logger.js
const logger = {
  booking: (data) => {
    console.log(`[BOOKING] ${JSON.stringify(data)}`);
    // Send to monitoring service (Sentry, DataDog, etc.)
  },

  error: (err, context) => {
    console.error(`[ERROR] ${context}:`, err);
    // Alert team for critical errors
  },

  audit: (action, user, details) => {
    console.log(`[AUDIT] ${user.email} - ${action}:`, details);
    // Store in audit_logs table
  }
};
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic customer structure with authentication

#### Frontend
- [x] Create customer layout (`app/(pages)/customer/layout.tsx`)
- [ ] Create customer home page (`app/(pages)/customer/page.tsx`)
- [ ] Add customer routes to middleware
- [ ] Create customer types (`types/customer/index.ts`)
- [ ] Create customer API library (`lib/customer/api.ts`)

#### Backend
- [x] Database schema (already exists)
- [ ] Add customer-only middleware
- [ ] Create booking controller skeleton
- [ ] Create address controller skeleton

**Deliverable**: Customer can login and see dashboard placeholder

---

### Phase 2: Service Browsing (Week 2-3)
**Goal**: Customers can discover and view services

#### Frontend
- [ ] Services listing page (`app/(pages)/customer/services/page.tsx`)
- [ ] Service details page (`app/(pages)/customer/services/[id]/page.tsx`)
- [ ] Service card component
- [ ] Service filters (category, location, price)
- [ ] Search functionality

#### Backend
- [ ] GET /services with filters
- [ ] GET /services/:id with provider info
- [ ] GET /slots/public/:businessId

**Deliverable**: Customers can browse and filter services

---

### Phase 3: Booking Flow (Week 3-4)
**Goal**: End-to-end booking experience

#### Frontend
- [ ] Booking flow page (`app/(pages)/customer/bookings/new/[serviceId]/page.tsx`)
- [ ] Date picker component
- [ ] Slot selection component
- [ ] Address selection modal
- [ ] Booking confirmation page
- [ ] Booking summary/receipt

#### Backend
- [ ] POST /booking with concurrency control
- [ ] Booking status workflow
- [ ] Slot availability check
- [ ] Price calculation
- [ ] Notification triggers

**Deliverable**: Customers can complete bookings

---

### Phase 4: Booking Management (Week 4-5)
**Goal**: Track and manage bookings

#### Frontend
- [ ] My bookings page (`app/(pages)/customer/bookings/page.tsx`)
- [ ] Booking details page
- [ ] Status tracking (pending → confirmed → completed)
- [ ] Cancel booking functionality
- [ ] Reschedule functionality

#### Backend
- [ ] GET /bookings/customer
- [ ] GET /booking/:id
- [ ] PUT /booking/:id/cancel
- [ ] PUT /booking/:id/reschedule

**Deliverable**: Customers can view and manage bookings

---

### Phase 5: Address Management (Week 5)
**Goal**: CRUD operations for addresses

#### Frontend
- [ ] Addresses page (`app/(pages)/customer/addresses/page.tsx`)
- [ ] Add address modal
- [ ] Edit address modal
- [ ] Delete confirmation
- [ ] Set default address

#### Backend
- [ ] GET /address
- [ ] POST /address
- [ ] PUT /address/:id
- [ ] DELETE /address/:id

**Deliverable**: Customers can manage delivery addresses

---

### Phase 6: Reviews & Feedback (Week 6)
**Goal**: Post-service feedback

#### Frontend
- [ ] Reviews page (`app/(pages)/customer/reviews/page.tsx`)
- [ ] Review form (star rating + comments)
- [ ] View past reviews

#### Backend
- [ ] POST /feedback
- [ ] GET /feedback/service/:serviceId

**Deliverable**: Customers can leave reviews

---

### Phase 7: Polish & Enhancements (Week 7-8)
**Goal**: Production-ready features

- [ ] Notifications system
- [ ] Wishlist/favorites
- [ ] Advanced search
- [ ] Real-time slot availability (WebSocket/SSE)
- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Analytics tracking

**Deliverable**: Fully-featured customer dashboard

---

## 6. Database Schema Updates

### Tables to Add (Future Enhancements)

```sql
-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id INTEGER,
  related_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- Wishlist Table
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, service_id)
);

CREATE INDEX idx_wishlist_customer ON wishlist(customer_id);
```

---

## 7. API Endpoints Specification

### Complete API Contract

#### Services API
```typescript
// GET /services
interface GetServicesQuery {
  category_id?: number;
  state?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  page?: number;
  limit?: number;
}

interface GetServicesResponse {
  services: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    estimateDuration: number;
    image: string | null;
    provider: {
      id: number;
      businessName: string;
      state: string;
      city: string;
      rating: number;
      totalReviews: number;
      isVerified: boolean;
    };
  }>;
  total: number;
  page: number;
  limit: number;
}

// GET /services/:id
interface GetServiceResponse {
  service: {
    id: number;
    name: string;
    description: string;
    price: number;
    estimateDuration: number;
    image: string | null;
  };
  provider: {
    id: number;
    businessName: string;
    description: string;
    phone: string;
    state: string;
    city: string;
    rating: number;
    totalReviews: number;
    logo: string | null;
    isVerified: boolean;
  };
  slots: Array<{
    id: number;
    startTime: string; // "HH:mm:ss"
  }>;
  reviews: Array<{
    id: number;
    rating: number;
    comments: string;
    customerName: string;
    createdAt: string;
  }>;
}
```

#### Bookings API
```typescript
// POST /booking
interface CreateBookingRequest {
  serviceId: number;
  slotId: number;
  addressId: number;
  bookingDate?: string; // ISO date string
}

interface CreateBookingResponse {
  booking: {
    id: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    totalPrice: number;
    bookingDate: string;
    service: { name: string; price: number };
    provider: { businessName: string; phone: string };
    slot: { startTime: string };
    address: { street: string; city: string; state: string };
  };
  message: string;
}

// GET /bookings/customer
interface GetCustomerBookingsQuery {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  limit?: number;
  offset?: number;
}

interface GetCustomerBookingsResponse {
  bookings: Array<{
    id: number;
    status: string;
    totalPrice: number;
    bookingDate: string;
    service: { id: number; name: string; price: number; image: string | null };
    provider: { id: number; businessName: string; phone: string; rating: number };
    slot: { startTime: string };
    address: { street: string; city: string; state: string };
    canCancel: boolean;
    canReschedule: boolean;
  }>;
  total: number;
}

// PUT /booking/:id/cancel
interface CancelBookingResponse {
  booking: Booking;
  message: string;
}

// PUT /booking/:id/reschedule
interface RescheduleBookingRequest {
  newSlotId: number;
  newDate?: string;
}

interface RescheduleBookingResponse {
  booking: Booking;
  message: string;
}
```

#### Addresses API
```typescript
// GET /address
interface GetAddressesResponse {
  addresses: Array<{
    id: number;
    addressType: 'home' | 'work' | 'billing' | 'shipping' | 'other';
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
}

// POST /address
interface CreateAddressRequest {
  addressType: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CreateAddressResponse {
  address: Address;
  message: string;
}
```

---

## 8. Frontend Folder Structure

```
hsm-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (pages)/
│   │   ├── customer/
│   │   │   ├── layout.tsx              # Customer layout (header only)
│   │   │   ├── page.tsx                # Customer dashboard/home
│   │   │   ├── services/
│   │   │   │   ├── page.tsx            # Browse services
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Service details
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx            # My bookings
│   │   │   │   ├── new/
│   │   │   │   │   └── [serviceId]/
│   │   │   │   │       └── page.tsx    # Book a service
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Booking details
│   │   │   ├── addresses/
│   │   │   │   ├── page.tsx            # Manage addresses
│   │   │   │   └── new/
│   │   │   │       └── page.tsx        # Add address
│   │   │   ├── reviews/
│   │   │   │   └── page.tsx            # My reviews
│   │   │   └── profile/
│   │   │       └── page.tsx            # Account settings
│   │   ├── provider/
│   │   └── admin/
├── components/
│   ├── customer/
│   │   ├── CustomerHeader.tsx          # Customer navigation header
│   │   ├── ServiceCard.tsx             # Service card component
│   │   ├── ServiceFilters.tsx          # Filter sidebar/modal
│   │   ├── BookingFlow/
│   │   │   ├── ServiceDetails.tsx      # Service info in booking
│   │   │   ├── DateSelector.tsx        # Pick booking date
│   │   │   ├── SlotSelector.tsx        # Pick time slot
│   │   │   ├── AddressSelector.tsx     # Pick address
│   │   │   └── BookingSummary.tsx      # Review before confirm
│   │   ├── BookingCard.tsx             # Booking card in list
│   │   ├── BookingDetails.tsx          # Detailed booking view
│   │   ├── AddressCard.tsx             # Address card
│   │   ├── AddressForm.tsx             # Add/edit address
│   │   ├── ReviewForm.tsx              # Star rating + comments
│   │   └── index.ts
│   └── shared/
│       └── NotificationBadge.tsx
├── lib/
│   ├── customer/
│   │   ├── api.ts                      # Customer API methods
│   │   ├── bookings.ts                 # Booking utilities
│   │   └── types.ts                    # Customer-specific types
│   └── auth-utils.ts
└── types/
    ├── customer/
    │   └── index.ts                    # Customer types
    └── auth.ts
```

---

## 9. Recommended Component Library

### UI Components to Create

```typescript
// ServiceCard.tsx
interface ServiceCardProps {
  service: Service;
  onBook: (serviceId: number) => void;
  onViewDetails: (serviceId: number) => void;
}

// BookingFlow.tsx - Multi-step wizard
interface BookingFlowProps {
  serviceId: number;
  onComplete: (booking: Booking) => void;
}

// SlotSelector.tsx - Time slot picker
interface SlotSelectorProps {
  businessId: number;
  date: string;
  selectedSlot: number | null;
  onSelect: (slotId: number) => void;
}

// AddressModal.tsx - Address selection/creation
interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
}

// BookingTimeline.tsx - Visual status tracker
interface BookingTimelineProps {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}
```

---

## 10. Best Practices & Production Considerations

### 10.1 Performance
- **Lazy Loading**: Load service images lazily
- **Pagination**: Limit service listings to 20 per page
- **Debouncing**: Debounce search inputs (300ms)
- **Image Optimization**: Use Next.js Image component with WebP
- **Code Splitting**: Separate routes for faster initial load

### 10.2 Security
- **Input Sanitization**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries (Drizzle ORM)
- **XSS Prevention**: Escape user-generated content
- **CSRF Protection**: Use CSRF tokens for state-changing operations
- **Rate Limiting**: Limit booking creation attempts

### 10.3 User Experience
- **Loading States**: Show skeletons/shimmers during fetch
- **Empty States**: Friendly messages when no data
- **Error Boundaries**: Catch React errors gracefully
- **Progressive Enhancement**: Core features work without JS
- **Mobile Optimization**: Touch-friendly buttons, readable text

### 10.4 Testing Strategy
```javascript
// Unit tests for utilities
// Integration tests for API calls
// E2E tests for critical flows (booking, cancellation)
// Visual regression tests for UI components
```

---

## 11. Success Metrics

### Key Performance Indicators (KPIs)
- **Booking Conversion Rate**: % of service views → bookings
- **Booking Completion Rate**: % of bookings → completed
- **Average Booking Time**: Time from service view to confirmation
- **User Retention**: % of customers who make repeat bookings
- **Review Rate**: % of completed bookings with reviews

### Monitoring
- Track API response times
- Monitor booking creation success/failure rates
- Alert on high error rates (>5%)
- Track user drop-off points in booking flow

---

## 12. Next Steps & Priority

### Immediate (Week 1)
1. Set up customer layout and routing
2. Create customer API library structure
3. Add customer routes to middleware

### Short-term (Week 2-3)
1. Implement service browsing
2. Create booking flow UI
3. Backend booking controller with concurrency control

### Medium-term (Week 4-6)
1. Booking management
2. Address management
3. Reviews and feedback

### Long-term (Week 7+)
1. Notifications
2. Wishlist
3. Advanced features (real-time availability, search)

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building a production-ready Customer Dashboard for the HSM platform. The focus is on:

1. **User Experience**: Simple, intuitive interface without sidebar clutter
2. **Performance**: Optimized queries, caching, and scalability
3. **Reliability**: Proper error handling, concurrency control, and validation
4. **Maintainability**: Clean code structure, proper separation of concerns

The phased approach ensures incremental delivery of value while building a solid foundation for future enhancements.
