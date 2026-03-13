"use client";

import { TrendingUp, Star } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

export interface ServiceData {
  serviceId: number;
  serviceName: string;
  bookingCount: number;
  totalRevenue: number;
  completedCount: number;
  avgRating: string;
  percentage: string;
}

export interface ServicesChartProps {
  data: ServiceData[];
  totalBookings: number;
}

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-3))", // Purple
  },
} satisfies ChartConfig;

export function ServicesChart({ data, totalBookings }: ServicesChartProps) {
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

  // Sort by booking count and take top 5
  const topServices = [...data].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 5);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle>Top Services</CardTitle>
        <CardDescription>
          Your most booked services and their performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart
            accessibilityLayer
            data={topServices}
            layout="vertical"
            margin={{
              left: 0,
              right: 0,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid horizontal={true} strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="serviceName"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={100}
              className="text-muted-foreground text-sm"
              tickFormatter={(value) => (value.length > 12 ? `${value.slice(0, 12)}...` : value)}
            />
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="bookingCount"
              fill="var(--color-bookings)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>

        {/* Service Details List */}
        <div className="space-y-3 mt-4">
          {topServices.map((service, index) => (
            <div
              key={service.serviceId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{service.serviceName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{service.bookingCount} bookings</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(service.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{service.avgRating}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
