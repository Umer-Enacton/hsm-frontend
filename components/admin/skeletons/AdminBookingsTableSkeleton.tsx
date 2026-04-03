import { Skeleton } from "@/components/ui/skeleton";

export function AdminBookingsTableSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden bg-card">
      {/* Table Header */}
      <div className="grid grid-cols-8 gap-4 bg-muted/50 p-4 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20 justify-self-end" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-4 p-4 border-b last:border-b-0 items-center">
          {/* Booking ID */}
          <Skeleton className="h-4 w-20" />

          {/* Customer */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Service */}
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Provider */}
          <Skeleton className="h-4 w-24" />

          {/* Date/Time */}
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Amount */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Status */}
          <Skeleton className="h-6 w-20 rounded-full" />

          {/* Actions */}
          <div className="flex gap-2 justify-self-end">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
