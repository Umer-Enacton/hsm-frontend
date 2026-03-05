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
import { User as UserIcon } from "lucide-react";
import type { AppUser } from "@/types/user";
import { ViewToggleButtons, AdminPagination, EmptyState } from "@/components/admin/shared";

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
      <EmptyState
        icon={UserIcon}
        title="No users found"
        description="Try adjusting your filters or search query"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{totalItems}</span> users
        </div>
        <ViewToggleButtons viewMode={viewMode} onViewModeChange={onViewModeChange} />
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
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}

export default UserList;
