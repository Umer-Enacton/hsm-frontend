"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/category-api";
import { CategoryList, type ViewMode } from "./components/CategoryList";
import { AddCategoryDialog } from "./components/AddCategoryDialog";
import { EditCategoryDialog } from "./components/EditCategoryDialog";
import { DeleteCategoryDialog } from "./components/DeleteCategoryDialog";
import type { Category, CategoryFormData } from "@/types/category";

// Pagination constants
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
      toast.error(err.message || "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (data: CategoryFormData) => {
    setIsAdding(true);

    try {
      await addCategory(data);
      toast.success("Category added successfully");
      await fetchCategories(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Failed to add category");
      throw err; // Re-throw to keep dialog open on error
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async (id: number, data: CategoryFormData) => {
    setIsUpdating(true);

    try {
      await updateCategory(id, data);
      toast.success("Category updated successfully");
      await fetchCategories(); // Refresh list
      setIsEditDialogOpen(false);
      setCategoryToEdit(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
      throw err; // Re-throw to keep dialog open on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);

    try {
      await deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");

      // Adjust page if deleting last item on current page
      const totalPages = Math.ceil(categories.length / pageSize);
      if (currentPage > 1 && currentPage === totalPages && categories.length % pageSize === 1) {
        setCurrentPage(currentPage - 1);
      }

      await fetchCategories(); // Refresh list
      setCategoryToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
      throw err; // Re-throw to keep dialog open on error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchCategories();
    toast.success("Categories refreshed");
  };

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Calculate pagination
  const totalPages = Math.ceil(categories.length / pageSize);
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return categories.slice(startIndex, endIndex);
  }, [categories, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Failed to load categories
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchCategories} variant="outline">
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
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage service categories for your platform
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
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

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
        categories={paginatedCategories}
        onDelete={handleDeleteClick}
        onEdit={handleEditClick}
        onAddNew={() => setIsAddDialogOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalItems={categories.length}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCategory}
        isLoading={isAdding}
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
        isLoading={isUpdating}
      />

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        category={categoryToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}
