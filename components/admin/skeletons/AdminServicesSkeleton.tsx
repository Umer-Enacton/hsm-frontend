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

export function AdminServicesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-8 w-24 sm:w-28" />
          <Skeleton className="h-4 w-52 sm:w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
      </div>

      {/* Stats — 2 cols mobile, 3 cols sm+ */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 sm:space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-28" />
                  <Skeleton className="h-7 sm:h-8 w-10 sm:w-12" />
                  <Skeleton className="h-3 w-16 sm:w-24" />
                </div>
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters — stacked mobile, row sm+ */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Skeleton className="h-10 w-full flex-1 rounded-md" />
        <Skeleton className="h-10 w-full sm:w-[180px] rounded-md" />
      </div>

      {/* Results count */}
      <Skeleton className="h-4 w-36 sm:w-40" />

      {/* Services Table — horizontally scrollable on small screens */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[28%] py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                Service
              </TableHead>
              <TableHead className="w-[24%] py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                Business
              </TableHead>
              <TableHead className="w-[10%] py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                Price
              </TableHead>
              <TableHead className="w-[12%] py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                Duration
              </TableHead>
              <TableHead className="w-[10%] py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                Rating
              </TableHead>
              <TableHead className="w-[10%] py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                Status
              </TableHead>
              <TableHead className="w-[6%] py-3 sm:py-4 px-3 sm:px-4 text-right whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <TableRow key={i} className="border-b last:border-b-0">
                {/* Service — image + name + description */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                      <Skeleton className="h-3.5 sm:h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </TableCell>

                {/* Business — icon + name + badge */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-32" />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Skeleton className="h-3.5 sm:h-4 w-12 sm:w-16 rounded-full" />
                      <Skeleton className="h-3 w-3 rounded-full" />
                    </div>
                  </div>
                </TableCell>

                {/* Price */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-0.5">
                    <Skeleton className="h-3 w-3 rounded-sm flex-shrink-0" />
                    <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-12" />
                  </div>
                </TableCell>

                {/* Duration */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                    <Skeleton className="h-3 w-8 sm:w-10" />
                  </div>
                </TableCell>

                {/* Rating */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-sm flex-shrink-0" />
                    <Skeleton className="h-3.5 sm:h-4 w-6 sm:w-8" />
                    <Skeleton className="h-3 w-6 sm:w-8" />
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4">
                  <Skeleton className="h-5 w-14 sm:w-16 rounded-full" />
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                  <Skeleton className="h-7 sm:h-8 w-7 sm:w-8 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
