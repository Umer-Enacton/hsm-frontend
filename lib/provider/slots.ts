/**
 * Provider Slot/Availability API Functions
 * API calls for slot template management operations
 */

import { api, API_ENDPOINTS } from "@/lib/api";

/**
 * Slot template interface
 * NOTE: Slots are RECURRING start times only, not date-specific bookings
 */
export interface Slot {
  id: number;
  businessProfileId: number;
  startTime: string; // Format: "HH:mm:ss" - only start time now
  createdAt?: string;
  // Computed fields (not in DB)
  bookingCount?: number;
  todayBookingCount?: number;
}

/**
 * Slot statistics interface
 */
export interface SlotStats {
  totalSlots: number;
  activeSlots: number;
  todayBookings: number;
  utilizationRate: number; // Percentage
}

// ============================================================================
// SLOT CRUD API
// ============================================================================

/**
 * Get slot templates for a business
 * Backend: GET /slots/:businessId
 */
export async function getBusinessSlots(businessId: number): Promise<Slot[]> {
  try {
    const response = await api.get<{ slots: Slot[] }>(
      `/slots/${businessId}`
    );
    return response.slots || [];
  } catch (error) {
    console.error("Error fetching slots:", error);
    return [];
  }
}

/**
 * Create a new slot template (start time only)
 * Backend: POST /slots/:businessId
 * Expects: { startTime: "HH:mm:ss" }
 */
export async function createSlot(
  businessId: number,
  slotData: { startTime: string }
): Promise<Slot> {
  const response = await api.post<{ slot: Slot; message: string }>(
    `/slots/${businessId}`,
    slotData
  );
  return response.slot;
}

/**
 * Delete a slot template
 * Backend: DELETE /businesses/:businessId/slots/:slotId
 */
export async function deleteSlot(
  businessId: number,
  slotId: number
): Promise<void> {
  await api.delete(`/businesses/${businessId}/slots/${slotId}`);
}

// ============================================================================
// SLOT STATISTICS
// ============================================================================

/**
 * Get slot statistics for a business
 * NOTE: Backend may not have this endpoint, so we calculate on frontend
 */
export function calculateSlotStats(slots: Slot[], todayBookingsCount: number): SlotStats {
  const totalSlots = slots.length;
  const activeSlots = slots.length; // All slots are "active" in current schema

  // Calculate utilization based on slot count
  // Assuming 16 slots (8 hours × 2 per hour) = 100% for a full business day
  const maxSlots = 16;
  const utilizationRate = totalSlots > 0 ? Math.min(100, Math.round((totalSlots / maxSlots) * 100)) : 0;

  return {
    totalSlots,
    activeSlots,
    todayBookings: todayBookingsCount,
    utilizationRate,
  };
}

/**
 * Format time from "HH:mm:ss" to "HH:mm" for display
 */
export function formatSlotTime(timeStr: string): string {
  return timeStr.substring(0, 5); // Returns "HH:mm"
}

/**
 * Format time range for display (with optional duration)
 * Example: formatTimeWithDuration("09:00:00", 60) => "09:00 - 10:00"
 */
export function formatTimeWithDuration(startTime: string, durationMinutes?: number): string {
  const start = formatSlotTime(startTime);
  if (!durationMinutes) return start;

  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const end = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

  return `${start} - ${end}`;
}
