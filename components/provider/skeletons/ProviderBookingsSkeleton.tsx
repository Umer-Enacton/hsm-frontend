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

export function ProviderBookingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Statistics - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 w-full max-w-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-md" />
        ))}
      </div>

      {/* Results count */}
      <Skeleton className="h-4 w-40" />

      {/* Bookings Table */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[1%] py-4 px-4"></TableHead>
              <TableHead className="w-[20%] py-4 px-4">Customer</TableHead>
              <TableHead className="w-[25%] py-4 px-4">Service</TableHead>
              <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
              <TableHead className="w-[20%] py-4 px-4">Address</TableHead>
              <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
              <TableHead className="w-[9%] py-4 px-4 text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-b last:border-b-0">
                {/* Expand Chevron */}
                <TableCell className="py-4 px-4">
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>

                {/* Customer Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </TableCell>

                {/* Service Column */}
                <TableCell className="py-4 px-4">
                  <Skeleton className="h-4 w-36" />
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

                {/* Address Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-start gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-sm flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
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
