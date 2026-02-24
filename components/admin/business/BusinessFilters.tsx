/**
 * Business Filters Component
 * Search and filter bar for business management
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import type { AdminBusinessListParams } from "@/lib/admin/business";
import { INDIA_LOCATIONS } from "@/lib/data/india-locations";
import { api, API_ENDPOINTS } from "@/lib/api";
import { useState, useEffect } from "react";

interface BusinessFiltersProps {
  filters: AdminBusinessListParams;
  onFilterChange: (filters: Partial<AdminBusinessListParams>) => void;
  onSearch: (search: string) => void;
}

export function BusinessFilters({
  filters,
  onFilterChange,
  onSearch,
}: BusinessFiltersProps) {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ categories: any[] }>(API_ENDPOINTS.CATEGORIES);
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchChange = (value: string) => {
    onSearch(value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFilterChange({ status: value as "all" | "pending" | "verified" })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>

        {/* State Filter */}
        <Select
          value={filters.state || "all"}
          onValueChange={(value) => onFilterChange({ state: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {INDIA_LOCATIONS.map((location) => (
              <SelectItem key={location.state} value={location.state}>
                {location.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.categoryId?.toString() || "all"}
          onValueChange={(value) =>
            onFilterChange({ categoryId: value === "all" ? undefined : Number(value) })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
