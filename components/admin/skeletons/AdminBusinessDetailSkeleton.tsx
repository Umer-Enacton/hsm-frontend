// Admin Business Detail Skeleton
export function AdminBusinessDetailSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="h-10 w-10 bg-muted/30 rounded animate-pulse" />
        <div className="flex-1 flex justify-end">
          <div className="h-9 w-24 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>

      {/* Cover Image */}
      <div className="h-36 sm:h-48 bg-muted/20 animate-pulse" />

      {/* Business Info */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />
        <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />
        <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
