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

// Single user card skeleton (grid view)
function UserCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Avatar + Name + Email */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full" />
          <div className="space-y-1.5 w-full">
            <Skeleton className="h-5 w-28 sm:w-32 mx-auto" />
            <Skeleton className="h-3 w-36 sm:w-44 mx-auto" />
          </div>
          {/* Role badge */}
          <Skeleton className="h-5 w-16 sm:w-20 rounded-full" />
        </div>

        {/* Phone + Joined */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-10 flex-shrink-0" />
            <Skeleton className="h-3 w-20 sm:w-24" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-12 flex-shrink-0" />
            <Skeleton className="h-3 w-16 sm:w-20" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// User list table skeleton
function UserTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">User</TableHead>
            <TableHead className="w-[15%]">Role</TableHead>
            <TableHead className="w-[20%]">Phone</TableHead>
            <TableHead className="w-[20%]">Joined</TableHead>
            <TableHead className="w-[15%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <TableRow key={i} className="border-b last:border-b-0">
              {/* User - avatar + name + email */}
              <TableCell className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-24 sm:w-28" />
                    <Skeleton className="h-3 w-32 sm:w-40" />
                  </div>
                </div>
              </TableCell>
              {/* Role */}
              <TableCell className="py-3 px-4">
                <Skeleton className="h-5 w-16 sm:w-18 rounded-full" />
              </TableCell>
              {/* Phone */}
              <TableCell className="py-3 px-4">
                <Skeleton className="h-4 w-20 sm:w-24" />
              </TableCell>
              {/* Joined */}
              <TableCell className="py-3 px-4">
                <Skeleton className="h-4 w-16 sm:w-20" />
              </TableCell>
              {/* Actions */}
              <TableCell className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminUsersSkeleton({ viewMode = "list" }: { viewMode?: "grid" | "list" }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-48 sm:w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-full sm:w-[150px] rounded-md" />
          <Skeleton className="h-10 w-full sm:w-[150px] rounded-md" />
        </div>
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center border rounded-md p-1 gap-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-10 rounded-sm" />
          ))}
        </div>
      </div>

      {/* Toolbar: count + view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <UserTableSkeleton />
      )}

      {/* Pagination */}
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
