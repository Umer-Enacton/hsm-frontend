import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Matches BusinessCard — cover image with overlaid badges, logo, name, menu
export function BusinessCardSkeleton() {
  return (
    <Card className="overflow-hidden w-full p-0 cursor-pointer">
      <div className="relative h-48 sm:h-56 bg-muted">
        {/* Cover image */}
        <Skeleton className="w-full h-full rounded-none" />

        {/* Category badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-5 w-16 rounded" />
        </div>

        {/* Verification badge — top right */}
        <div className="absolute top-3 right-3 z-10">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Bottom overlay: logo + name + location/rating + menu */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Logo */}
              <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0 bg-white/20" />
              {/* Name & meta */}
              <div className="space-y-1.5 min-w-0">
                <Skeleton className="h-5 w-32 sm:w-36 bg-white/20" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-3 w-20 sm:w-24 bg-white/20" />
                  <Skeleton className="h-3 w-12 sm:w-16 bg-white/20" />
                </div>
              </div>
            </div>
            {/* Menu button */}
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 bg-white/20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AdminBusinessSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36 sm:w-44" />
          <Skeleton className="h-4 w-56 sm:w-72" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
      </div>

      {/* Stats — 2 cols mobile, 4 cols lg */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 pb-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  <Skeleton className="h-7 sm:h-8 w-10 sm:w-12" />
                </div>
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Search */}
            <Skeleton className="h-10 w-full flex-1 rounded-md" />
            {/* Status filter */}
            <Skeleton className="h-10 w-full md:w-48 rounded-md" />
            {/* Verification filter */}
            <Skeleton className="h-10 w-full md:w-48 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Business Cards Grid — 1 col → 2 sm → 3 lg → 4 xl */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
