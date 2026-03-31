"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface CumulativeRevenueData {
  date: string;
  cumulativeRevenue: number;
  cumulativeBookings: number;
}

export interface CumulativeRevenueChartProps {
  data: CumulativeRevenueData[];
  period: string;
  totalPlatformFees: number;
}

export function CumulativeRevenueChart({
  data,
  period,
  totalPlatformFees,
}: CumulativeRevenueChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const isMonthly = dateStr.length === 7;
    if (isMonthly) {
      const [year, month] = dateStr.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const shortYear = year.slice(-2);
      return `${monthNames[parseInt(month) - 1]} '${shortYear}`;
    } else {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    const rupees = value;
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    }
    if (rupees >= 1000) {
      return `₹${(rupees / 1000).toFixed(1)}K`;
    }
    return `₹${rupees}`;
  };

  // Calculate growth
  const hasGrowth = data.length >= 2;
  const startRevenue = data[0]?.cumulativeRevenue || 0;
  const endRevenue = data[data.length - 1]?.cumulativeRevenue || 0;
  const growth =
    hasGrowth && startRevenue > 0
      ? ((endRevenue - startRevenue) / startRevenue) * 100
      : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Cumulative Platform Fees
        </CardTitle>
        <CardDescription>
          Track your platform fee earnings growth over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={data}
            margin={{
              left: 0,
              right: 0,
              top: 10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
              tick={{ fill: "#22c55e", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-md shadow-lg p-2">
                      <p className="text-sm font-medium">
                        {formatDate(payload[0].payload.date)}
                      </p>
                      <p className="text-sm text-green-600">
                        Cumulative Fees:{" "}
                        {formatCurrency(payload[0].payload.cumulativeRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0].payload.cumulativeBookings} bookings
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeRevenue"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorCumulative)"
              fillOpacity={1}
              name="Cumulative Platform Fees"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Starting Balance</p>
            <p className="text-lg font-semibold">
              {formatCurrency(startRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(endRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Growth</p>
            <p
              className={`text-lg font-semibold ${growth >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {growth >= 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
