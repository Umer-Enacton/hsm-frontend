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

export interface RevenueChartData {
  date: string;
  bookings: number;
  revenue: number;
  completed: number;
}

export interface RevenueChartProps {
  data: RevenueChartData[];
  period: string;
  totalRevenue: number;
  totalBookings: number;
}

export function RevenueChart({
  data,
  period,
  totalRevenue,
  totalBookings,
}: RevenueChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    // Check if date is in YYYY-MM format (monthly) or YYYY-MM-DD format (daily)
    const isMonthly = dateStr.length === 7; // YYYY-MM format

    if (isMonthly) {
      // Parse YYYY-MM format - show as "Mar '24"
      const [year, month] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortYear = year.slice(-2); // Last 2 digits of year
      return `${monthNames[parseInt(month) - 1]} '${shortYear}`;
    } else {
      // Parse YYYY-MM-DD format - show as "13 Mar"
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
  };

  // Format currency (revenue is in rupees from backend)
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
  const growth = hasGrowth
    ? ((data[data.length - 1].revenue - data[0].revenue) / (data[0].revenue || 1)) * 100
    : 0;

  // Calculate actual total bookings from chart data (including those with ₹0 revenue)
  const actualTotalBookings = data.reduce((sum, item) => sum + item.bookings, 0);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue & Bookings</CardTitle>
            <CardDescription>
              Track your earnings and booking trends over time
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {actualTotalBookings} booking{actualTotalBookings !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(value) => value.toString()}
              tick={{ fill: "#3b82f6", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2">
                      <p className="text-sm font-medium">{payload[0].payload.date}</p>
                      {payload.map((entry) => (
                        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {entry.dataKey === "revenue" ? formatCurrency(entry.value) : entry.value}
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
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-2 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-muted-foreground">Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-muted-foreground">Bookings</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
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
