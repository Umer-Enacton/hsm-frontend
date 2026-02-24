"use client";

import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface VerificationAlertProps {
  isVerified: boolean;
  businessName?: string;
}

export function VerificationAlert({ isVerified, businessName }: VerificationAlertProps) {
  if (isVerified) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Business Verified
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          Your business <strong>{businessName}</strong> is verified. You can add services and receive bookings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
      <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-pulse" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        Business Pending Verification
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-green-200 space-y-2">
        <p>
          Your business <strong>{businessName}</strong> is pending verification by the admin.
        </p>
        <div className="space-y-1 text-sm">
          <p className="font-medium">Until verification, you cannot:</p>
          <ul className="list-disc list-inside space-y-1 text-orange-900 dark:text-orange-100">
            <li>Add or manage services</li>
            <li>Receive bookings from customers</li>
            <li>Appear in public business listings</li>
          </ul>
        </div>
        <p className="text-xs text-orange-700 dark:text-orange-300">
          You will be notified once your business is verified. This usually takes 1-2 business days.
        </p>
      </AlertDescription>
    </Alert>
  );
}
