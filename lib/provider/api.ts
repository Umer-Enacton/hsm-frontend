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
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/logo`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {}, // Don't set Content-Type, let browser do it for FormData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Failed to upload logo");
  }

  const data = await response.json();
  if (data.success && data.data) {
    console.log("Logo uploaded via backend:", data.data.url);
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
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/cover-image`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {}, // Don't set Content-Type, let browser do it for FormData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Failed to upload cover image");
  }

  const data = await response.json();
  if (data.success && data.data) {
    console.log("Cover image uploaded via backend:", data.data.url);
    return { url: data.data.url };
  }

  throw new Error(data.message || "Failed to upload cover image");
}

// ============================================================================
// WORKING HOURS API
// ============================================================================

/**
 * Get working hours for a business
 */
export async function getWorkingHours(
  businessId: number
): Promise<WorkingHours[]> {
  try {
    const response = await api.get<{ working_hours: WorkingHours[] }>(
      `/businesses/${businessId}/working-hours`
    );
    return response.working_hours || [];
  } catch (error) {
    console.error("Error fetching working hours:", error);
    return [];
  }
}

/**
 * Save working hours for a business
 */
export async function saveWorkingHours(
  businessId: number,
  workingHours: WorkingHours[]
): Promise<WorkingHours[]> {
  const response = await api.post<{ working_hours: WorkingHours[] }>(
    `/businesses/${businessId}/working-hours`,
    { working_hours: workingHours }
  );
  return response.working_hours;
}

// ============================================================================
// BREAK TIMES API
// ============================================================================

/**
 * Get break times for a business
 */
export async function getBreakTimes(
  businessId: number
): Promise<BreakTime[]> {
  try {
    const response = await api.get<{ break_times: BreakTime[] }>(
      `/businesses/${businessId}/break-times`
    );
    return response.break_times || [];
  } catch (error) {
    console.error("Error fetching break times:", error);
    return [];
  }
}

/**
 * Save break times for a business
 */
export async function saveBreakTimes(
  businessId: number,
  breakTimes: BreakTime[]
): Promise<BreakTime[]> {
  const response = await api.post<{ break_times: BreakTime[] }>(
    `/businesses/${businessId}/break-times`,
    { break_times: breakTimes }
  );
  return response.break_times;
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
 * Expects: { startTime, endTime } (times should include date)
 */
export async function createSlot(
  businessId: number,
  slot: { startTime: string; endTime: string }
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

    if (onboardingData.businessProfile.logo) {
      console.log("Uploading logo...");
      try {
        const logoResult = await uploadBusinessLogo(onboardingData.businessProfile.logo);
        logoUrl = logoResult.url;
        console.log("Logo uploaded:", logoUrl);
      } catch (error) {
        console.error("Failed to upload logo:", error);
        // Continue without logo
      }
    }

    if (onboardingData.businessProfile.coverImage) {
      console.log("Uploading cover image...");
      try {
        const coverResult = await uploadBusinessCoverImage(onboardingData.businessProfile.coverImage);
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
      name: onboardingData.businessProfile.name,
      description: onboardingData.businessProfile.description,
      categoryId: onboardingData.businessProfile.categoryId,
      logo: logoUrl,
      coverImage: coverImageUrl,
      website: onboardingData.businessProfile.website,
      // Note: phone is pulled from user profile by backend
      // Note: email is pulled from user profile by backend
      // Note: address is not in the current schema, skipping
    };

    const business = await createBusiness(businessData);
    console.log("Business created:", business);

    // Step 3: Save working hours (if endpoint exists, otherwise skip with warning)
    const openWorkingHours = onboardingData.workingHours.filter(wh => wh.isOpen);
    if (openWorkingHours.length > 0) {
      console.log("Working hours configured (backend endpoint pending):", openWorkingHours);
      // TODO: Uncomment when backend endpoint is ready
      // await saveWorkingHours(business.id, openWorkingHours);
    }

    // Step 4: Save break times (if endpoint exists, otherwise skip with warning)
    if (onboardingData.breakTimes.length > 0) {
      console.log("Break times configured (backend endpoint pending):", onboardingData.breakTimes);
      // TODO: Uncomment when backend endpoint is ready
      // await saveBreakTimes(business.id, onboardingData.breakTimes);
    }

    // Step 5: Create availability slots
    const slots = onboardingData.availabilitySlots.slots;
    if (slots.length > 0) {
      console.log(`Creating ${slots.length} availability slots...`);

      let createdCount = 0;
      let failedCount = 0;

      // Create slots one by one
      // NOTE: Backend slots only store TIME, not date
      // We need to group by time and create unique time slots
      const uniqueTimeSlots = new Map<string, { startTime: string; endTime: string }>();

      for (const slot of slots) {
        try {
          // Format: "09:00" -> "09:00:00"
          const startTime = slot.startTime + ":00";
          const endTime = slot.endTime + ":00";

          const key = `${startTime}-${endTime}`;

          // Only create unique time slots
          if (!uniqueTimeSlots.has(key)) {
            uniqueTimeSlots.set(key, { startTime, endTime });

            const slotData = {
              startTime,
              endTime,
            };

            await createSlot(business.id, slotData);
            createdCount++;
          }
        } catch (slotError) {
          console.error("Failed to create slot:", slotError);
          failedCount++;
        }
      }

      console.log(`Unique time slots created: ${createdCount}, failed: ${failedCount}`);
    }

    console.log("Onboarding completed successfully!");
    return { business, success: true };
  } catch (error: any) {
    console.error("Error completing onboarding:", error);
    throw new Error(error.message || "Failed to complete onboarding. Please try again.");
  }
}
