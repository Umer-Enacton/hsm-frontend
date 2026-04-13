"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Calendar,
  MoreVertical,
  Trash2,
  Mail,
  Phone,
  Check,
  RefreshCw,
  Loader2,
  Filter,
  X,
  UserX,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/shared";
import { AdminPagination, EmptyState } from "@/components/admin/shared";
import {
  useProviderStaff,
  useFilteredStaff,
  useDeleteStaff,
  useAddStaff,
  useUpdateStaffStatus,
  useUpdateStaff,
} from "@/lib/queries/use-provider-staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Staff,
  StaffFilters as StaffFiltersType,
} from "@/lib/queries/use-provider-staff";

// Pagination constants
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// Helper function for status colors
function getStatusColor(status: Staff["status"]) {
  const colors = {
    active:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    on_leave:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    terminated: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };
  return colors[status] || "";
}

export default function StaffManagementPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Filters
  const [filters, setFilters] = useState<StaffFiltersType>({
    status: "all",
    search: "",
  });

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Fetch data using TanStack Query
  const { data: staff = [], isLoading, error, refetch } = useProviderStaff();

  // Filter staff client-side
  const filteredStaff = useFilteredStaff(staff || [], filters);

  // Mutations
  const deleteMutation = useDeleteStaff();
  const updateStatusMutation = useUpdateStaffStatus();

  // Reset to page 1 when filters or page size changes
  useMemo(() => {
    setCurrentPage(1);
  }, [pageSize, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStaff.length / pageSize);
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // Calculate staff stats
  const staffStats = useMemo(() => {
    const active = (staff || []).filter((s) => s.status === "active").length;
    const onLeave = (staff || []).filter((s) => s.status === "on_leave").length;
    const inactive = (staff || []).filter(
      (s) => s.status === "inactive",
    ).length;
    const terminated = (staff || []).filter(
      (s) => s.status === "terminated",
    ).length;

    return {
      total: (staff || []).length,
      active,
      onLeave,
      inactive,
      terminated,
    };
  }, [staff]);

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
  };

  // Handle delete
  const handleDeleteClick = (staffMember: Staff) => {
    if (
      confirm(
        `Are you sure you want to remove ${staffMember.name}? This action cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(staffMember.id);
    }
  };

  // Handle status change
  const handleStatusChange = async (
    staffId: number,
    newStatus: Staff["status"],
  ) => {
    updateStatusMutation.mutate({ id: staffId, status: newStatus });
  };

  // Handle edit
  const handleEditClick = (staffMember: Staff) => {
    setEditingStaff(staffMember);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Staff Management"
          description="Manage your team members and their assignments"
        />
        <div className="p-6 text-center border rounded-md bg-destructive/10">
          <p className="text-destructive">
            {error instanceof Error ? error.message : "Failed to load staff"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Staff Management"
        description="Manage your team members and their assignments"
        onRefresh={handleRefresh}
        actions={
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Staff
          </Button>
        }
      />

      {/* Staff Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          title="Total Staff"
          value={staffStats.total}
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Active"
          value={staffStats.active}
          icon={Check}
          variant="emerald"
        />
        <StatCard
          title="On Leave"
          value={staffStats.onLeave}
          icon={Calendar}
          variant="orange"
        />
        <StatCard
          title="Inactive"
          value={staffStats.inactive}
          icon={UserX}
          variant="red"
        />
      </div>

      {/* Filters */}
      <StaffFilters
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredStaff.length}
      />

      {/* Page Size Selector */}
      {(staff || []).length > DEFAULT_PAGE_SIZE && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
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

      {/* Staff Table */}
      {paginatedStaff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members found"
          description={
            filters.search || filters.status !== "all"
              ? "Try adjusting your filters or search query"
              : "Add your first staff member to get started"
          }
          onAction={() => setShowAddDialog(true)}
          actionLabel="Add Staff"
        />
      ) : (
        <div className="space-y-4">
          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredStaff.length}
            </span>{" "}
            staff member{filteredStaff.length !== 1 ? "s" : ""}
          </div>

          {/* Table */}
          <StaffTable
            staff={paginatedStaff}
            onDelete={handleDeleteClick}
            onStatusChange={handleStatusChange}
            onEdit={handleEditClick}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredStaff.length}
              pageSize={pageSize}
            />
          )}
        </div>
      )}

      {/* Add Staff Dialog */}
      <AddStaffDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onStaffAdded={() => {
          refetch();
        }}
      />

      {/* Edit Staff Dialog */}
      <EditStaffDialog
        open={editingStaff !== null}
        onOpenChange={(open) => !open && setEditingStaff(null)}
        staff={editingStaff}
        onStaffUpdated={() => {
          refetch();
        }}
      />
    </div>
  );
}

// Staff Filters Component
interface StaffFiltersProps {
  filters: StaffFiltersType;
  onFiltersChange: (filters: StaffFiltersType) => void;
  resultCount: number;
}

function StaffFilters({
  filters,
  onFiltersChange,
  resultCount,
}: StaffFiltersProps) {
  const clearFilters = () => {
    onFiltersChange({ status: "all", search: "" });
  };

  const hasActiveFilters = filters.search !== "" || filters.status !== "all";

  return (
    <div className="border rounded-md bg-zinc-50 dark:bg-zinc-900/50 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Label
            htmlFor="status-filter"
            className="text-sm font-medium whitespace-nowrap"
          >
            Status:
          </Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as StaffFiltersType["status"],
              })
            }
          >
            <SelectTrigger id="status-filter" className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Filter */}
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Result count */}
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} staff member{resultCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// Staff Table Component
interface StaffTableProps {
  staff: Staff[];
  onDelete: (staffMember: Staff) => void;
  onStatusChange: (staffId: number, newStatus: Staff["status"]) => void;
  onEdit: (staffMember: Staff) => void;
}

function StaffTable({
  staff,
  onDelete,
  onStatusChange,
  onEdit,
}: StaffTableProps) {
  return (
    <div className="border rounded-md overflow-hidden bg-white dark:bg-[#2D2D2D]">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-zinc-50 dark:bg-zinc-900/50">
            <th className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Staff Member
            </th>
            <th className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </th>
            <th className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Contact
            </th>
            <th className="h-12 px-4 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Earnings
            </th>
            <th className="h-12 px-4 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {staff.map((staffMember) => (
            <tr
              key={staffMember.id}
              className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={staffMember.avatar || undefined}
                      alt={staffMember.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-semibold">
                      {staffMember.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {staffMember.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {staffMember.employeeId}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  className={getStatusColor(staffMember.status)}
                  variant="secondary"
                >
                  {staffMember.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {staffMember.email}
                    </span>
                  </div>
                  {staffMember.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {staffMember.phone}
                      </span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  ₹{(staffMember.totalEarnings / 100).toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <StaffActions
                  staffMember={staffMember}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Staff Actions Component
interface StaffActionsProps {
  staffMember: Staff;
  onDelete: (staffMember: Staff) => void;
  onStatusChange: (staffId: number, newStatus: Staff["status"]) => void;
  onEdit: (staffMember: Staff) => void;
}

function StaffActions({
  staffMember,
  onDelete,
  onStatusChange,
  onEdit,
}: StaffActionsProps) {
  const status = staffMember.status;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(staffMember)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status === "active" && (
          <DropdownMenuItem
            onClick={() => onStatusChange(staffMember.id, "inactive")}
          >
            <UserX className="h-4 w-4 mr-2" />
            Deactivate
          </DropdownMenuItem>
        )}
        {status === "inactive" && (
          <DropdownMenuItem
            onClick={() => onStatusChange(staffMember.id, "active")}
          >
            <Check className="h-4 w-4 mr-2" />
            Activate
          </DropdownMenuItem>
        )}
        {status === "on_leave" && (
          <>
            <DropdownMenuItem
              onClick={() => onStatusChange(staffMember.id, "active")}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark Active (Return from Leave)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusChange(staffMember.id, "inactive")}
            >
              <UserX className="h-4 w-4 mr-2" />
              Deactivate
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(staffMember)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Staff
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Add Staff Dialog Component
interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffAdded: () => void;
}

function AddStaffDialog({
  open,
  onOpenChange,
  onStaffAdded,
}: AddStaffDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const addMutation = useAddStaff();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const staffData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    };

    try {
      addMutation.mutate(staffData, {
        onSuccess: () => {
          toast.success("Staff added successfully");
          onOpenChange(false);
          onStaffAdded();
        },
      });
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast.error(error.response?.data?.message || "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to your team. They will receive login
            credentials via email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                disabled={submitting}
                validateAs="name"
                maxLength={50}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                disabled={submitting}
                validateAs="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
              disabled={submitting}
              validateAs="phone"
            />
            <p className="text-xs text-muted-foreground">
              10 digits starting with 6-9 (Indian format)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Staff"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Staff Dialog Component
interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onStaffUpdated: () => void;
}

function EditStaffDialog({
  open,
  onOpenChange,
  staff,
  onStaffUpdated,
}: EditStaffDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const updateMutation = useUpdateStaff();

  if (!staff) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const staffData = {
      name: formData.get("name") as string,
      // Email cannot be changed - use original staff email
      phone: formData.get("phone") as string,
    };

    try {
      updateMutation.mutate(
        { id: staff.id, ...staffData },
        {
          onSuccess: () => {
            toast.success("Staff updated successfully");
            onOpenChange(false);
            onStaffUpdated();
          },
        },
      );
    } catch (error: any) {
      console.error("Error updating staff:", error);
      toast.error(error.response?.data?.message || "Failed to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update staff member details for {staff.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={staff.name}
                placeholder="John Doe"
                required
                disabled={submitting}
                validateAs="name"
                maxLength={50}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={staff.email}
                placeholder="john@example.com"
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
              name="phone"
              type="tel"
              defaultValue={staff.phone || ""}
              placeholder="9876543210"
              disabled={submitting}
              validateAs="phone"
            />
            <p className="text-xs text-muted-foreground">
              10 digits starting with 6-9 (Indian format)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
