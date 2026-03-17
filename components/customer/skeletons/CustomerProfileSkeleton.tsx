import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function CustomerProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header - matches actual page */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Profile Card - matches ProfileHeader component */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />

            {/* Info */}
            <div className="flex-1 space-y-2 w-full">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 sm:w-80" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="border-b">
        <div className="flex gap-6">
          {["Overview", "Security", "Addresses"].map((tab) => (
            <Skeleton key={tab} className="h-10 w-20" />
          ))}
        </div>
      </div>

      {/* Tab Content Skeleton */}
      <div className="space-y-6">
        {/* Profile Overview Card */}
        <Card>
          <div className="p-4 sm:p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32 sm:w-40" />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36 sm:w-44" />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28 sm:w-36" />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24 sm:w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-full sm:w-auto rounded-md" />
          </div>
        </Card>
      </div>
    </div>
  );
}
