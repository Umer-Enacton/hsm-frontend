import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function AdminBusinessGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {/* Image area */}
          <Skeleton className="h-48 w-full" />

          {/* Content overlay area */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
