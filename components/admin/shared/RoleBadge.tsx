import { Badge } from "@/components/ui/badge";

type Role = "admin" | "provider" | "customer";

interface RoleBadgeProps {
  role: Role;
  label?: string;
}

export function RoleBadge({ role, label }: RoleBadgeProps) {
  const roleConfig = {
    admin: {
      className: "bg-purple-100 text-purple-700 border-purple-300",
      defaultLabel: "Admin",
    },
    provider: {
      className: "bg-blue-100 text-blue-700 border-blue-300",
      defaultLabel: "Provider",
    },
    customer: {
      className: "bg-green-100 text-green-700 border-green-300",
      defaultLabel: "Customer",
    },
  } as const;

  const config = roleConfig[role];
  const displayLabel = label || config.defaultLabel;

  return <Badge className={config.className}>{displayLabel}</Badge>;
}
