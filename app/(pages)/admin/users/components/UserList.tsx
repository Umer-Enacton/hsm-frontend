"use client";

import React from "react";
import { UserCard } from "./UserCard";
import { UserListItem } from "./UserListItem";
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  User as UserIcon,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import type { AppUser } from "@/types/user";
import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list";

interface UserListProps {
  users: AppUser[];
  onView: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  currentUserId?: number; // Current logged-in admin user ID
}

export function UserList({
  users,
  onView,
  onDelete,
  viewMode,
  onViewModeChange,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  currentUserId,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
          <UserIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No users found</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Info */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{startItem}</span> to{" "}
          <span className="font-medium text-foreground">{endItem}</span> of{" "}
          <span className="font-medium text-foreground">{totalItems}</span>{" "}
          users
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            View:
          </span>
          <div className="flex items-center border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="h-7 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="h-7 px-2"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onView={onView}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">User</TableHead>
                <TableHead className="w-[15%]">Role</TableHead>
                <TableHead className="w-[20%]">Phone</TableHead>
                <TableHead className="w-[20%]">Joined</TableHead>
                <TableHead className="w-[15%] ">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onView={onView}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <SlidersHorizontal className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers(currentPage, totalPages).map((page, index) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <SlidersHorizontal className="h-4 w-4 sm:ml-1 rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to generate page numbers with ellipsis
function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  const pages: (number | string)[] = [];
  const showEllipsis = totalPages > 7;

  if (!showEllipsis) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage <= 3) {
      // Near the start
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near the end
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
    }
  }

  return pages;
}

export default UserList;
