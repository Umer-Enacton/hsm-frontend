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
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Stats - 3 cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-full sm:w-[180px] rounded-md" />
      </div>

      {/* Results count */}
      <Skeleton className="h-4 w-40" />

      {/* Services Table */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[28%] py-4 px-4">Service</TableHead>
              <TableHead className="w-[24%] py-4 px-4">Business</TableHead>
              <TableHead className="w-[10%] py-4 px-4">Price</TableHead>
              <TableHead className="w-[12%] py-4 px-4">Duration</TableHead>
              <TableHead className="w-[10%] py-4 px-4">Rating</TableHead>
              <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
              <TableHead className="w-[6%] py-4 px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <TableRow key={i} className="border-b last:border-b-0">
                {/* Service Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </TableCell>

                {/* Business Column */}
                <TableCell className="py-4 px-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-3 w-3 rounded-full" />
                    </div>
                  </div>
                </TableCell>

                {/* Price Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-0.5">
                    <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </TableCell>

                {/* Duration Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </TableCell>

                {/* Rating Column */}
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-sm" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </TableCell>

                {/* Status Column */}
                <TableCell className="py-4 px-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>

                {/* Actions Column */}
                <TableCell className="py-4 px-4 text-right">
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
