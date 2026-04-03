"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface StatusData {
  status: string;
  count: number;
  revenue: number;
  platformFees: number;
  percentage: string;
  fill: string;
}

export interface StatusChartProps {
  data: StatusData[];
  totalPlatformFees: number;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || isNaN(value)) {
    return "₹0";
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${Number(value).toFixed(2)}`;
};

// Format status name for display
const formatStatusName = (status: string | null | undefined) => {
  if (typeof status !== "string" || !status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Get status color for chart
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    completed: "hsl(142, 76%, 36%)", // Green
    confirmed: "hsl(217, 91%, 60%)", // Blue
    pending: "hsl(38, 92%, 50%)", // Orange
    cancelled: "hsl(0, 84%, 60%)", // Red
    rejected: "hsl(240, 5%, 26%)", // Dark gray
    reschedule_pending: "hsl(267, 88%, 65%)", // Purple
    refunded: "hsl(280, 60%, 50%)", // Purple
  };
  return colors[status] || "hsl(0, 0%, 50%)";
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: StatusData;
    fill: string;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-md shadow-lg p-3">
        <p className="text-sm font-medium">{formatStatusName(data.status)}</p>
        <p className="text-sm" style={{ color: data.fill }}>
          Platform Fees: {formatCurrency(data.platformFees)}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.count} bookings ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export function StatusChart({ data }: Omit<StatusChartProps, "totalPlatformFees">) {
  // Process data: only show pending, confirmed, completed
  // Group reschedule_pending with confirmed
  const processedData = useMemo(() => {
    const result = new Map<string, StatusData>();

    data.forEach((item) => {
      const status = item.status;

      // Group reschedule_pending with confirmed
      const targetStatus =
        status === "reschedule_pending" ? "confirmed" : status;

      if (!result.has(targetStatus)) {
        result.set(targetStatus, {
          status: targetStatus,
          count: 0,
          revenue: 0,
          platformFees: 0,
          percentage: "0",
          fill: getStatusColor(targetStatus),
        });
      }

      const existing = result.get(targetStatus)!;
      existing.count += item.count;
      existing.revenue += item.revenue;
      existing.platformFees += item.platformFees;
    });

    // Calculate percentages and convert to array
    const totalCount = Array.from(result.values()).reduce(
      (sum, s) => sum + s.count,
      0,
    );
    const array = Array.from(result.values()).map((item) => ({
      ...item,
      percentage:
        totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : "0",
    }));

    // Sort by meaningful order: pending -> confirmed -> completed
    const order: Record<string, number> = {
      pending: 1,
      confirmed: 2,
      completed: 3,
    };
    return array.sort(
      (a, b) => (order[a.status] || 99) - (order[b.status] || 99),
    );
  }, [data]);

  if (processedData.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader>
          <CardTitle>Bookings by Status</CardTitle>
          <CardDescription>
            Platform fee breakdown by booking status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No status data available yet.</p>
            <p className="text-sm mt-1">
              Status breakdown will appear once payments are processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle>Bookings by Status</CardTitle>
        <CardDescription>
          Platform fee breakdown by booking status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) =>
                  `${formatStatusName(status)} (${percentage}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="platformFees"
                nameKey="status"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => formatStatusName(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown list */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Status Breakdown
          </h4>
          {processedData.map((status) => (
            <div
              key={status.status}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.fill }}
                />
                <span>{formatStatusName(status.status)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {status.count} bookings
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(status.platformFees)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
