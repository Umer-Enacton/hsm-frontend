// Admin Analytics Skeleton
export function AdminAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted/20 rounded animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-muted/30 rounded animate-pulse" />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-72 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
