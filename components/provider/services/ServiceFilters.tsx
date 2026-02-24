/**
 * Service Filters Component
 * Search and filter bar for service management
 */

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ServiceFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: "all" | "active" | "inactive";
  onStatusFilterChange: (filter: "all" | "active" | "inactive") => void;
  sortBy: "name" | "price" | "createdAt";
  onSortChange: (sort: "name" | "price" | "createdAt") => void;
}

export function ServiceFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: ServiceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as "all" | "active" | "inactive")
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={sortBy}
          onValueChange={(value) =>
            onSortChange(value as "name" | "price" | "createdAt")
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="price">Price (Low-High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
