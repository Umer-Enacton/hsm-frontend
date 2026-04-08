"use client";

import { Clock, Calendar, Sun, Moon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
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

export interface HourlyData {
  hour: string;
  hourLabel: string;
  bookingCount: number;
  fill: string;
}

export interface DailyData {
  day: string;
  dayLabel: string;
  bookingCount: number;
  fill: string;
}

export interface TimePatternsResponse {
  period: string;
  totalBookings: number;
  hourlyData: HourlyData[];
  dailyData: DailyData[];
  peakHour: { hour: string; count: number };
  peakDay: { day: string; count: number };
}

export interface TimePatternsChartProps {
  data: TimePatternsResponse;
}

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(263, 70%, 50%)", // Purple
  },
  morning: {
    label: "Morning (6AM-12PM)",
    color: "hsl(45, 93%, 47%)", // Amber
  },
  afternoon: {
    label: "Afternoon (12PM-6PM)",
    color: "hsl(263, 70%, 50%)", // Purple
  },
  evening: {
    label: "Evening (6PM-12AM)",
    color: "hsl(217, 91%, 60%)", // Blue
  },
  night: {
    label: "Night (12AM-6AM)",
    color: "hsl(240, 5%, 26%)", // Dark
  },
} satisfies ChartConfig;

const dayLabels: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export function TimePatternsChart({ data }: TimePatternsChartProps) {
  // Group hourly data by time of day for summary
  const morningBookings = data.hourlyData
    .filter((h) => parseInt(h.hour) >= 6 && parseInt(h.hour) < 12)
    .reduce((sum, h) => sum + h.bookingCount, 0);

  const afternoonBookings = data.hourlyData
    .filter((h) => parseInt(h.hour) >= 12 && parseInt(h.hour) < 18)
    .reduce((sum, h) => sum + h.bookingCount, 0);

  const eveningBookings = data.hourlyData
    .filter((h) => parseInt(h.hour) >= 18 && parseInt(h.hour) < 24)
    .reduce((sum, h) => sum + h.bookingCount, 0);

  const nightBookings = data.hourlyData
    .filter((h) => parseInt(h.hour) >= 0 && parseInt(h.hour) < 6)
    .reduce((sum, h) => sum + h.bookingCount, 0);

  const timeOfDayData = [
    { label: "Morning", bookings: morningBookings, icon: Sun, color: "bg-amber-100 text-amber-600" },
    { label: "Afternoon", bookings: afternoonBookings, icon: Clock, color: "bg-purple-100 text-purple-600" },
    { label: "Evening", bookings: eveningBookings, icon: Moon, color: "bg-blue-100 text-blue-600" },
    { label: "Night", bookings: nightBookings, icon: Moon, color: "bg-gray-100 text-gray-600" },
  ];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Time Patterns</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your busiest hours and days
            </CardDescription>
          </div>
          <div className="text-right sm:text-left">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {data.totalBookings}
            </div>
            <div className="text-xs text-muted-foreground">Total bookings</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time of Day Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {timeOfDayData.map((slot) => {
            const Icon = slot.icon;
            const percentage = data.totalBookings > 0
              ? ((slot.bookings / data.totalBookings) * 100).toFixed(0)
              : "0";
            return (
              <div
                key={slot.label}
                className="text-center p-2 sm:p-3 rounded-md bg-muted/30"
              >
                <div className="flex justify-center mb-1">
                  <div className={`rounded-full p-1.5 ${slot.color}`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="text-sm sm:text-base font-bold">{slot.bookings}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {slot.label}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Peak Hours Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Peak Hour</span>
            </div>
            <div className="text-lg font-bold text-amber-900">
              {data.peakHour.hour}
            </div>
            <div className="text-xs text-amber-700">
              {data.peakHour.count} bookings
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Peak Day</span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {dayLabels[data.peakDay.day] || data.peakDay.day}
            </div>
            <div className="text-xs text-purple-700">
              {data.peakDay.count} bookings
            </div>
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            Hourly Distribution
          </h4>
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart
              data={data.hourlyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hourLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={1}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="bookingCount" radius={[4, 4, 0, 0]}>
                {data.hourlyData.map((entry, index) => (
                  <Cell key={`hour-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Day of Week Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            Day of Week Distribution
          </h4>
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <BarChart
              data={data.dailyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="bookingCount" radius={[4, 4, 0, 0]}>
                {data.dailyData.map((entry, index) => (
                  <Cell key={`day-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
