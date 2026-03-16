"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, IndianRupee } from "lucide-react";

export interface AverageOrderValueData {
  date: string;
  avgOrderValue: number;
  bookingCount: number;
}

export interface AverageOrderValueChartProps {
  data: AverageOrderValueData[];
  period: string;
  overallAvg: number;
}

export function AverageOrderValueChart({
  data,
  period,
  overallAvg,
}: AverageOrderValueChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const isMonthly = dateStr.length === 7;
    if (isMonthly) {
      const [year, month] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortYear = year.slice(-2);
      return `${monthNames[parseInt(month) - 1]} '${shortYear}`;
    } else {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  // Calculate trend
  const hasTrend = data.length >= 2;
  const firstAvg = data.find(d => d.avgOrderValue > 0)?.avgOrderValue || 0;
  const lastAvg = [...data].reverse().find(d => d.avgOrderValue > 0)?.avgOrderValue || 0;
  const trend = hasTrend && firstAvg > 0
    ? ((lastAvg - firstAvg) / firstAvg) * 100
    : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Average Order Value
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Track average booking amount over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[280px]">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
            data={data}
            margin={{
              left: 0,
              right: 0,
              top: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
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
              tick={{ fill: "#3b82f6", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2">
                      <p className="text-sm font-medium">{formatDate(payload[0].payload.date)}</p>
                      <p className="text-sm text-blue-600">
                        Avg: {formatCurrency(payload[0].payload.avgOrderValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0].payload.bookingCount} bookings
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="avgOrderValue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 3 }}
              activeDot={{ r: 5 }}
              name="Average Order Value"
            />
          </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Overall Average</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">
              {formatCurrency(overallAvg)}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Trend</p>
            <p className={`text-base sm:text-lg font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Min/Max Stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Highest</p>
              <p className="text-xs sm:text-sm font-semibold text-green-600">
                {formatCurrency(Math.max(...data.map(d => d.avgOrderValue)))}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Lowest</p>
              <p className="text-xs sm:text-sm font-semibold text-orange-600">
                {formatCurrency(Math.min(...data.filter(d => d.avgOrderValue > 0).map(d => d.avgOrderValue)) || 0)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
