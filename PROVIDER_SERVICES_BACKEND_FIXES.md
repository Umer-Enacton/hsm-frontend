# Provider Services Backend Integration - Fixed ✅

## Issue Found

The frontend was trying to call `POST /services` but the backend route is `POST /services/:businessId`.

## Changes Made

### 1. Frontend API Functions Fixed
**File:** `lib/provider/services.ts`

**Updated `createService` function:**
```typescript
// Before: POST /services
// After: POST /services/:businessId

export async function createService(
  businessId: number,
  serviceData: Partial<Service>
): Promise<Service> {
  const response = await api.post<{ service: Service }>(
    `/services/${businessId}`,  // Fixed: Added businessId to URL
    {
      name: serviceData.name,
      description: serviceData.description,
      price: serviceData.price,
      duration: serviceData.duration,
      image: serviceData.image,
    }
  );
  return response.service;
}
```

**Updated `toggleServiceStatus` function:**
```typescript
// Backend doesn't have a dedicated toggle endpoint
// So we use the PUT /services/:serviceId with isActive field

export async function toggleServiceStatus(
  serviceId: number,
  isActive: boolean
): Promise<Service> {
  const response = await api.put<{ service: Service }>(
    `/services/${serviceId}`,
    { isActive }  // Send isActive in body
  );
  return response.service;
}
```

### 2. Backend Controller Updated
**File:** `home-service-management-backend/controllers/service.controller.js`

**Added `isActive` support in `updateService`:**
```javascript
const updateService = async (req, res) => {
  // ... existing code ...

  // Build update object dynamically
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (duration !== undefined) updateData.EstimateDuration = duration;
  if (image !== undefined) updateData.image = image;
  if (isActive !== undefined) updateData.isActive = isActive;  // NEW!

  // ... rest of the code ...
};
```

### 3. Backend Validation Updated
**File:** `home-service-management-backend/helper/validation.js`

**Added new `serviceUpdateSchema` for optional fields:**
```javascript
// Optional schema for service updates (all fields optional)
const serviceUpdateSchema = yup.object({
  name: yup.string().trim().min(3, "Service name must be at least 3 characters"),
  description: yup.string().trim().min(10, "Service description too short"),
  price: yup.number().typeError("Price must be a number").positive("Price must be greater than 0").max(100000, "Price seems unrealistic"),
  duration: yup.number().typeError("Duration must be a number").positive("Duration must be positive").max(1440, "Duration cannot exceed 24 hours"),
  image: yup.string().url("Image must be a valid URL"),
  isActive: yup.boolean(),  // NEW!
});
```

**Exported the new schema:**
```javascript
module.exports = {
  // ... other exports ...
  serviceSchema,
  serviceUpdateSchema,  // NEW!
  // ... other exports ...
};
```

### 4. Backend Routes Updated
**File:** `home-service-management-backend/routes/service.route.js`

**Updated PUT route to use new validation schema:**
```javascript
const { serviceSchema, serviceUpdateSchema } = require("../helper/validation");

// POST uses strict validation (all fields required)
router.post(
  "/services/:businessId",
  authorizeRole(PROVIDER),
  validate(serviceSchema),
  addService
);

// PUT uses lenient validation (all fields optional)
router.put(
  "/services/:serviceId",
  authorizeRole(PROVIDER),
  validate(serviceUpdateSchema),  // Changed from serviceSchema
  updateService
);
```

---

## Backend API Endpoints (Final)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/services` | Get all services | Public |
| GET | `/services/business/:businessId` | Get services by business | Public |
| POST | `/services/:businessId` | Create service | Provider |
| PUT | `/services/:serviceId` | Update service | Provider |
| DELETE | `/services/:serviceId` | Delete service | Provider |

**Note:** No dedicated toggle endpoint - use PUT with `{ isActive: true/false }`

---

## Service Schema Fields

**Database:** `services` table
- `id` (serial, PK)
- `businessProfileId` (integer, FK)
- `name` (varchar 255) ✅ Required
- `description` (varchar 1000)
- `price` (integer) ✅ Required
- `EstimateDuration` (integer) ✅ Required (in minutes)
- `image` (varchar 500) - Cloudinary URL
- `isActive` (boolean) ✅ Default: true
- `createdAt` (timestamp)

---

## How It Works Now

### Creating a Service
```
POST /services/123
Body: {
  "name": "Basic Plumbing",
  "description": "Complete plumbing check",
  "price": 500,
  "duration": 60,
  "image": "https://cloudinary.com/..."
}
```

### Updating a Service
```
PUT /services/456
Body: {
  "name": "Advanced Plumbing",  // Optional
  "price": 750,                 // Optional
  "isActive": false             // Optional - toggle status
}
```

### Toggling Active Status
```
PUT /services/456
Body: {
  "isActive": false
}
```

### Deleting a Service
```
DELETE /services/456
```

---

## Important Notes

1. **Create Service:** Business must be verified (`isVerified: true`)
2. **Update/Delete:** Only the service owner can update/delete
3. **Duration:** Stored in minutes in database
4. **Image:** Optional field, Cloudinary URL
5. **isActive:** Defaults to `true` for new services

---

## Status

✅ **All backend integration issues fixed**

The frontend now correctly communicates with the backend for all service CRUD operations including:
- Create service with proper URL
- Update service with optional fields
- Toggle active/inactive status
- Delete service

Ready to test! 🚀
