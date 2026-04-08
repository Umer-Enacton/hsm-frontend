"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LockedChartCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onUpgrade?: () => void;
}

export function LockedChartCard({
  title,
  description,
  icon,
  onUpgrade,
}: LockedChartCardProps) {
  return (
    <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
              <Lock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
              Premium Feature
            </Badge>
          </div>
          {icon && (
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
              {icon}
            </div>
          )}
        </div>
        <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100 mt-3">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-purple-700 dark:text-purple-300">
          {description}
        </p>
        <div className="flex justify-center pt-2">
          <Button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md"
          >
            Upgrade to Premium
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
