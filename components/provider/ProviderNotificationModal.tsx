"use client";

import { useEffect } from "react";
import { X, AlertTriangle, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  providerNotificationsAtom,
  notificationDismissedAtom,
} from "@/store/providerAtoms";
import { useAtom } from "jotai";
import { api, API_ENDPOINTS } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function ProviderNotificationModal() {
  const [notifications, setNotifications] = useAtom(providerNotificationsAtom);
  const [dismissed, setDismissed] = useAtom(notificationDismissedAtom);

  // Query to check provider status - auto-refreshes every 30 seconds
  const { data: statusData } = useQuery({
    queryKey: ["provider", "status"],
    queryFn: () => api.get<any>(API_ENDPOINTS.PROVIDER_STATUS),
    refetchInterval: 30000, // Check every 30 seconds (faster for better UX)
    retry: 2, // Retry failed requests twice
  });

  useEffect(() => {
    if (!statusData) return;

    const newNotifications: any[] = [];

    // Track current service IDs and business state
    const currentServiceIds = new Set(
      (statusData.deactivatedServices || []).map((s: any) => s.id),
    );
    const businessIsBlocked = statusData.business?.isBlocked;

    // Check for blocked business
    if (businessIsBlocked) {
      const key = `blocked_${statusData.business.id}`;
      const wasPreviouslyNotified = dismissed.has(key);

      // Only add if not already dismissed this session
      // But always check if it's a NEW block (wasn't blocked before)
      if (!wasPreviouslyNotified) {
        newNotifications.push({
          type: "blocked_business",
          businessId: statusData.business.id,
          businessName: statusData.business.businessName || "Your business",
          reason:
            statusData.business.blockedReason ||
            "Violation of platform policies",
          blockedAt: statusData.business.blockedAt,
        });
      }
    }

    // Check for deactivated services (add each one as separate notification)
    if (
      statusData.deactivatedServices &&
      statusData.deactivatedServices.length > 0
    ) {
      statusData.deactivatedServices.forEach((service: any) => {
        const key = `service_${service.id}`;
        if (!dismissed.has(key)) {
          newNotifications.push({
            type: "deactivated_service",
            serviceId: service.id,
            serviceName: service.name,
            reason: service.deactivationReason || "Service removed temporarily",
            deactivatedAt: service.deactivatedAt,
          });
        }
      });
    }

    setNotifications(newNotifications);
  }, [statusData, dismissed]);

  // Handle dismissing a single notification
  const handleDismiss = (indexToDismiss: number) => {
    const notification = notifications[indexToDismiss];
    if (!notification) return;

    const key =
      notification.type === "blocked_business"
        ? `blocked_${notification.businessId}`
        : notification.type === "unblocked_business"
          ? `unblocked_${notification.businessId}`
          : notification.type === "deactivated_service"
            ? `service_${notification.serviceId}`
            : `service_${notification.serviceId}`;

    const newDismissed = new Set(dismissed);
    newDismissed.add(key);
    setDismissed(newDismissed);

    // Remove this notification from the list
    setNotifications((prev) => prev.filter((_, i) => i !== indexToDismiss));
  };

  // Render individual notification card (without positioning - parent handles stacking)
  const renderNotificationCard = (notification: any, index: number) => {
    const isBlockedBusiness = notification.type === "blocked_business";
    const isUnblockedBusiness = notification.type === "unblocked_business";
    const isDeactivatedService = notification.type === "deactivated_service";
    const isReactivatedService = notification.type === "reactivated_service";

    const title = isBlockedBusiness
      ? "Business Blocked"
      : isUnblockedBusiness
        ? "Business Unblocked"
        : isDeactivatedService
          ? "Service Deactivated"
          : "Service Reactivated";

    const message = isBlockedBusiness
      ? `Your business "${notification.businessName}" has been blocked by admin.`
      : isUnblockedBusiness
        ? `Your business "${notification.businessName}" has been unblocked.`
        : isDeactivatedService
          ? `Service "${notification.serviceName}" has been deactivated by admin.`
          : `Service "${notification.serviceName}" has been reactivated by admin.`;

    const reason = notification.reason || "No reason provided";

    // Color scheme based on notification type
    const colorScheme =
      isReactivatedService || isUnblockedBusiness
        ? {
            cardBorder:
              "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50",
            iconColor: "text-green-600 dark:text-green-400",
            titleColor: "text-green-800 dark:text-green-300",
            messageColor: "text-green-700 dark:text-green-300",
            reasonBg: "bg-green-100 dark:bg-green-900/30",
            reasonTitle: "text-green-900 dark:text-green-200",
            reasonText: "text-green-800 dark:text-green-400",
            icon: CheckCircle,
          }
        : {
            cardBorder:
              "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50",
            iconColor: "text-red-600 dark:text-red-400",
            titleColor: "text-red-800 dark:text-red-300",
            messageColor: "text-red-700 dark:text-red-300",
            reasonBg: "bg-red-100 dark:bg-red-900/30",
            reasonTitle: "text-red-900 dark:text-red-200",
            reasonText: "text-red-800 dark:text-red-400",
            icon: isBlockedBusiness ? Ban : AlertTriangle,
          };

    const IconComponent = colorScheme.icon;

    return (
      <Card
        className={`${colorScheme.cardBorder} shadow-xl w-full max-w-xs p-0`}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <IconComponent
                    className={`h-4 w-4 ${colorScheme.iconColor} shrink-0`}
                  />
                  <h4
                    className={`font-semibold ${colorScheme.titleColor} text-sm`}
                  >
                    {title}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-1 shrink-0"
                  onClick={() => handleDismiss(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <p className={`text-xs ${colorScheme.messageColor} mb-1.5`}>
                {message}
              </p>

              <div className={`${colorScheme.reasonBg} rounded-md p-2`}>
                <p
                  className={`text-xs font-medium ${colorScheme.reasonTitle} mb-0.5`}
                >
                  Reason:
                </p>
                <p
                  className={`text-xs ${colorScheme.reasonText} break-words line-clamp-3`}
                >
                  {reason}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (notifications.length === 0) return null;

  // Use flex-col-reverse so first notification appears at bottom
  // and new ones stack above it automatically - works with variable heights!
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 items-end max-w-xs sm:max-w-sm">
      {notifications.map((notification, index) =>
        renderNotificationCard(notification, index),
      )}
    </div>
  );
}
