import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

type StatCardVariant =
  | "default"
  | "blue"
  | "yellow"
  | "emerald"
  | "purple"
  | "red"
  | "orange";

const variantStyles: Record<
  StatCardVariant,
  { card: string; title: string; icon: string; value: string }
> = {
  default: {
    card: "",
    title: "text-muted-foreground",
    icon: "text-muted-foreground/50",
    value: "",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800",
    title: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-500 dark:text-blue-400",
    value: "text-blue-900 dark:text-blue-100",
  },
  yellow: {
    card: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800",
    title: "text-yellow-700 dark:text-yellow-400",
    icon: "text-yellow-500 dark:text-yellow-400",
    value: "text-yellow-900 dark:text-yellow-100",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800",
    title: "text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-500 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800",
    title: "text-purple-700 dark:text-purple-400",
    icon: "text-purple-500 dark:text-purple-400",
    value: "text-purple-900 dark:text-purple-100",
  },
  red: {
    card: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800",
    title: "text-red-700 dark:text-red-400",
    icon: "text-red-500 dark:text-red-400",
    value: "text-red-900 dark:text-red-100",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800",
    title: "text-orange-700 dark:text-orange-400",
    icon: "text-orange-500 dark:text-orange-400",
    value: "text-orange-900 dark:text-orange-100",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: StatCardVariant;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const styles = variantStyles[variant];

  return (
    <Card className={cn("p-2", styles.card, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <p className={cn("text-sm font-medium", styles.title)}>{title}</p>
            <p className={cn("text-2xl font-bold", styles.value)}>{value}</p>
            {change && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {trend && <TrendIcon className="h-3 w-3" />}
                {change}
              </p>
            )}
          </div>
          <Icon className={cn("h-8 w-8", styles.icon)} />
        </div>
      </CardContent>
    </Card>
  );
}
