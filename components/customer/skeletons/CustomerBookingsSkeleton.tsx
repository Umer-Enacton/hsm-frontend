import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CustomerBookingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Statistics - 4 Cards: Total, Pending, Confirmed, Completed */}
      <div className="grid gap-4 md:grid-cols-4">
        {[28, 20, 20, 20].map((labelW, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className={`h-3 w-${labelW}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs - 5 tabs: All, Pending, Confirmed, Completed, Cancelled */}
      <div className="flex gap-2 max-w-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 flex-1" />
        ))}
      </div>

      {/* Results count text */}
      <Skeleton className="h-5 w-48" />

      {/* Bookings Table Skeleton */}
      <div className="border rounded-md overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[1%] py-4 px-4"></TableHead>
              <TableHead className="w-[35%] py-4 px-4">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[25%] py-4 px-4">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[20%] py-4 px-4">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[10%] py-4 px-4">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[9%] py-4 px-4 text-right">
                <Skeleton className="h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-b last:border-b-0">
                {/* Expand Chevron */}
                <TableCell className="py-4 px-4">
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>

                {/* Service Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-6" />
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Provider Column */}
                <TableCell className="py-4 px-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </TableCell>

                {/* Date & Time Column */}
                <TableCell className="py-4 px-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </TableCell>

                {/* Status Column */}
                <TableCell className="py-4 px-4">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>

                {/* Price Column */}
                <TableCell className="py-4 px-4 text-right">
                  <div className="flex items-center gap-0.5 justify-end">
                    <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
