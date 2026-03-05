import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BookingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Button Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Hero Card Skeleton */}
      <Card className="overflow-hidden border-2">
        <div className="flex flex-col md:flex-row">
          {/* Image Skeleton */}
          <div className="relative w-full md:w-80 h-64 md:h-auto flex-shrink-0 bg-muted">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Hero Content */}
          <div className="flex-1 p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-px" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-6 w-80" />
            </div>

            {/* Quick Info */}
            <div className="grid sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Bookings Table Skeleton */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[1%] py-4 px-4"></TableHead>
              <TableHead className="w-[35%] py-4 px-4">Service</TableHead>
              <TableHead className="w-[25%] py-4 px-4">Provider</TableHead>
              <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
              <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
              <TableHead className="w-[9%] py-4 px-4 text-right">
                Price
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
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
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

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  {i < 3 && (
                    <Skeleton
                      className="w-0.5 flex-1 my-2"
                      style={{ minHeight: "32px" }}
                    />
                  )}
                </div>
                <div className="flex-1 pt-2 space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Info Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
