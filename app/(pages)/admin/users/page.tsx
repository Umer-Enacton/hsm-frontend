"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getUsers, deleteUser, filterUsers } from "@/lib/user-api";
import { getUserData } from "@/lib/auth-utils";
import { UserList, type ViewMode } from "./components/UserList";
import { UserFilters } from "./components/UserFilters";
import { ViewUserDialog } from "./components/ViewUserDialog";
import { DeleteUserDialog } from "./components/DeleteUserDialog";
import type { AppUser, UserFilters as UserFiltersType } from "@/types/user";

// Pagination constants
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function UsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Filters
  const [filters, setFilters] = useState<UserFiltersType>({
    role: "all",
    search: "",
  });

  // Dialog states
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  // Get current user ID on mount
  useEffect(() => {
    const userData = getUserData();
    if (!userData || !userData.id) {
      router.push("/login");
      return;
    }
    setCurrentUserId(userData.id);
  }, [router]);

  // Fetch users on mount
  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  // Apply filters client-side when users or filters change
  useEffect(() => {
    const filtered = filterUsers(allUsers, filters);
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [allUsers, filters]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getUsers();
      setAllUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: AppUser) => {
    setViewingUser(user);
  };

  const handleDeleteClick = (user: AppUser) => {
    setDeletingUser(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);

    try {
      await deleteUser(deletingUser.id);
      toast.success("User deleted successfully");

      // Remove deleted user from state
      setAllUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));

      // Adjust page if deleting last item on current page
      const totalPages = Math.ceil(filteredUsers.length / pageSize);
      if (
        currentPage > 1 &&
        currentPage === totalPages &&
        filteredUsers.length % pageSize === 1
      ) {
        setCurrentPage(currentPage - 1);
      }

      setDeletingUser(null);
      setViewingUser(null); // Close view dialog if open
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.success("Users refreshed");
  };

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Failed to load users
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage platform users and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredUsers.length}
      />

      {/* Page Size Selector - Only show when there are many users */}
      {allUsers.length > DEFAULT_PAGE_SIZE && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Items per page:
          </span>
          <div className="flex items-center border rounded-md p-1">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Button
                key={size}
                variant={pageSize === size ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPageSize(size)}
                className="h-7 px-3"
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Users List with Pagination */}
      <UserList
        users={paginatedUsers}
        onView={handleViewUser}
        onDelete={handleDeleteClick}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalItems={filteredUsers.length}
        currentUserId={currentUserId}
      />

      {/* View User Dialog */}
      <ViewUserDialog
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
        user={viewingUser}
        currentUserId={currentUserId}
        onDelete={() => {
          setViewingUser(null);
          setDeletingUser(viewingUser);
        }}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        user={deletingUser}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}
