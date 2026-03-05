import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ServiceDetailSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        {/* Hero Banner Skeleton */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-muted animate-pulse">
          {/* Simulated gradient overlay info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Skeleton className="h-9 w-64 bg-white/20" />
                  <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
                </div>
                <Skeleton className="h-5 w-40 bg-white/20" />
              </div>
              {/* Price */}
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 bg-white/20" />
                <Skeleton className="h-9 w-16 bg-white/20" />
              </div>
            </div>
            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full bg-white/20" />
                <Skeleton className="h-4 w-20 bg-white/20" />
                <Skeleton className="h-4 w-16 bg-white/20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full bg-white/20" />
                <Skeleton className="h-4 w-28 bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* About This Service Skeleton */}
        <Card className="gap-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mt-3 pt-6 border-t">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Reviews Skeleton */}
        <Card className="gap-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-5 border border-border/50">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Skeleton key={s} className="h-4 w-4 rounded-sm" />
                    ))}
                    <Skeleton className="h-4 w-8 ml-2" />
                  </div>
                  {/* Review text */}
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  {/* Customer info */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Skeleton className="h-2 w-8 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN - Booking Card */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-20">
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-0">
              {/* Date Selection */}
              <div className="p-1 pb-4 pt-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-sm" />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Time Selection */}
              <div className="p-1 pb-4 pt-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-3 w-32 mb-3" />
                {/* Legend */}
                <div className="mb-3 p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Skeleton className="h-3 w-3 rounded" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Time slots */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <Skeleton key={i} className="h-9 rounded-lg" />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Address Selection */}
              <div className="p-1 pb-4 pt-6">
                <Skeleton className="h-4 w-28 mb-4" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-full p-4 rounded-lg border-2 border-border space-y-1.5"
                    >
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Book Now Button */}
              <div className="p-6 pt-6">
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
