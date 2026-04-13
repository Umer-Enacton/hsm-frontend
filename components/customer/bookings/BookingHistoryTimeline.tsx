"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookingHistoryEvent {
  id: number;
  bookingId: number;
  action: string;
  message: string;
  actor: "customer" | "provider" | "system" | null;
  actorId: number | null;
  historyData: any | null;
  createdAt: string;
}

interface BookingHistoryTimelineProps {
  bookingId: number;
  refreshKey?: number;
}

// Short labels for default display
const getShortLabel = (action: string): string => {
  const labels: Record<string, string> = {
    booked: "Booked",
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    cancelled: "Cancelled",
    completed: "Completed",
    refunded: "Refunded",
  };
  return labels[action] || action;
};

export function BookingHistoryTimeline({
  bookingId,
  refreshKey,
}: BookingHistoryTimelineProps) {
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
          API_ENDPOINTS.BOOKING_HISTORY(bookingId),
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
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "rescheduled":
        return <History className="h-4 w-4 text-purple-500" />;
      case "refunded":
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatEventTitle = (event: BookingHistoryEvent) => {
    if (event.message && event.message.length > 0) {
      return event.message;
    }

    const titles: Record<string, string> = {
      booked: "Booking Created",
      confirmed: "Booking Confirmed",
      rescheduled: "Booking Rescheduled",
      cancelled: "Booking Cancelled",
      completed: "Booking Completed",
      refunded: "Refund Processed",
    };
    return (
      titles[event.action] ||
      event.action.charAt(0).toUpperCase() +
        event.action.slice(1).replace(/_/g, " ")
    );
  };

  const parseHistoryData = (rawData: any) => {
    if (!rawData) return null;
    let data = rawData;
    let iterations = 0;
    while (typeof data === "string" && iterations < 3) {
      try {
        const parsed = JSON.parse(data);
        if (parsed === data) break;
        data = parsed;
        iterations++;
      } catch (e) {
        break;
      }
    }
    return data;
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr || timeStr === "N/A" || typeof timeStr !== "string")
      return timeStr;
    try {
      const parts = timeStr.split(":");
      if (parts.length < 2) return timeStr;
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  // Tooltip content for each event
  const EventTooltip = ({ event }: { event: BookingHistoryEvent }) => {
    const data = parseHistoryData(event.historyData);

    return (
      <div className="space-y-2">
        <p className="font-semibold text-sm">{formatEventTitle(event)}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(event.createdAt), "MMM d, yyyy, h:mm a")}
        </p>

        {/* Reschedule details */}
        {data && data.previousTime && data.newTime && (
          <div className="pt-2 border-t border-dashed border-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <span className="font-medium shrink-0">From:</span>
              <span>{format(new Date(data.previousDate), "EEE, MMM d")}</span>
              <span>•</span>
              <span>{formatTime12h(data.previousTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-primary/90">
              <span className="font-medium shrink-0">To:</span>
              <span className="font-semibold">
                {format(new Date(data.newDate), "EEE, MMM d")}
              </span>
              <span>•</span>
              <span className="font-semibold">
                {formatTime12h(data.newTime)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <h4 className="font-semibold text-sm mb-4">Booking Timeline</h4>
        <div className="flex items-center justify-between gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
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
      <h4 className="font-semibold text-sm">Booking Timeline</h4>

      {/* Horizontal Timeline Container */}
      <TooltipProvider delayDuration={200}>
        <div className="relative overflow-x-auto">
          {/* Continuous connecting line */}
          <div className="absolute top-5 left-2 right-2 h-0.5 bg-muted z-10" />
          <div className="flex items-center justify-between min-w-max px-2">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex flex-col items-center gap-2 px-1"
                style={{ minWidth: `${100 / Math.max(events.length, 2)}%` }}
              >
                {/* Icon with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background hover:scale-110 transition-transform cursor-pointer shadow-sm z-10">
                      {getEventIcon(event.action)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-xs z-50"
                  >
                    <EventTooltip event={event} />
                  </TooltipContent>
                </Tooltip>

                {/* Short label */}
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  {getShortLabel(event.action)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
