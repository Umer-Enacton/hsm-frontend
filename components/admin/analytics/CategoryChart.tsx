"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface CategoryData {
  categoryId: number;
  categoryName: string;
  bookingCount: number;
  totalRevenue: number;
  platformFees: number;
  percentage: string;
}

export interface CategoryChartProps {
  data: CategoryData[];
  totalPlatformFees: number;
}

// Color palette for categories
const CATEGORY_COLORS = [
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#f97316", // Orange
  "#ef4444", // Red
  "#14b8a6", // Teal
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

export function CategoryChart({ data, totalPlatformFees }: CategoryChartProps) {
  // Prepare data for pie chart
  const chartData = data.map((item, index) => ({
    name: item.categoryName,
    value: item.platformFees,
    percentage: item.percentage,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            Platform Fees: {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <CardDescription>Platform fee earnings by service category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No category data available yet.</p>
            <p className="text-sm mt-1">
              Category breakdown will appear once payments are processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Revenue by Category</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Platform fee earnings by service category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[280px]">
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category breakdown list */}
        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Top Categories</h4>
          {data.slice(0, 5).map((category, index) => (
            <div key={category.categoryId} className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span className="truncate">{category.categoryName}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <span className="text-muted-foreground text-[10px] sm:text-xs">{category.bookingCount} bookings</span>
                <span className="font-medium text-green-600 text-[10px] sm:text-xs">{formatCurrency(category.platformFees)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
