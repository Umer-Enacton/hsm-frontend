"use client";

import React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete: (category: Category) => void;
  className?: string;
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
  className,
}: CategoryCardProps) {
  const handleDelete = () => {
    onDelete(category);
  };

  const handleEdit = () => {
    onEdit?.(category);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        "border-2 hover:border-primary/50 p-0",
        className,
      )}
    >
      {/* Image or Icon Header */}
      {category.image ? (
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Name */}
        <div className="flex items-start gap-2.5">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors">
              {category.name}
            </h3>
            {category.createdAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(category.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {category.description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-1 h-8 text-xs"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CategoryCard;
