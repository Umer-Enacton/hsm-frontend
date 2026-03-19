import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      {/* Image Section */}
      <Skeleton className="h-48 w-full rounded-none" />

      <CardContent className="p-4 space-y-3">
        {/* Service Name */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>

        {/* Price and Duration */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        {/* Rating and Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderServicesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Stats Overview - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Services Grid - 8 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
