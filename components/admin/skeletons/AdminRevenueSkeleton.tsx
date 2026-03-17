// Admin Revenue Skeleton
export function AdminRevenueSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Charts */}
      <div className="h-80 bg-muted/20 rounded-lg animate-pulse" />
    </div>
  );
}
