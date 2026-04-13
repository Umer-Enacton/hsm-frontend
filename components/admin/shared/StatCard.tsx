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
  | "orange"
  | "cyan";

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
    card: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    title: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-500 dark:text-blue-400",
    value: "text-blue-900 dark:text-blue-100",
  },
  yellow: {
    card: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
    title: "text-yellow-700 dark:text-yellow-400",
    icon: "text-yellow-500 dark:text-yellow-400",
    value: "text-yellow-900 dark:text-yellow-100",
  },
  emerald: {
    card: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    title: "text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-500 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  purple: {
    card: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    title: "text-purple-700 dark:text-purple-400",
    icon: "text-purple-500 dark:text-purple-400",
    value: "text-purple-900 dark:text-purple-100",
  },
  red: {
    card: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800",
    title: "text-rose-700 dark:text-rose-400",
    icon: "text-rose-500 dark:text-rose-400",
    value: "text-rose-900 dark:text-rose-100",
  },
  orange: {
    card: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
    title: "text-orange-700 dark:text-orange-400",
    icon: "text-orange-500 dark:text-orange-400",
    value: "text-orange-900 dark:text-orange-100",
  },
  cyan: {
    card: "bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800",
    title: "text-cyan-700 dark:text-cyan-400",
    icon: "text-cyan-500 dark:text-cyan-400",
    value: "text-cyan-900 dark:text-cyan-100",
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
