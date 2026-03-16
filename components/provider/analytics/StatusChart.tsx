"use client";

import { CheckCircle2, Clock, XCircle, AlertCircle, Ban } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface StatusData {
  status: string;
  count: number;
  revenue: number;
  percentage: string;
  fill: string;
}

export interface StatusChartProps {
  data: StatusData[];
  totalBookings: number;
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(142, 76%, 36%)", // Green
  },
  confirmed: {
    label: "Confirmed",
    color: "hsl(217, 91%, 60%)", // Blue
  },
  pending: {
    label: "Pending",
    color: "hsl(38, 92%, 50%)", // Orange
  },
  cancelled: {
    label: "Cancelled",
    color: "hsl(0, 84%, 60%)", // Red
  },
  rejected: {
    label: "Rejected",
    color: "hsl(240, 5%, 26%)", // Dark gray
  },
} satisfies ChartConfig;

const statusIcons = {
  completed: CheckCircle2,
  confirmed: CheckCircle2,
  pending: Clock,
  cancelled: XCircle,
  rejected: Ban,
};

const statusLabels = {
  completed: "Completed",
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export function StatusChart({ data, totalBookings }: StatusChartProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  // Calculate completion rate
  const completedData = data.find((d) => d.status === "completed");
  const completionRate = completedData
    ? ((completedData.count / totalBookings) * 100).toFixed(1)
    : "0";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Booking Status</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Overview of your booking statuses
            </CardDescription>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              Completion rate
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col-reverse sm:flex-row items-center gap-4 sm:gap-6">
          {/* Legend - First on mobile, second on desktop */}
          <div className="w-full sm:flex-1 sm:max-w-[180px] grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1 sm:gap-y-2">
            {data.map((item) => {
              const Icon = statusIcons[item.status as keyof typeof statusIcons] || AlertCircle;
              return (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm font-bold">{item.count}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Donut Chart */}
          <div className="w-full sm:flex-1 sm:w-auto flex justify-center">
            <ChartContainer config={chartConfig} className="h-[160px] sm:h-[200px]">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
          <div className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/40">
            <div className="text-base sm:text-lg font-bold text-green-600">
              {data.find((d) => d.status === "completed")?.count || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-950/40">
            <div className="text-base sm:text-lg font-bold text-orange-600">
              {data.find((d) => d.status === "pending")?.count || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <div className="text-base sm:text-lg font-bold text-blue-600">
              {data.find((d) => d.status === "confirmed")?.count || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Confirmed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
