// Admin Services List Skeleton
export function AdminServicesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-40 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-24 bg-muted/30 rounded animate-pulse" />
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
