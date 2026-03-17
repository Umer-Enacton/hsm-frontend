"use client";

import * as React from "react";
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
  Bell,
  Search,
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
    const actionUrl = notification.data?.actionUrl;
    const bookingId = notification.data?.bookingId;

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
}: Pick<
  HeaderProps,
  "user" | "onProfileClick" | "onSettingsClick" | "onLogout"
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
            <p className="text-sm font-medium">{user.name}</p>
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
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6",
        className,
      )}
    >
      {title && (
        <h1 className="text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
      )}
      {showSearch && (
        <div className="relative hidden max-w-sm flex-1 md:flex">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {businessVerification !== undefined && (
          <VerificationBadge isVerified={businessVerification} />
        )}
        {actions}
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu
          user={user}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

export default Header;
