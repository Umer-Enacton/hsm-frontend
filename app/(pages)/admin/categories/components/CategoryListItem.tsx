"use client";

import React from "react";
import Image from "next/image";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

interface CategoryListItemProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete: (category: Category) => void;
  className?: string;
}

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
  className,
}: CategoryListItemProps) {
  const handleDelete = () => {
    onDelete(category);
  };

  const handleEdit = () => {
    onEdit?.(category);
  };

  return (
    <TableRow className={cn("group", className)}>
      {/* Image & Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          {category.image ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
          )}
          <span className="font-medium">{category.name}</span>
        </div>
      </TableCell>

      {/* Description */}
      <TableCell>
        <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
          {category.description}
        </p>
      </TableCell>

      {/* Created Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {category.createdAt
            ? new Date(category.createdAt).toLocaleDateString()
            : "N/A"}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit {category.name}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {category.name}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default CategoryListItem;
