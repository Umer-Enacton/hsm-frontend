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
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>
              Overview of your booking statuses
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              Completion rate
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="flex-1">
            <ChartContainer config={chartConfig} className="h-[200px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={({ payload, ...props }) => {
                    return (
                      <text
                        cx={props.cx}
                        cy={props.cy}
                        x={props.x}
                        y={props.y}
                        textAnchor={props.textAnchor}
                        dominantBaseline={props.dominantBaseline}
                        fill="hsl(var(--foreground))"
                        className="text-xs font-medium"
                      >
                        {payload.percentage > 5 ? `${payload.percentage}%` : ""}
                      </text>
                    );
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item) => {
              const Icon = statusIcons[item.status as keyof typeof statusIcons] || AlertCircle;
              return (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/40">
            <div className="text-lg font-bold text-green-600">
              {data.find((d) => d.status === "completed")?.count || 0}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/40">
            <div className="text-lg font-bold text-orange-600">
              {data.find((d) => d.status === "pending")?.count || 0}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <div className="text-lg font-bold text-blue-600">
              {data.find((d) => d.status === "confirmed")?.count || 0}
            </div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
