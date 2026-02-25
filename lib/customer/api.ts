/**
 * Customer API Library
 * API methods for customer operations
 */

import { api, API_ENDPOINTS } from "@/lib/api";
import type {
  CustomerService,
  ServiceDetails,
  CustomerBooking,
  Slot,
  Address,
  Review,
  Notification,
  ServiceFilters,
  PaginatedResponse,
} from "@/types/customer";

// ============================================================================
// SERVICES API
// ============================================================================

/**
 * Browse services with filters
 */
export async function getServices(
  filters?: ServiceFilters
): Promise<PaginatedResponse<CustomerService>> {
  const params = new URLSearchParams();

  if (filters?.categoryId) params.append("category_id", filters.categoryId.toString());
  if (filters?.state) params.append("state", filters.state);
  if (filters?.city) params.append("city", filters.city);
  if (filters?.minPrice) params.append("min_price", filters.minPrice.toString());
  if (filters?.maxPrice) params.append("max_price", filters.maxPrice.toString());
  if (filters?.search) params.append("search", filters.search);

  const queryString = params.toString();
  const endpoint = queryString ? `${API_ENDPOINTS.SERVICES}?${queryString}` : API_ENDPOINTS.SERVICES;

  console.log("📡 Fetching services from:", endpoint);

  const response = await api.get<{ services: CustomerService[]; total: number }>(endpoint);

  console.log("📦 Raw services response:", {
    count: response.services?.length || 0,
    total: response.total,
    firstService: response.services?.[0]
  });

  // Transform services to ensure provider data exists
  const transformedServices = (response.services || []).map((service: any) => {
    // If provider data is missing, provide default values
    if (!service.provider || typeof service.provider !== 'object') {
      console.warn("⚠️ Service missing provider data:", service.id);
      return {
        ...service,
        provider: {
          id: service.businessProfileId || 0,
          businessName: "Provider Business",
          phone: "N/A",
          state: "N/A",
          city: "N/A",
          rating: 0,
          totalReviews: 0,
          isVerified: false,
          logo: null
        },
        estimateDuration: service.estimateDuration || service.EstimateDuration || 30
      };
    }

    // Ensure all required provider fields exist
    return {
      ...service,
      provider: {
        id: service.provider.id || service.businessProfileId || 0,
        businessName: service.provider.businessName || "Unknown Provider",
        phone: service.provider.phone || "N/A",
        state: service.provider.state || "N/A",
        city: service.provider.city || "N/A",
        rating: service.provider.rating || 0,
        totalReviews: service.provider.totalReviews || 0,
        isVerified: service.provider.isVerified || false,
        logo: service.provider.logo || null
      },
      estimateDuration: service.estimateDuration || service.EstimateDuration || 30
    };
  });

  console.log("✅ Transformed services:", transformedServices.length);

  return {
    data: transformedServices,
    total: response.total || 0,
    page: 1,
    limit: 20,
  };
}

/**
 * Get service details
 */
export async function getServiceById(serviceId: number): Promise<ServiceDetails> {
  const endpoint = API_ENDPOINTS.SERVICE_BY_ID(serviceId);
  console.log("📡 Fetching service details from:", endpoint);

  const response = await api.get<any>(endpoint);

  console.log("📦 Raw service details response:", response);

  // Transform to ensure provider data exists
  let transformedService: ServiceDetails;

  if (!response.provider || typeof response.provider !== 'object') {
    console.warn("⚠️ Service details missing provider data, using defaults");
    transformedService = {
      ...response,
      provider: {
        id: response.businessProfileId || 0,
        businessName: "Provider Business",
        phone: "N/A",
        state: "N/A",
        city: "N/A",
        rating: 0,
        totalReviews: 0,
        isVerified: false,
        logo: null
      },
      estimateDuration: response.estimateDuration || response.EstimateDuration || 30,
      slots: response.slots || [],
      reviews: response.reviews || []
    };
  } else {
    transformedService = {
      ...response,
      provider: {
        id: response.provider.id || response.businessProfileId || 0,
        businessName: response.provider.businessName || "Unknown Provider",
        phone: response.provider.phone || "N/A",
        state: response.provider.state || "N/A",
        city: response.provider.city || "N/A",
        rating: response.provider.rating || 0,
        totalReviews: response.provider.totalReviews || 0,
        isVerified: response.provider.isVerified || false,
        logo: response.provider.logo || null
      },
      estimateDuration: response.estimateDuration || response.EstimateDuration || 30,
      slots: response.slots || [],
      reviews: response.reviews || []
    };
  }

  console.log("✅ Transformed service details:", {
    id: transformedService.id,
    name: transformedService.name,
    provider: transformedService.provider.businessName
  });

  return transformedService;
}

/**
 * Get available slots for a business
 */
export async function getAvailableSlots(
  businessId: number,
  date?: string
): Promise<Slot[]> {
  const params = date ? `?date=${date}` : "";
  const response = await api.get<{ slots: Slot[] }>(`${API_ENDPOINTS.SLOTS_PUBLIC(businessId)}${params}`);

  console.log("📡 Slots API response:", response);

  // Extract slots array from response
  if (response && response.slots && Array.isArray(response.slots)) {
    return response.slots;
  }

  // Fallback: if response is directly an array (backward compatibility)
  if (Array.isArray(response)) {
    return response;
  }

  console.warn("⚠️ Unexpected slots response format:", response);
  return [];
}

// ============================================================================
// BOOKINGS API
// ============================================================================

/**
 * Create new booking
 */
export async function createBooking(bookingData: {
  serviceId: number;
  slotId: number;
  addressId: number;
  bookingDate?: string;
}): Promise<{ booking: CustomerBooking; message: string }> {
  console.log("📡 Creating booking with data:", bookingData);
  const response = await api.post<{ booking: CustomerBooking; message: string }>(
    API_ENDPOINTS.ADD_BOOKING,
    bookingData
  );
  console.log("📦 Booking response:", response);
  return response;
}

/**
 * Get customer bookings
 */
export async function getCustomerBookings(params?: {
  status?: BookingStatus;
  limit?: number;
  offset?: number;
}): Promise<{ bookings: CustomerBooking[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.CUSTOMER_BOOKINGS}?${queryString}`
    : API_ENDPOINTS.CUSTOMER_BOOKINGS;

  const response = await api.get<{ bookings: CustomerBooking[]; total: number }>(endpoint);
  return response;
}

/**
 * Get booking details
 */
export async function getBookingById(bookingId: number): Promise<CustomerBooking> {
  const response = await api.get<{ booking: CustomerBooking }>(API_ENDPOINTS.BOOKING_BY_ID(bookingId));
  return response.booking;
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  bookingId: number,
  reason?: string
): Promise<{ booking: CustomerBooking; message: string }> {
  const response = await api.put<{ booking: CustomerBooking; message: string }>(
    `/booking/${bookingId}/cancel`,
    { reason }
  );
  return response;
}

/**
 * Reschedule booking
 */
export async function rescheduleBooking(
  bookingId: number,
  newData: { newSlotId: number; newDate?: string }
): Promise<{ booking: CustomerBooking; message: string }> {
  const response = await api.put<{ booking: CustomerBooking; message: string }>(
    `/booking/${bookingId}/reschedule`,
    newData
  );
  return response;
}

// ============================================================================
// ADDRESSES API
// ============================================================================

/**
 * Get customer addresses
 */
export async function getAddresses(): Promise<Address[]> {
  const response = await api.get<{ addresses: Address[] }>(API_ENDPOINTS.ADDRESSES);
  console.log("📡 getAddresses response:", response);
  return response.addresses || [];
}

/**
 * Create new address
 */
export async function createAddress(addressData: {
  addressType: Address["addressType"];
  street: string;
  city: string;
  state: string;
  zipCode: string;
}): Promise<Address> {
  console.log("📡 Creating address:", addressData);
  const response = await api.post<{ message: string; address: Address }>(API_ENDPOINTS.ADDRESSES, addressData);
  console.log("✅ Address created:", response);
  return response.address;
}

/**
 * Update address
 */
export async function updateAddress(
  addressId: number,
  updates: Partial<Omit<Address, "id" | "userId">>
): Promise<Address> {
  const response = await api.put<Address>(API_ENDPOINTS.ADDRESS_BY_ID(addressId), updates);
  return response;
}

/**
 * Delete address
 */
export async function deleteAddress(addressId: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(API_ENDPOINTS.ADDRESS_BY_ID(addressId));
  return response;
}

// ============================================================================
// FEEDBACK API
// ============================================================================

/**
 * Get reviews for a service
 */
export async function getServiceReviews(serviceId: number): Promise<{
  feedback: Review[];
  averageRating: number;
}> {
  const response = await api.get<{ feedback: Review[]; averageRating: number }>(
    `/feedback/service/${serviceId}`
  );
  return response;
}

/**
 * Submit review for completed booking
 */
export async function submitReview(reviewData: {
  bookingId: number;
  rating: number;
  comments?: string;
}): Promise<Review> {
  const response = await api.post<Review>("/feedback", reviewData);
  return response;
}

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

/**
 * Get user notifications
 */
export async function getNotifications(params?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const queryParams = new URLSearchParams();
  if (params?.unreadOnly) queryParams.append("unread_only", "true");
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/notifications?${queryString}` : "/notifications";

  const response = await api.get<{ notifications: Notification[]; unreadCount: number }>(endpoint);
  return response;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<Notification> {
  const response = await api.put<Notification>(`/notifications/${notificationId}/read`);
  return response;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ message: string }> {
  const response = await api.put<{ message: string }>("/notifications/read-all");
  return response;
}

// ============================================================================
// SEARCH API
// ============================================================================

/**
 * Search services
 */
export async function searchServices(query: {
  q?: string;
  category?: string;
  state?: string;
  city?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<CustomerService>> {
  const params = new URLSearchParams();
  if (query.q) params.append("q", query.q);
  if (query.category) params.append("category", query.category);
  if (query.state) params.append("state", query.state);
  if (query.city) params.append("city", query.city);
  if (query.page) params.append("page", query.page.toString());
  if (query.limit) params.append("limit", query.limit.toString());

  const queryString = params.toString();
  const endpoint = `/search/services${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<{ services: CustomerService[]; total: number }>(endpoint);

  return {
    data: response.services,
    total: response.total,
    page: query.page || 1,
    limit: query.limit || 20,
  };
}

// ============================================================================
// ENUM EXPORT
// ============================================================================

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
