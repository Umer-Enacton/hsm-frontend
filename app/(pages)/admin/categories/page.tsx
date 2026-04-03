"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  useAdminCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/queries";
import { CategoryList, type ViewMode } from "./components/CategoryList";
import { AddCategoryDialog } from "./components/AddCategoryDialog";
import { EditCategoryDialog } from "./components/EditCategoryDialog";
import { DeleteCategoryDialog } from "./components/DeleteCategoryDialog";
import type { Category, CategoryFormData } from "@/types/category";
import {
  AdminPageHeader,
  ErrorState,
} from "@/components/admin/shared";
import { AdminCategoriesSkeleton } from "@/components/admin/skeletons";

// Pagination constants
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

export default function CategoriesPage() {
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Fetch categories using TanStack Query with pagination
  const {
    data: categoriesData,
    isLoading,
    error,
    refetch,
  } = useAdminCategories({ page: currentPage, limit: pageSize });

  // Get categories and pagination from response
  const categories = categoriesData?.categories || [];
  const pagination = categoriesData?.pagination;

  // Mutations
  const addMutation = useAddCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Check if any mutation is in progress
  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleAddCategory = async (data: CategoryFormData) => {
    try {
      await addMutation.mutateAsync(data);
      setIsAddDialogOpen(false);
    } catch (err) {
      // Dialog stays open on error
    }
  };

  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async (id: number, data: CategoryFormData) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      setIsEditDialogOpen(false);
      setCategoryToEdit(null);
    } catch (err) {
      // Dialog stays open on error
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);

      // Adjust page if deleting last item on current page
      const totalPages = Math.ceil(categories.length / pageSize);
      if (
        currentPage > 1 &&
        currentPage === totalPages &&
        categories.length % pageSize === 1
      ) {
        setCurrentPage(currentPage - 1);
      }

      setCategoryToDelete(null);
    } catch (err) {
      // Dialog stays open on error
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // Reset to page 1 when page size changes
  useMemo(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Calculate total pages (from server pagination or fallback)
  const totalPages = pagination?.totalPages || Math.ceil(categories.length / pageSize);

  if (isLoading) {
    return <AdminCategoriesSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Categories"
          description="Manage service categories for your platform"
        />
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load categories"}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Categories"
        description="Manage service categories for your platform"
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        }
        onRefresh={handleRefresh}
      />

      {/* Page Size Selector - Only show when there are many categories */}
      {categories.length > DEFAULT_PAGE_SIZE && (
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

      {/* Categories List with Pagination */}
      <CategoryList
        categories={categories}
        onDelete={handleDeleteClick}
        onEdit={handleEditClick}
        onAddNew={() => setIsAddDialogOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalItems={pagination?.total || categories.length}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCategory}
        isLoading={addMutation.isPending}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setCategoryToEdit(null);
        }}
        category={categoryToEdit}
        onUpdate={handleUpdateCategory}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        category={categoryToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
