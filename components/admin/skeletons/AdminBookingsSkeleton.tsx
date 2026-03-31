import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminBookingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Stats Cards - matches grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-10" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input with icon */}
            <div className="relative flex-1">
              <Skeleton className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Skeleton className="h-10 w-full pl-10 rounded-md" />
            </div>
            {/* Status filter */}
            <Skeleton className="h-10 w-full md:w-48 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border rounded-md p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* ID + Status badge */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>

                    {/* 3-col grid: Customer, Provider, Amount - grid-cols-1 md:grid-cols-3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Customer */}
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-16" />
                        </p>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40 text-xs" />
                      </div>
                      {/* Provider */}
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-14" />
                        </p>
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28 text-xs" />
                      </div>
                      {/* Amount */}
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-14" />
                        </p>
                        <Skeleton className="h-4 w-20 text-green-600" />
                      </div>
                    </div>

                    {/* Date line */}
                    <Skeleton className="h-3 w-64 text-xs text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
