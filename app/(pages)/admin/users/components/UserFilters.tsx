"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";

interface UserFiltersProps {
  filters: {
    role: UserRole | "all";
    search: string;
  };
  onFiltersChange: (filters: {
    role: UserRole | "all";
    search: string;
  }) => void;
  resultCount?: number;
  className?: string;
}

export function UserFilters({
  filters,
  onFiltersChange,
  resultCount,
  className,
}: UserFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRoleChange = (role: string) => {
    onFiltersChange({
      ...filters,
      role: role === "all" ? "all" : (parseInt(role) as UserRole),
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({ role: "all", search: "" });
  };

  const hasActiveFilters = filters.search || filters.role !== "all";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select
          value={filters.role.toString()}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="1">Customer</SelectItem>
            <SelectItem value="2">Provider</SelectItem>
            <SelectItem value="3">Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearFilters}
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Count */}
      {resultCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultCount === 0
            ? "No users found"
            : resultCount === 1
              ? "1 user found"
              : `${resultCount} users found`}
        </p>
      )}
    </div>
  );
}

export default UserFilters;
