"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Briefcase, Shield } from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import {
  useAdminUsers,
  useFilteredUsers,
  useDeleteUser,
} from "@/lib/queries";
import { UserList, type ViewMode } from "./components/UserList";
import { UserFilters } from "./components/UserFilters";
import { ViewUserDialog } from "./components/ViewUserDialog";
import { DeleteUserDialog } from "./components/DeleteUserDialog";
import type { AppUser, UserFilters as UserFiltersType } from "@/types/user";
import { AdminPageHeader, StatCard, ErrorState } from "@/components/admin/shared";
import { AdminUsersSkeleton } from "@/components/admin/skeletons";

// Pagination constants
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function UsersPage() {
  const router = useRouter();

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
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  useMemo(() => {
    const userData = getUserData();
    if (!userData || !userData.id) {
      router.push("/login");
      return;
    }
    setCurrentUserId(userData.id);
  }, [router]);

  // Fetch users using TanStack Query
  const {
    data: allUsers = [],
    isLoading,
    error,
    refetch,
  } = useAdminUsers();

  // Filter users client-side
  const filteredUsers = useFilteredUsers(allUsers, filters);

  // Delete mutation
  const deleteMutation = useDeleteUser();

  // Reset to page 1 when filters or page size changes
  useMemo(() => {
    setCurrentPage(1);
  }, [pageSize, filters]);

  // Calculate user stats by role
  const userStats = useMemo(() => {
    const customers = allUsers.filter((u) => u.roleId === 1).length;
    const providers = allUsers.filter((u) => u.roleId === 2).length;
    const admins = allUsers.filter((u) => u.roleId === 3).length;
    return { total: allUsers.length, customers, providers, admins };
  }, [allUsers]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  const handleViewUser = (user: AppUser) => {
    setViewingUser(user);
  };

  const handleDeleteClick = (user: AppUser) => {
    setDeletingUser(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    try {
      await deleteMutation.mutateAsync(deletingUser.id);

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
    } catch (err) {
      // Error handling is done in the mutation
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return <AdminUsersSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Users"
          description="Manage platform users and permissions"
        />
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load users"}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Users"
        description="Manage platform users and permissions"
        onRefresh={handleRefresh}
      />

      {/* User Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          title="Total Users"
          value={userStats.total}
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Customers"
          value={userStats.customers}
          icon={UserCheck}
          variant="emerald"
        />
        <StatCard
          title="Providers"
          value={userStats.providers}
          icon={Briefcase}
          variant="purple"
        />
        <StatCard
          title="Admins"
          value={userStats.admins}
          icon={Shield}
          variant="orange"
        />
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
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
