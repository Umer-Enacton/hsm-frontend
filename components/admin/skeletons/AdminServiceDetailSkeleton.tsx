import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminServiceDetailSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="flex items-center justify-end gap-2 flex-1">
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Cover Image Banner Card */}
      <Card className="overflow-hidden">
        <div className="relative h-36 sm:h-56 bg-muted">
          <Skeleton className="w-full h-full rounded-none" />

          {/* Badges - top left */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Status badge - top right */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Rating badge - bottom left */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4">
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>

        {/* Service name + description + quick stats */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2 space-y-2 sm:space-y-3">
          <Skeleton className="h-7 sm:h-9 w-56" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          {/* Quick stats row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1">
              <Skeleton className="h-3.5 w-3.5 rounded-sm" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Column - Provider + Business */}
        <div className="space-y-3 sm:space-y-6">
          {/* Provider Card */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
                <Skeleton className="h-5 w-36" />
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-sm flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Card */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
                <Skeleton className="h-5 w-44" />
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              {/* Logo + name + badge */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
              {/* Location */}
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-32" />
              </div>
              {/* Phone */}
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Service Details */}
        <div className="space-y-3 sm:space-y-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              {/* 2x2 grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Service ID */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                {/* Status */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                {/* Price */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-10" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
                {/* Duration */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-14" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="pt-2 sm:pt-3 border-t space-y-1">
                <Skeleton className="h-3 w-12" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Created */}
              <div className="pt-2 sm:pt-3 border-t space-y-1">
                <Skeleton className="h-3 w-14" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
