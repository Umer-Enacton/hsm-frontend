import { Skeleton } from "@/components/ui/skeleton";

export function AdminServicesTableSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden bg-card">
      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 bg-muted/50 p-4 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16 justify-self-end" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0 items-center">
          {/* Service */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          {/* Business */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Price */}
          <Skeleton className="h-4 w-16" />

          {/* Duration */}
          <Skeleton className="h-4 w-12" />

          {/* Rating */}
          <Skeleton className="h-4 w-16" />

          {/* Status */}
          <Skeleton className="h-6 w-16 rounded-full" />

          {/* Actions */}
          <Skeleton className="h-8 w-8 rounded justify-self-end" />
        </div>
      ))}
    </div>
  );
}
