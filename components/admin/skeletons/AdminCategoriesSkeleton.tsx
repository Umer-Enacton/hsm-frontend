import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Single category card skeleton
function CategoryCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2 p-0">
      {/* Image / Icon header */}
      <Skeleton className="w-full aspect-video rounded-none" />

      <div className="p-4 space-y-3">
        {/* Name + date */}
        <div className="space-y-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

// Category list (table) skeleton
function CategoryListSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Name</TableHead>
            <TableHead className="w-[45%]">Description</TableHead>
            <TableHead className="w-[20%]">Created</TableHead>
            <TableHead className="w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TableRow key={i} className="border-b last:border-b-0">
              <TableCell className="py-3 px-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="py-3 px-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </TableCell>
              <TableCell className="py-3 px-4">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminCategoriesSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Page Size Selector - shows when items > 12 */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center border rounded-md p-1">
          {[12, 24, 48].map((i) => (
            <Skeleton key={i} className="h-7 w-10 rounded-sm" />
          ))}
        </div>
      </div>

      {/* Toolbar - matches CategoryList flex flex-col sm:flex-row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Info text */}
        <Skeleton className="h-4 w-48" />
        {/* View Toggle buttons - h-8 w-8 p-0 */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <CategoryListSkeleton />
      )}

      {/* Pagination - matches CategoryList pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Skeleton className="h-4 w-24 order-2 sm:order-1" />
        <div className="flex items-center gap-1 order-1 sm:order-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}
