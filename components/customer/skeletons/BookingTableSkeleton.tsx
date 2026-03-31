import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function BookingsTableSkeletonRow({ index }: { index: number }) {
  return (
    <TableRow>
      <TableCell className="py-3 px-4">
        <Skeleton className="h-4 w-4" />
      </TableCell>
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3 px-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </TableCell>
      <TableCell className="py-3 px-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </TableCell>
      <TableCell className="py-3 px-4">
        <Skeleton className="h-6 w-16 rounded-full" />
      </TableCell>
      <TableCell className="py-3 px-4 text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export function BookingsTableSkeleton({ rows = 5 }) {
  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[1%] py-4 px-4"></TableHead>
            <TableHead className="w-[35%] py-4 px-4">Service</TableHead>
            <TableHead className="w-[25%] py-4 px-4">Provider</TableHead>
            <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
            <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
            <TableHead className="w-[9%] py-4 px-4 text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <BookingsTableSkeletonRow key={i} index={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
