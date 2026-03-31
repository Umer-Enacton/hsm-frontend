"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { onMessageListener } from "@/lib/firebase";
import { QUERY_KEYS } from "./query-keys";

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Removed local notificationKeys factory as we use QUERY_KEYS now

/**
 * Fetch notifications with TanStack Query
 */
export function useNotifications(options?: {
  limit?: number;
  offset?: number;
}) {
  const queryClient = useQueryClient();
  const { limit = 20, offset = 0 } = options || {};

  const query = useQuery<NotificationsResponse>({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, "list", { limit, offset }],
    queryFn: async () => {
      const response = await api.get<NotificationsResponse>(
        `${API_ENDPOINTS.NOTIFICATIONS}?limit=${limit}&offset=${offset}`,
      );
      return response;
    },
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  const unreadCountQuery = useQuery<{ count: number }>({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, "unreadCount"],
    queryFn: async () => {
      const response = await api.get<{ count: number }>(
        API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT,
      );
      return response;
    },
    staleTime: 1000 * 15, // Unread count refreshes every 15 seconds
    refetchInterval: 15000, // Poll every 15 seconds
    refetchOnWindowFocus: false,
  });

  // Mark notification(s) as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds?: number[]) => {
      await api.put(API_ENDPOINTS.NOTIFICATIONS_MARK_READ, {
        notificationIds: notificationIds || [],
      });
    },
    onSuccess: () => {
      // Invalidate all notifications cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(API_ENDPOINTS.NOTIFICATION_DELETE(id));
    },
    onSuccess: () => {
      // Invalidate all notifications cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put(API_ENDPOINTS.NOTIFICATIONS_MARK_READ, {
        notificationIds: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });

  // Listen for FCM messages and refresh notifications
  useFCMMessageListener(queryClient);

  return {
    notifications: query.data?.notifications || [],
    unreadCount: unreadCountQuery.data?.count || 0,
    isLoading: query.isLoading || unreadCountQuery.isLoading,
    refetch: query.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  };
}

/**
 * Hook to listen for FCM foreground messages and refresh notifications
 */
function useFCMMessageListener(queryClient: ReturnType<typeof useQueryClient>) {
  useEffect(() => {
    let unsubscribed = false;
    let unsubscribeFn: (() => void) | null = null;

    const setupListener = async () => {
      try {
        // onMessageListener returns a function that takes a callback
        const setupHandler = onMessageListener();

        if (unsubscribed) return;

        // Set up the message handler
        unsubscribeFn = setupHandler((payload: any) => {
          if (unsubscribed || !payload) return;

          console.log(
            "📱 FCM: Foreground message received, refreshing notifications",
          );

          // Show toast notification
          if (payload.notification) {
            const actionUrl = payload.data?.actionUrl;
            const bookingId = payload.data?.bookingId;
            const status = payload.data?.status;

            let finalUrl = actionUrl;
            if (actionUrl && bookingId) {
              const url = new URL(actionUrl, window.location.origin);

              // Add tab parameter based on status
              if (status) {
                const statusMap: Record<string, string> = {
                  pending: "pending",
                  confirmed: "confirmed",
                  reschedule_pending: "reschedule_pending",
                  completed: "completed",
                  cancelled: "cancelled",
                  rejected: "rejected",
                };
                if (statusMap[status]) {
                  url.searchParams.set("tab", statusMap[status]);
                }
              }

              // Add expand parameter for specific booking
              url.searchParams.set("expand", bookingId.toString());
              finalUrl = url.toString();
            }

            toast(payload.notification.title || "New Notification", {
              description: payload.notification.body,
              duration: 5000,
              action: finalUrl
                ? {
                    label: "View",
                    onClick: () => {
                      window.location.href = finalUrl;
                    },
                  }
                : undefined,
            });
          }

          // IMMEDIATELY refresh notifications from server
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.NOTIFICATIONS],
          });
        });

        console.log("✅ FCM message listener set up successfully");
      } catch (error) {
        console.error("❌ Failed to setup FCM listener:", error);
      }
    };

    setupListener();

    return () => {
      console.log("🧹 Cleaning up FCM message listener");
      unsubscribed = true;
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [queryClient]);
}
