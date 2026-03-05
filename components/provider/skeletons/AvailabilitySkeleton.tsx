import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function AvailabilitySkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="rounded-lg">
            <div className="p-0">
              <div className="flex items-center justify-around gap-0 px-3 py-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
