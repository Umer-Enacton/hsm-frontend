/**
 * Provider API Functions
 * API calls for provider-related operations
 */

import { api, API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import type {
  Business,
  WorkingHours,
  BreakTime,
  AvailabilitySlot,
  OnboardingData,
  Service,
  ProviderBooking,
  Review,
  ProviderDashboardStats,
} from "@/types/provider";

// ============================================================================
// BUSINESS PROFILE API
// ============================================================================

/**
 * Get business profile for current provider
 */
export async function getProviderBusiness(
  userId: number
): Promise<Business | null> {
  try {
    const response = await api.get<{ business: Business }>(
      API_ENDPOINTS.BUSINESS_BY_PROVIDER(userId)
    );
    return response.business;
  } catch (error) {
    console.error("Error fetching business:", error);
    return null;
  }
}

/**
 * Create new business profile
 */
export async function createBusiness(
  businessData: Partial<Business>
): Promise<Business> {
  const response = await api.post<{ business: Business }>(
    API_ENDPOINTS.BUSINESSES,
    businessData
  );
  return response.business;
}

/**
 * Update business profile
 */
export async function updateBusiness(
  businessId: number,
  businessData: Partial<Business>
): Promise<Business> {
  const response = await api.put<{ business: Business }>(
    API_ENDPOINTS.UPDATE_BUSINESS(businessId),
    businessData
  );
  return response.business;
}

/**
 * Upload business logo via backend
 */
export async function uploadBusinessLogo(file: File): Promise<{ url: string }> {
  console.log("Starting logo upload for file:", file.name, file.size, file.type);

  const formData = new FormData();
  formData.append("logo", file);

  // Backend upload routes are mounted at root level: /logo and /cover-image
  const uploadUrl = `${API_BASE_URL}/logo`;
  console.log("Sending request to:", uploadUrl);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: "cors",
  });

  console.log("Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Logo upload failed:", response.status, errorText);
    throw new Error(errorText || "Failed to upload logo");
  }

  const data = await response.json();
  console.log("Upload response data:", data);

  if (data.success && data.data) {
    console.log("Logo uploaded successfully:", data.data.url);
    return { url: data.data.url };
  }

  throw new Error(data.message || "Failed to upload logo");
}

/**
 * Upload business cover image via backend
 */
export async function uploadBusinessCoverImage(
  file: File
): Promise<{ url: string }> {
  console.log("Starting cover image upload for file:", file.name, file.size, file.type);

  const formData = new FormData();
  formData.append("coverImage", file);

  // Backend upload routes are mounted at root level: /logo and /cover-image
  const uploadUrl = `${API_BASE_URL}/cover-image`;
  console.log("Sending request to:", uploadUrl);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: "cors",
  });

  console.log("Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cover image upload failed:", response.status, errorText);
    throw new Error(errorText || "Failed to upload cover image");
  }

  const data = await response.json();
  console.log("Upload response data:", data);

  if (data.success && data.data) {
    console.log("Cover image uploaded successfully:", data.data.url);
    return { url: data.data.url };
  }

  throw new Error(data.message || "Failed to upload cover image");
}

// ============================================================================
// AVAILABILITY SLOTS API
// ============================================================================

/**
 * Get availability slots for a business
 */
export async function getAvailabilitySlots(
  businessId: number,
  startDate?: string,
  endDate?: string
): Promise<AvailabilitySlot[]> {
  try {
    let endpoint = `/businesses/${businessId}/slots`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const response = await api.get<{ slots: AvailabilitySlot[] }>(endpoint);
    return response.slots || [];
  } catch (error) {
    console.error("Error fetching availability slots:", error);
    return [];
  }
}

/**
 * Create availability slot
 * Backend endpoint: POST /slots/:businessId
 * Expects: { startTime } (only start time now, "HH:mm:ss" format)
 */
export async function createSlot(
  businessId: number,
  slot: { startTime: string }
): Promise<any> {
  const response = await api.post<{ slot: any; message: string }>(
    `/slots/${businessId}`,
    slot
  );
  return response.slot;
}

/**
 * Create multiple availability slots
 */
export async function createSlots(
  businessId: number,
  slots: Omit<AvailabilitySlot, "id" | "businessId">[]
): Promise<AvailabilitySlot[]> {
  const response = await api.post<{ slots: AvailabilitySlot[] }>(
    `/businesses/${businessId}/slots/batch`,
    { slots }
  );
  return response.slots;
}

/**
 * Delete availability slot
 */
export async function deleteSlot(
  businessId: number,
  slotId: number
): Promise<void> {
  await api.delete(
    API_ENDPOINTS.DELETE_SLOT(businessId, slotId)
  );
}

/**
 * Auto-generate slots based on configuration
 */
export async function autoGenerateSlots(
  businessId: number,
  config: {
    startDate: string;
    endDate: string;
    slotDuration: number;
    startTime: string;
    endTime: string;
    excludeDays: string[];
  }
): Promise<AvailabilitySlot[]> {
  const response = await api.post<{ slots: AvailabilitySlot[] }>(
    `/businesses/${businessId}/slots/auto-generate`,
    config
  );
  return response.slots;
}

// ============================================================================
// SERVICES API
// ============================================================================

/**
 * Get services for a business
 */
export async function getBusinessServices(
  businessId: number
): Promise<Service[]> {
  try {
    const response = await api.get<{ services: Service[] }>(
      API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId)
    );
    return response.services || [];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

/**
 * Create a new service
 */
export async function createService(
  businessId: number,
  serviceData: Partial<Service>
): Promise<Service> {
  const response = await api.post<{ service: Service }>(
    API_ENDPOINTS.SERVICES.replace(":businessId", businessId.toString()),
    serviceData
  );
  return response.service;
}

// ============================================================================
// BOOKINGS API
// ============================================================================

/**
 * Get bookings for provider
 */
export async function getProviderBookings(
  status?: string
): Promise<ProviderBooking[]> {
  try {
    let endpoint = API_ENDPOINTS.PROVIDER_BOOKINGS;
    if (status) {
      endpoint += `?status=${status}`;
    }
    const response = await api.get<{ bookings: ProviderBooking[] }>(endpoint);
    return response.bookings || [];
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}

/**
 * Accept booking
 */
export async function acceptBooking(bookingId: number): Promise<ProviderBooking> {
  const response = await api.put<{ booking: ProviderBooking }>(
    API_ENDPOINTS.ACCEPT_BOOKING(bookingId),
    {}
  );
  return response.booking;
}

/**
 * Reject booking
 */
export async function rejectBooking(bookingId: number): Promise<ProviderBooking> {
  const response = await api.put<{ booking: ProviderBooking }>(
    API_ENDPOINTS.REJECT_BOOKING(bookingId),
    {}
  );
  return response.booking;
}

/**
 * Complete booking
 */
export async function completeBooking(bookingId: number): Promise<ProviderBooking> {
  const response = await api.put<{ booking: ProviderBooking }>(
    API_ENDPOINTS.COMPLETE_BOOKING(bookingId),
    {}
  );
  return response.booking;
}

// ============================================================================
// REVIEWS API
// ============================================================================

/**
 * Get reviews for a business
 */
export async function getBusinessReviews(
  businessId: number
): Promise<Review[]> {
  try {
    const response = await api.get<{ feedback: Review[] }>(
      API_ENDPOINTS.FEEDBACK_BUSINESS(businessId)
    );
    return response.feedback || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// ============================================================================
// DASHBOARD STATS API
// ============================================================================

/**
 * Get dashboard statistics for provider
 */
export async function getProviderDashboardStats(): Promise<ProviderDashboardStats> {
  try {
    const response = await api.get<ProviderDashboardStats>(
      "/provider/dashboard/stats"
    );
    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      totalEarnings: 0,
      averageRating: 0,
      activeServices: 0,
    };
  }
}

// ============================================================================
// ONBOARDING API
// ============================================================================

/**
 * Complete onboarding - saves all stages data using existing endpoints
 */
export async function completeOnboarding(
  onboardingData: OnboardingData
): Promise<{ business: Business; success: boolean }> {
  try {
    console.log("Starting onboarding completion...", onboardingData);

    // Step 1: Upload images if provided
    let logoUrl: string | undefined;
    let coverImageUrl: string | undefined;

    if (onboardingData.businessDetails.logo) {
      console.log("Uploading logo...");
      try {
        const logoResult = await uploadBusinessLogo(onboardingData.businessDetails.logo);
        logoUrl = logoResult.url;
        console.log("Logo uploaded:", logoUrl);
      } catch (error) {
        console.error("Failed to upload logo:", error);
        // Continue without logo
      }
    }

    if (onboardingData.businessDetails.coverImage) {
      console.log("Uploading cover image...");
      try {
        const coverResult = await uploadBusinessCoverImage(onboardingData.businessDetails.coverImage);
        coverImageUrl = coverResult.url;
        console.log("Cover uploaded:", coverImageUrl);
      } catch (error) {
        console.error("Failed to upload cover:", error);
        // Continue without cover
      }
    }

    // Step 2: Create business profile
    console.log("Creating business profile...");
    const businessData = {
      name: onboardingData.businessDetails.name,
      description: onboardingData.businessDetails.description,
      categoryId: onboardingData.businessDetails.categoryId,
      phone: onboardingData.businessDetails.businessPhone, // Send business phone
      state: onboardingData.businessDetails.state, // State/Province
      city: onboardingData.businessDetails.city, // City
      logo: logoUrl,
      coverImage: coverImageUrl,
      website: onboardingData.businessDetails.website,
    };

    console.log("Sending business data:", businessData);
    const business = await createBusiness(businessData);
    console.log("Business created:", business);

    // Step 3: Generate slots from working hours (frontend-only data)
    // Get slot interval (default 30 minutes)
    const slotInterval = onboardingData.slotInterval || 30;
    console.log("Requesting slot generation with interval:", slotInterval, "minutes");

    // Call backend to generate slots from working hours and break time (provided in request body)
    try {
      await api.post<{ message: string }>(
        `/slots/${business.id}/generate`,
        {
          workingHours: onboardingData.workingHours,
          breakTime: onboardingData.breakTime,
          slotInterval
        }
      );
      console.log("Slots generated successfully by backend");
    } catch (error) {
      console.error("Failed to auto-generate slots:", error);
      // Continue anyway - business was created
    }

    console.log("Onboarding completed successfully!");
    return { business, success: true };
  } catch (error: any) {
    console.error("Error completing onboarding:", error);
    throw new Error(error.message || "Failed to complete onboarding. Please try again.");
  }
}
