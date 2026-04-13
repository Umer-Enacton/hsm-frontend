"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bell,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  ChevronDown,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNotifications } from "@/lib/queries/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { usePathname, useRouter } from "next/navigation";
import { getUserData, getUserRole } from "@/lib/auth-utils";
import { UserRole } from "@/types/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  description?: string;
  read?: boolean;
  time?: string;
}

export interface HeaderUser {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  hasAddresses?: boolean;
}

export interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  user?: HeaderUser;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  actions?: React.ReactNode;
  className?: string;
  businessVerification?: boolean; // Business verification status
  planName?: string; // Current subscription plan name (Free, Pro, Premium)
  onMobileMenuToggle?: () => void;
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsMenu() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAsRead([]);
  };

  const handleNotificationClick = async (notification: any, e: React.MouseEvent) => {
    // Prevent default to avoid closing dropdown immediately
    e.preventDefault();
    e.stopPropagation();

    // Mark as read (even if already on target page)
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }

    // Get booking info from notification
    let actionUrl = notification.data?.actionUrl;
    const bookingId = notification.data?.bookingId;
    const policyType = notification.data?.policyType;

    // Get user role for role-based redirects
    const roleId = getUserRole();
    const rolePrefix = roleId === UserRole.ADMIN ? "/admin" : roleId === UserRole.PROVIDER ? "/provider" : roleId === UserRole.STAFF ? "/staff" : "/customer";

    // Fallback for policy update notifications - use role-based paths
    if (!actionUrl && policyType === "cancellation") {
      actionUrl = `${rolePrefix}/terms`;
    } else if (!actionUrl && policyType === "privacy") {
      actionUrl = `${rolePrefix}/privacy`;
    } else if (!actionUrl && policyType === "terms") {
      actionUrl = `${rolePrefix}/terms`;
    }

    // If actionUrl is relative, prepend role prefix
    if (actionUrl && !actionUrl.startsWith("http")) {
      const url = new URL(actionUrl, window.location.origin);
      const pathname = url.pathname;

      // Check if it's a policy page (privacy or terms at root)
      if (pathname === "/privacy" || pathname === "/terms") {
        actionUrl = `${rolePrefix}${pathname}`;
      }
    }

    if (!actionUrl) return;

    const targetPath = new URL(actionUrl, window.location.origin).pathname;

    // Check if already on this page
    if (pathname === targetPath) {
      // Already on page - just trigger event to switch tab + expand
      console.log("📌 Same page notification click, bookingId:", bookingId);
      window.dispatchEvent(new CustomEvent("booking-notification-click", {
        detail: { expand: bookingId ? parseInt(bookingId, 10) : null }
      }));
    } else {
      // Different page - smooth navigation using Next.js router
      const queryString = bookingId ? `?expand=${bookingId}` : "";
      const fullPath = `${targetPath}${queryString}`;
      console.log("📌 Navigating to:", fullPath);
      router.push(fullPath);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-80 md:align-end data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 py-3 hover:bg-muted cursor-pointer${
                !n.isRead ? "" : " opacity-70"
              }`}
              onClick={(e) => handleNotificationClick(n, e)}
            >
              <div className="flex w-full items-center gap-2">
                {!n.isRead && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <span className={cn("text-sm font-medium", n.isRead && "ml-3.5")}>
                  {n.title}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </div>
              {n.message && (
                <p className="ml-3.5 text-xs text-muted-foreground">
                  {n.message}
                </p>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({
  user,
  onProfileClick,
  onSettingsClick,
  onLogout,
  planName,
}: Pick<
  HeaderProps,
  "user" | "onProfileClick" | "onSettingsClick" | "onLogout" | "planName"
>) {
  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="py-5">
        <Button variant="ghost" className="flex h-9 items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start text-left sm:flex">
            <span className="text-sm font-medium leading-none">
              {user.name}
            </span>
            {user.role && (
              <span className="text-xs text-muted-foreground">{user.role}</span>
            )}
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{user.name}</p>
              {planName && <PlanBadge planName={planName} />}
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Verification Badge ───────────────────────────────────────────────────────────

function VerificationBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <Badge
      variant={isVerified ? "default" : "secondary"}
      className={cn(
        "gap-1.5",
        isVerified
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
      )}
    >
      {isVerified ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified
        </>
      ) : (
        <>
          <Clock className="h-3.5 w-3.5" />
          Pending
        </>
      )}
    </Badge>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────────

// Color palette for dynamic plan badges
const PLAN_COLORS = [
  { bg: "bg-zinc-100", text: "text-zinc-700", hover: "hover:bg-zinc-200", darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-300", border: "border-zinc-200", darkBorder: "dark:border-zinc-700" }, // Free/default
  { bg: "bg-purple-100", text: "text-purple-700", hover: "hover:bg-purple-200", darkBg: "dark:bg-purple-900/20", darkText: "dark:text-purple-400", border: "border-purple-200", darkBorder: "dark:border-purple-700" }, // Pro
  { bg: "bg-amber-100", text: "text-amber-700", hover: "hover:bg-amber-200", darkBg: "dark:bg-amber-900/20", darkText: "dark:text-amber-400", border: "border-amber-200", darkBorder: "dark:border-amber-700" }, // Premium
  { bg: "bg-blue-100", text: "text-blue-700", hover: "hover:bg-blue-200", darkBg: "dark:bg-blue-900/20", darkText: "dark:text-blue-400", border: "border-blue-200", darkBorder: "dark:border-blue-700" },
  { bg: "bg-green-100", text: "text-green-700", hover: "hover:bg-green-200", darkBg: "dark:bg-green-900/20", darkText: "dark:text-green-400", border: "border-green-200", darkBorder: "dark:border-green-700" },
  { bg: "bg-rose-100", text: "text-rose-700", hover: "hover:bg-rose-200", darkBg: "dark:bg-rose-900/20", darkText: "dark:text-rose-400", border: "border-rose-200", darkBorder: "dark:border-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700", hover: "hover:bg-cyan-200", darkBg: "dark:bg-cyan-900/20", darkText: "dark:text-cyan-400", border: "border-cyan-200", darkBorder: "dark:border-cyan-700" },
  { bg: "bg-orange-100", text: "text-orange-700", hover: "hover:bg-orange-200", darkBg: "dark:bg-orange-900/20", darkText: "dark:text-orange-400", border: "border-orange-200", darkBorder: "dark:border-orange-700" },
];

// Get consistent color based on plan name (same name always gets same color)
function getPlanColor(planName: string) {
  // Known plans get their specific colors
  const planUpper = planName.toUpperCase();
  if (planUpper === "FREE") return PLAN_COLORS[0]; // Zinc
  if (planUpper === "PRO") return PLAN_COLORS[1]; // Purple
  if (planUpper === "PREMIUM") return PLAN_COLORS[2]; // Amber

  // For unknown plans, use hash to pick consistent color
  let hash = 0;
  for (let i = 0; i < planName.length; i++) {
    hash = planName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PLAN_COLORS.length;
  return PLAN_COLORS[index];
}

function PlanBadge({ planName }: { planName?: string }) {
  if (!planName) return null;

  const planUpper = planName.toUpperCase();
  const color = getPlanColor(planName);

  return (
    <Badge
      className={cn(
        "gap-1.5 font-medium",
        color.bg,
        color.text,
        color.hover,
        color.darkBg,
        color.darkText,
        color.border,
        color.darkBorder
      )}
      variant="secondary"
    >
      {planUpper}
    </Badge>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export function Header({
  title,
  showSearch = false,
  searchPlaceholder = "Search…",
  onSearch,
  user,
  onProfileClick,
  onSettingsClick,
  onLogout,
  actions,
  className,
  businessVerification,
  planName,
  onMobileMenuToggle,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6",
        className,
      )}
    >
      {/* Mobile Logo */}
      <button 
        className="flex items-center md:hidden shrink-0 cursor-pointer p-0 bg-transparent border-none"
        onClick={onMobileMenuToggle}
        title="Toggle Menu"
      >
        <Image
          src="/homefixcareicon-removebg-preview-removebg-preview.png"
          alt="HomeFixCare Logo"
          width={32}
          height={32}
          className="h-8 w-8 object-cover"
        />
      </button>

      {title && (
        <h1 className="text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
      )}
      {/* Search block removed to declutter interface */}
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {businessVerification !== undefined && (
          <VerificationBadge isVerified={businessVerification} />
        )}
        {actions}
        <ThemeToggle />
        <NotificationsMenu />
        <div className="hidden md:block">
          <UserMenu
            user={user}
            onProfileClick={onProfileClick}
            onSettingsClick={onSettingsClick}
            onLogout={onLogout}
            planName={planName}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
