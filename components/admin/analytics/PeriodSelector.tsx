"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

const periods = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "6m", label: "6M" },
  { value: "12m", label: "12M" },
  { value: "all", label: "All" },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit max-w-full overflow-x-auto">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-all whitespace-nowrap",
            value === period.value
              ? "bg-background shadow-sm text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
