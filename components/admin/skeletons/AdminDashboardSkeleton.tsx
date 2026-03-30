import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Matches StatCard layout: title left, value below, icon right
function StatCardSkeleton({ className = "" }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-[280px] sm:w-[420px]" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
      </div>

      {/* Main Stats Grid — 2 cols mobile, 4 cols lg */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Revenue Stats Row — 2 cols mobile, 4 cols lg, colored borders */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Business Status — always 2 cols */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Skeleton className="h-5 w-40" />
            {/* Period selector tabs - collapse on mobile */}
            <div className="flex gap-1.5 flex-wrap">
              {["7d", "30d", "90d", "1y"].map((p) => (
                <Skeleton key={p} className="h-8 w-12 rounded-md" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] sm:h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16 sm:w-24 flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[120, 140, 160, 120, 140].map((w, i) => (
              <Skeleton
                key={i}
                className={`h-9 w-full sm:w-[${w}px] rounded-md`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
