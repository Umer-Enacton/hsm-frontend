import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminBusinessDetailSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="flex items-center justify-end gap-2 flex-1">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Cover Image Banner Card */}
      <Card className="overflow-hidden">
        <div className="relative h-36 sm:h-48 bg-muted">
          {/* Cover */}
          <Skeleton className="w-full h-full rounded-none" />

          {/* Category badge - top left */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Verification badge - top right */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Logo - bottom left overlapping */}
          <div className="absolute -bottom-4 sm:-bottom-6 left-3 sm:left-6">
            <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-md border-4 border-background" />
          </div>
        </div>

        {/* Business name + rating below cover */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-6 sm:pt-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Provider Info Card */}
          <Card className="gap-0">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
                <Skeleton className="h-5 w-36" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-sm flex-shrink-0" />
                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
                <Skeleton className="h-5 w-44" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Description */}
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Location */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                {/* Phone */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                {/* Category */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                {/* Website */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-14" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Joined */}
              <div className="space-y-1">
                <Skeleton className="h-3 w-10" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Services (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {/* Name + status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1 min-w-0">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-full flex-shrink-0" />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-10" />
                      </div>

                      {/* Price + button */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-0.5">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-7 sm:h-8 w-14 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
