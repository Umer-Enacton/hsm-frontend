"use client";

import { X, AlertCircle, Info, AlertTriangle, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type WarningType = "pending_verification" | "pending_payment" | "no_address" | "blocked_business" | "deactivated_service";

export interface WarningData {
  type: WarningType;
  title: string;
  message: string;
  icon?: "info" | "warning" | "alert" | "shield" | "credit" | "location";
  actionLabel?: string;
  actionHref?: string;
  onDismiss?: () => void;
}

interface WarningModalProps {
  warning: WarningData;
  onDismiss: () => void;
}

export function WarningModal({ warning, onDismiss }: WarningModalProps) {
  const IconComponent = getIconComponent(warning.icon || warning.type);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs animate-in slide-in-from-bottom-right">
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 shadow-xl">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full shrink-0">
              <IconComponent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                  {warning.title}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 -mr-1 -mt-1 shrink-0"
                  onClick={onDismiss}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                {warning.message}
              </p>

              {warning.actionLabel && warning.actionHref && (
                <a
                  href={warning.actionHref}
                  className="inline-block text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-200 dark:bg-amber-900/50 px-3 py-1.5 rounded-md hover:bg-amber-300 dark:hover:bg-amber-900 transition-colors"
                >
                  {warning.actionLabel}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getIconComponent(type: string) {
  switch (type) {
    case "info":
      return Info;
    case "warning":
      return AlertTriangle;
    case "alert":
      return AlertCircle;
    case "shield":
      return ShieldCheck;
    case "credit":
      return CreditCard;
    case "location":
      return MapPin;
    default:
      return AlertCircle;
  }
}
