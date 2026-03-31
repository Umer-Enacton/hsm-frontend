import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function BusinessProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      {/* Stats Overview - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Hero Card */}
      <Card className="overflow-hidden py-0">
        {/* Cover Image */}
        <div className="relative h-36 sm:h-48 bg-muted">
          <Skeleton className="h-full w-full" />
          {/* Logo Overlay - Bottom Left */}
          <div className="absolute -bottom-4 sm:-bottom-6 left-3 sm:left-6">
            <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-md border-4 border-background" />
          </div>
          {/* Badges - Top Right */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Category Badge - Top Left */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>

        {/* Business Info Below Cover */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2 space-y-2 sm:space-y-3">
          {/* Business Name */}
          <Skeleton className="h-6 sm:h-7 w-48 sm:w-56" />
          {/* Rating */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
          {/* Location */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-32" />
          </div>
          {/* Category Badge */}
          <Skeleton className="h-5 w-16 rounded-full" />
          {/* Description lines */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-44" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Phone */}
                <div className="flex items-center gap-3 p-3 rounded-md border">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-md border">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
                {/* Location - full width */}
                <div className="flex items-center gap-3 p-3 rounded-md border sm:col-span-2">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                {/* Website - full width */}
                <div className="flex items-center gap-3 p-3 rounded-md border sm:col-span-2">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-44" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-md bg-muted/30 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-7 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-md border space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-4 w-6" />
                        </div>
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-md bg-muted/30">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
