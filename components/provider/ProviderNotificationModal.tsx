"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Ban, CheckCircle, CreditCard } from "lucide-react";
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
  const router = useRouter();

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
    const businessHasPaymentDetails = statusData.business?.hasPaymentDetails;
    const businessIsVerified = statusData.business?.isVerified;
    const businessExists = statusData.business;

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

    // Check for pending verification (only if not blocked)
    if (businessExists && !businessIsBlocked && !businessIsVerified) {
      const key = `verification_${statusData.business.id}`;
      if (!dismissed.has(key)) {
        newNotifications.push({
          type: "pending_verification",
          businessId: statusData.business.id,
          businessName: statusData.business.businessName || "Your business",
        });
      }
    }

    // Check for missing payment details (only if business exists and not blocked)
    if (
      statusData.business &&
      !businessIsBlocked &&
      !businessHasPaymentDetails
    ) {
      const key = `payment_details_${statusData.business.id}`;
      if (!dismissed.has(key)) {
        newNotifications.push({
          type: "missing_payment_details",
          businessId: statusData.business.id,
          businessName: statusData.business.businessName || "Your business",
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

    let key: string;
    switch (notification.type) {
      case "blocked_business":
        key = `blocked_${notification.businessId}`;
        break;
      case "unblocked_business":
        key = `unblocked_${notification.businessId}`;
        break;
      case "pending_verification":
        key = `verification_${notification.businessId}`;
        break;
      case "missing_payment_details":
        key = `payment_details_${notification.businessId}`;
        break;
      case "deactivated_service":
      case "reactivated_service":
        key = `service_${notification.serviceId}`;
        break;
      default:
        key = `unknown_${indexToDismiss}`;
    }

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
    const isMissingPaymentDetails = notification.type === "missing_payment_details";
    const isPendingVerification = notification.type === "pending_verification";

    const title = isBlockedBusiness
      ? "Business Blocked"
      : isUnblockedBusiness
        ? "Business Unblocked"
        : isDeactivatedService
          ? "Service Deactivated"
          : isReactivatedService
            ? "Service Reactivated"
            : isMissingPaymentDetails
              ? "Payment Details Required"
              : "Pending Verification";

    const message = isBlockedBusiness
      ? `Your business "${notification.businessName}" has been blocked by admin.`
      : isUnblockedBusiness
        ? `Your business "${notification.businessName}" has been unblocked.`
        : isDeactivatedService
          ? `Service "${notification.serviceName}" has been deactivated by admin.`
          : isReactivatedService
            ? `Service "${notification.serviceName}" has been reactivated by admin.`
            : isMissingPaymentDetails
              ? "Add payment details to receive bookings and earnings."
              : `Your business "${notification.businessName}" is pending verification by admin.`;

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
        : isPendingVerification
          ? {
              cardBorder:
                "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50",
              iconColor: "text-blue-600 dark:text-blue-400",
              titleColor: "text-blue-800 dark:text-blue-300",
              messageColor: "text-blue-700 dark:text-blue-300",
              reasonBg: "bg-blue-100 dark:bg-blue-900/30",
              reasonTitle: "text-blue-900 dark:text-blue-200",
              reasonText: "text-blue-800 dark:text-blue-400",
              icon: AlertTriangle,
            }
        : isMissingPaymentDetails
          ? {
              cardBorder:
                "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50",
              iconColor: "text-orange-600 dark:text-orange-400",
              titleColor: "text-orange-800 dark:text-orange-300",
              messageColor: "text-orange-700 dark:text-orange-300",
              reasonBg: "bg-orange-100 dark:bg-orange-900/30",
              reasonTitle: "text-orange-900 dark:text-orange-200",
              reasonText: "text-orange-800 dark:text-orange-400",
              icon: CreditCard,
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

              {/* Show action button for missing payment details */}
              {isMissingPaymentDetails && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => router.push("/provider/payments")}
                    className={`w-full ${colorScheme.iconColor} bg-current hover:opacity-90`}
                  >
                    Add Payment Details
                  </Button>
                </div>
              )}

              {/* Show info for pending verification */}
              {isPendingVerification && (
                <div className={`${colorScheme.reasonBg} rounded-md p-2`}>
                  <p className={`text-xs ${colorScheme.reasonText}`}>
                    You will be notified once verified. This usually takes 1-2 business days.
                  </p>
                </div>
              )}

              {/* Show reason for blocked/deactivated notifications */}
              {(isBlockedBusiness || isDeactivatedService) && (
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
              )}
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
