"use client";

/**
 * Payment Status Component
 * Displays payment status for a booking
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import type { Payment } from "@/types/payment";
import { cn } from "@/lib/utils";

interface PaymentStatusProps {
  payment?: Payment | null;
  paymentStatus?: string;
  className?: string;
  showLabel?: boolean;
}

export function PaymentStatus({
  payment,
  paymentStatus,
  className = "",
  showLabel = true,
}: PaymentStatusProps) {
  const status = payment?.status || paymentStatus || "pending";

  const getStatusConfig = () => {
    switch (status) {
      case "paid":
        return {
          label: "Paid",
          icon: CheckCircle2,
          className: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
          iconClassName: "text-green-600",
        };
      case "initiated":
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200",
          iconClassName: "text-yellow-600",
        };
      case "failed":
        return {
          label: "Failed",
          icon: XCircle,
          className: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
          iconClassName: "text-red-600",
        };
      case "refunded":
        return {
          label: "Refunded",
          icon: RefreshCw,
          className: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
          iconClassName: "text-blue-600",
        };
      default:
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
          iconClassName: "text-gray-600",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!showLabel) {
    return <Icon className={cn("h-4 w-4", config.iconClassName, className)} />;
  }

  return (
    <Badge className={cn("gap-1.5 font-medium", config.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

/**
 * Payment Amount Display Component
 */
interface PaymentAmountProps {
  amount: number; // Amount in paise
  currency?: string;
  className?: string;
}

export function PaymentAmount({ amount, currency = "₹", className = "" }: PaymentAmountProps) {
  const amountInRupees = (amount / 100).toFixed(2);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="font-semibold">{currency}</span>
      <span className="font-bold">{amountInRupees}</span>
    </div>
  );
}

/**
 * Payment Details Component
 * Shows detailed payment information
 */
interface PaymentDetailsProps {
  payment: Payment;
  className?: string;
}

export function PaymentDetails({ payment, className = "" }: PaymentDetailsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Status</span>
        <PaymentStatus payment={payment} />
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Amount</span>
        <PaymentAmount amount={payment.amount} className="text-lg" />
      </div>

      {/* Payment Method */}
      {payment.paymentMethod && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment Method</span>
          <span className="font-medium capitalize">{payment.paymentMethod}</span>
        </div>
      )}

      {/* Payment ID */}
      {payment.razorpayPaymentId && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment ID</span>
          <span className="font-mono text-sm">{payment.razorpayPaymentId}</span>
        </div>
      )}

      {/* Order ID */}
      {payment.razorpayOrderId && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Order ID</span>
          <span className="font-mono text-sm">{payment.razorpayOrderId}</span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Created On</span>
        <span className="text-sm">
          {new Date(payment.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Refund Details */}
      {payment.status === "refunded" && payment.refundId && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Refund ID</span>
            <span className="font-mono text-sm">{payment.refundId}</span>
          </div>
          {payment.refundAmount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Refund Amount</span>
              <PaymentAmount amount={payment.refundAmount} />
            </div>
          )}
          {payment.refundReason && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reason</span>
              <span className="text-sm">{payment.refundReason}</span>
            </div>
          )}
        </div>
      )}

      {/* Failure Reason */}
      {payment.status === "failed" && payment.failureReason && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm text-muted-foreground">Failure Reason</span>
            <span className="text-sm text-red-600 text-right max-w-[60%]">
              {payment.failureReason}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
