/**
 * Provider Service API Functions
 * API calls for service management operations
 */

import { api, API_BASE_URL } from "@/lib/api";
import type { Service } from "@/types/provider";

/**
 * Service statistics interface
 */
export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
}

// ============================================================================
// SERVICE CRUD API
// ============================================================================

/**
 * Get all services for a business
 */
export async function getBusinessServices(businessId: number): Promise<Service[]> {
  try {
    const response = await api.get<{ services: Service[] }>(
      `/services/business/${businessId}`
    );
    return response.services || [];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

/**
 * Get service by ID
 */
export async function getServiceById(serviceId: number): Promise<Service | null> {
  try {
    const response = await api.get<{ service: Service }>(
      `/services/${serviceId}`
    );
    return response.service;
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

/**
 * Create a new service
 * Backend endpoint: POST /services/:businessId
 */
export async function createService(
  businessId: number,
  serviceData: Partial<Service>
): Promise<Service> {
  const response = await api.post<{ service: Service }>(
    `/services/${businessId}`,
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

/**
 * Update a service
 * Backend endpoint: PUT /services/:serviceId
 */
export async function updateService(
  serviceId: number,
  serviceData: Partial<Service>
): Promise<Service> {
  const response = await api.put<{ service: Service }>(
    `/services/${serviceId}`,
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

/**
 * Delete a service
 * Backend endpoint: DELETE /services/:serviceId
 */
export async function deleteService(serviceId: number): Promise<void> {
  await api.delete(`/services/${serviceId}`);
}

/**
 * Toggle service active status
 * Note: Backend doesn't have a dedicated toggle endpoint, so we use updateService
 * We'll need to update the backend to support isActive field in updates
 */
export async function toggleServiceStatus(
  serviceId: number,
  isActive: boolean
): Promise<Service> {
  const response = await api.put<{ service: Service }>(
    `/services/${serviceId}`,
    { isActive }
  );
  return response.service;
}

// ============================================================================
// SERVICE IMAGE UPLOAD
// ============================================================================

/**
 * Upload service image via backend
 */
export async function uploadServiceImage(file: File): Promise<{ url: string }> {
  console.log("Starting service image upload for file:", file.name, file.size, file.type);

  const formData = new FormData();
  formData.append("image", file);

  const uploadUrl = `${API_BASE_URL}/service-image`;
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
    console.error("Service image upload failed:", response.status, errorText);
    throw new Error(errorText || "Failed to upload service image");
  }

  const data = await response.json();
  console.log("Upload response data:", data);

  if (data.success && data.data) {
    console.log("Service image uploaded successfully:", data.data.url);
    return { url: data.data.url };
  }

  throw new Error(data.message || "Failed to upload service image");
}

// ============================================================================
// SERVICE STATISTICS
// ============================================================================

/**
 * Get service statistics for a business
 */
export async function getServiceStats(businessId: number): Promise<ServiceStats> {
  try {
    const response = await api.get<ServiceStats>(
      `/services/business/${businessId}/stats`
    );
    return response;
  } catch (error) {
    console.error("Error fetching service stats:", error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      averagePrice: 0,
    };
  }
}

/**
 * Calculate statistics from services list (fallback if API endpoint doesn't exist)
 */
export function calculateServiceStats(services: Service[]): ServiceStats {
  const activeServices = services.filter((s) => s.isActive);
  const inactiveServices = services.filter((s) => !s.isActive);
  const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
  const averagePrice = services.length > 0 ? totalPrice / services.length : 0;

  return {
    total: services.length,
    active: activeServices.length,
    inactive: inactiveServices.length,
    averagePrice: Math.round(averagePrice),
  };
}
