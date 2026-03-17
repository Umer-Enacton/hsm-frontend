import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Single provider payout card skeleton
function ProviderPayoutCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-3 sm:p-4">
      <div className="space-y-3">
        {/* Provider Info */}
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-5 w-28 sm:w-36" />
            <Skeleton className="h-3 w-36 sm:w-44" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 sm:w-20" />
            <Skeleton className="h-6 w-20 sm:w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12 sm:w-16" />
            <Skeleton className="h-6 w-8 sm:w-10" />
          </div>
        </div>

        {/* Threshold status pill */}
        <Skeleton className="h-8 w-full rounded-lg" />

        {/* Pay button */}
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

// Single payout history row skeleton
function PayoutHistoryRowSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Provider name + business */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Skeleton className="h-4 w-24 sm:w-28" />
            <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
            <Skeleton className="h-3 w-28 sm:w-36" />
          </div>
          {/* Booking # + date */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
              <Skeleton className="h-3 w-16 sm:w-20" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
              <Skeleton className="h-3 w-16 sm:w-20" />
            </div>
          </div>
        </div>
        {/* Amount + badge */}
        <div className="text-right space-y-1.5 flex-shrink-0">
          <Skeleton className="h-6 w-16 sm:w-20 ml-auto" />
          <Skeleton className="h-5 w-14 sm:w-16 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function AdminPayoutsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 sm:w-44" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Summary Cards - matches grid-cols-2 lg:grid-cols-4 */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24 sm:w-28" />
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Skeleton className="h-7 sm:h-8 w-20 sm:w-24" />
              <Skeleton className="h-3 w-16 sm:w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Provider-Level Payouts Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36 sm:w-44" />
                <Skeleton className="h-3 w-16 sm:w-20" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description + Pay All button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4 sm:w-1/2" />
            </div>
            <Skeleton className="h-9 w-32 sm:w-36 rounded-md flex-shrink-0" />
          </div>

          {/* Provider cards grid - matches grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProviderPayoutCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-28 sm:w-36" />
                <Skeleton className="h-3 w-24 sm:w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 sm:w-[150px] rounded-md flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <PayoutHistoryRowSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
