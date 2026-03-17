"use client";

import { TrendingUp, Calendar } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface AdminRevenueChartData {
  date: string;
  bookings: number;
  revenue: number;
  completed: number;
  cumulativeRevenue?: number;
}

export interface AdminRevenueChartProps {
  data: AdminRevenueChartData[];
  period: string;
  totalPlatformFees: number;
  totalBookings: number;
}

export function AdminRevenueChart({
  data,
  period,
  totalPlatformFees,
  totalBookings,
}: AdminRevenueChartProps) {
  // Calculate proper tick values for bookings Y-axis (whole numbers only)
  const maxBookings = Math.max(...data.map(d => d.bookings), 5); // At least 5
  const bookingTicks = Array.from({ length: Math.min(maxBookings + 1, 10) }, (_, i) => i);

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
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) {
      return '₹0';
    }
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
  const growth = hasGrowth
    ? ((data[data.length - 1].revenue - data[0].revenue) / (data[0].revenue || 1)) * 100
    : 0;

  // Calculate actual total bookings from chart data
  const actualTotalBookings = data.reduce((sum, item) => sum + item.bookings, 0);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">Platform Revenue & Bookings</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Track your 5% platform fee earnings and booking trends over time
            </CardDescription>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(totalPlatformFees)}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              Your 5% from {actualTotalBookings} booking{actualTotalBookings !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[300px]">
            <ResponsiveContainer width="100%" height={250}>
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
              <linearGradient id="colorPlatformFee" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              yAxisId="revenue"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
              tick={{ fill: "#22c55e", fontSize: 11 }}
            />
            <YAxis
              yAxisId="bookings"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              ticks={bookingTicks}
              tickFormatter={(value) => Math.round(value).toString()}
              domain={[0, maxBookings]}
              tick={{ fill: "#3b82f6", fontSize: 10 }}
              width={35}
              interval="preserveStartEnd"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2">
                      <p className="text-sm font-medium">{payload[0].payload.date}</p>
                      {payload.map((entry) => (
                        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {entry.dataKey === "revenue" ? formatCurrency(Number(entry.value ?? 0)) : entry.value ?? 0}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              yAxisId="bookings"
              type="monotone"
              dataKey="bookings"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorBookings)"
              fillOpacity={1}
              name="Bookings"
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorPlatformFee)"
              fillOpacity={1}
              name="Platform Fees (₹)"
            />
          </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600"></div>
              <span className="text-muted-foreground">Platform Fees (5%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-600"></div>
              <span className="text-muted-foreground">Bookings</span>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-1">
            {hasGrowth && growth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            )}
            <span className={growth >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {growth >= 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
