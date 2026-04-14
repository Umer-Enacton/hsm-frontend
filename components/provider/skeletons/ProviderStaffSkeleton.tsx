import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatCardSkeleton({ className = "" }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-sm shrink-0" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
      </CardContent>
    </Card>
  );
}

export function ProviderStaffSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md shrink-0" />
      </div>

      {/* Staff Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Filters */}
      <div className="border rounded-md bg-zinc-50 dark:bg-zinc-900/50 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 flex-1 max-w-md" />
        </div>
      </div>

      {/* Staff Table */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="border rounded-md overflow-hidden bg-white dark:bg-[#2D2D2D]">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <div className="divide-y border-zinc-100 dark:border-zinc-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 w-1/4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="space-y-2 w-1/5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
