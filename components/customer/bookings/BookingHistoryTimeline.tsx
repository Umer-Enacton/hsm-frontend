"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, CheckCircle2, Clock, History, RotateCcw, XCircle } from "lucide-react";

interface BookingHistoryEvent {
  id: number;
  bookingId: number;
  action: string;
  message: string;
  actor: 'customer' | 'provider' | 'system' | null;
  actorId: number | null;
  historyData: any | null;
  createdAt: string;
}

interface BookingHistoryTimelineProps {
  bookingId: number;
  refreshKey?: number;
}

export function BookingHistoryTimeline({ bookingId, refreshKey }: BookingHistoryTimelineProps) {
  const [events, setEvents] = useState<BookingHistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!bookingId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<{ history: BookingHistoryEvent[] }>(
          API_ENDPOINTS.BOOKING_HISTORY(bookingId)
        );
        setEvents(data.history || []);
      } catch (err: any) {
        console.error("Failed to fetch booking history:", err);
        setError("Failed to load booking timeline");
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [bookingId, refreshKey]);

  const getEventIcon = (action: string) => {
    switch (action) {
      case "booked":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "cancelled":
      case "rejected":
      case "reschedule_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "reschedule_requested":
      case "reschedule_accepted":
        return <History className="h-4 w-4 text-purple-500" />;
      case "refunded":
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatEventTitle = (action: string) => {
    const titles: Record<string, string> = {
      booked: "Booking Created",
      confirmed: "Booking Confirmed",
      reschedule_requested: "Reschedule Requested",
      reschedule_accepted: "Reschedule Accepted",
      reschedule_rejected: "Reschedule Rejected",
      cancelled: "Booking Cancelled",
      rejected: "Booking Rejected",
      completed: "Service Completed",
      refunded: "Refund Processed",
    };
    return titles[action] || action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive py-4">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      <h4 className="font-semibold text-sm mb-4">Booking Timeline</h4>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {events.map((event) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              {getEventIcon(event.action)}
            </div>
            
            {/* Content card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                <h5 className="font-semibold text-sm">{formatEventTitle(event.action)}</h5>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {event.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
