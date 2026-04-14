import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProviderStaffPayoutsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24 mt-1" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Payouts Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="overflow-x-auto border rounded-md">
            <div className="bg-muted/50 p-4 border-b">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  {/* Staff Member */}
                  <div className="flex items-center gap-3 w-1/5">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  {/* Contact */}
                  <div className="w-1/6">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  {/* Payment Details */}
                  <div className="w-1/6">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  {/* Pending Amount */}
                  <div className="w-1/6 flex justify-end">
                    <Skeleton className="h-6 w-20" />
                  </div>
                  {/* Bookings */}
                  <div className="w-1/12 flex justify-center">
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </div>
                  {/* Actions */}
                  <div className="w-1/6 flex justify-end">
                    <Skeleton className="h-9 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
