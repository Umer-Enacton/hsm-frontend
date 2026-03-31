"use client";

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
const formatStatusName = (status: any) => {
  if (typeof status !== "string" || !status) return String(status || "");
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const CustomTooltip = ({ active, payload }: any) => {
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

export function StatusChart({ data, totalPlatformFees }: StatusChartProps) {
  if (data.length === 0) {
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
                data={data}
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
                {data.map((entry, index) => (
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
          {data.map((status) => (
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
