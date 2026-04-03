import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProviderBookingsTableSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[1%] py-4 px-4"></TableHead>
            <TableHead className="w-[20%] py-4 px-4">Customer</TableHead>
            <TableHead className="w-[25%] py-4 px-4">Service</TableHead>
            <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
            <TableHead className="w-[20%] py-4 px-4">Address</TableHead>
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
  );
}
