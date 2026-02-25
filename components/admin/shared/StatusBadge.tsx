import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

type Status = "active" | "pending" | "inactive" | "error" | "verified" | "suspended" | "rejected";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-300",
      icon: CheckCircle,
      defaultLabel: "Active",
    },
    verified: {
      className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-300",
      icon: CheckCircle,
      defaultLabel: "Verified",
    },
    pending: {
      className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300",
      icon: Clock,
      defaultLabel: "Pending",
    },
    inactive: {
      className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
      icon: XCircle,
      defaultLabel: "Inactive",
    },
    suspended: {
      className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
      icon: XCircle,
      defaultLabel: "Suspended",
    },
    rejected: {
      className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-300",
      icon: XCircle,
      defaultLabel: "Rejected",
    },
    error: {
      className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-300",
      icon: AlertCircle,
      defaultLabel: "Error",
    },
  } as const;

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {displayLabel}
    </Badge>
  );
}
