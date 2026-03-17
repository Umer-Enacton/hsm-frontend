// Admin Bookings Skeleton
export function AdminBookingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-40 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
      </div>

      {/* Bookings Table */}
      <div className="bg-muted/20 rounded-lg h-96 animate-pulse" />
    </div>
  );
}
