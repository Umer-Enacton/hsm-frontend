import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Single business card skeleton matching BusinessGridCard layout
export function BusinessCardSkeleton() {
  return (
    <Card className="group overflow-hidden w-full p-0 cursor-pointer">
      {/* Cover Image Area - matches h-48 sm:h-56 */}
      <div className="relative h-48 sm:h-56 bg-muted">
        {/* Cover skeleton */}
        <Skeleton className="w-full h-full rounded-none" />

        {/* Category Badge - matches top-3 left-3 */}
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-5 w-16 rounded" />
        </div>

        {/* Verification Badge - matches top-3 right-3 */}
        <div className="absolute top-3 right-3 z-10">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        {/* Business Info - Bottom overlay at absolute bottom-0 left-0 right-0 z-10 p-4 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="flex items-end justify-between gap-3">
            {/* Logo + Info */}
            <div className="flex items-center gap-3">
              {/* Logo - matches h-14 w-14 rounded-xl */}
              <Skeleton className="h-14 w-14 rounded-xl border-2 border-white/30 bg-white/10" />

              {/* Name + Details */}
              <div className="space-y-1.5">
                {/* Name */}
                <Skeleton className="h-5 w-36 bg-white/20" />
                {/* Location + Rating row */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24 bg-white/20" />
                  <Skeleton className="h-3 w-12 bg-white/20" />
                </div>
              </div>
            </div>

            {/* Menu button - matches h-9 w-9 rounded-full */}
            <Skeleton className="h-9 w-9 rounded-full bg-white/20 flex-shrink-0" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Full admin business page skeleton
export function AdminBusinessSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Stats Cards - matches grid-cols-2 sm:grid-cols-3 (only 3 cards) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-7 w-10" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters - matches flex flex-col sm:flex-row gap-4 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <Skeleton className="h-10 flex-1 rounded-md" />
        {/* Status filter - matches w-full sm:w-[180px] */}
        <Skeleton className="h-10 w-full sm:w-[180px] rounded-md" />
      </div>

      {/* Results count */}
      <Skeleton className="h-4 w-48" />

      {/* Business Cards Grid - matches grid-cols-2 lg:grid-cols-3 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
