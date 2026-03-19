"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeaderUser } from "./Header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  LucideIcon,
  ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface SidebarProps {
  /** Top nav links */
  navItems: NavItem[];
  /** Bottom utility links (settings, logout, etc.) */
  bottomItems?: NavItem[];
  /** Brand/logo area */
  logo?: React.ReactNode;
  /** App name shown when expanded */
  appName?: string;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  user?: HeaderUser;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
          : "text-muted-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge !== undefined && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar({
  navItems,
  bottomItems,
  logo,
  appName = "App",
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  className,
  isMobileOpen,
  onMobileClose,
  user,
  onProfileClick,
  onSettingsClick,
  onLogout,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] =
    React.useState(defaultCollapsed);

  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const toggle = () => {
    const next = !collapsed;
    if (!isControlled) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-50 md:relative",
          isMobileOpen ? "translate-x-0 w-[240px]" : "-translate-x-full w-[240px] md:translate-x-0",
          collapsed ? "md:w-[60px]" : "md:w-[240px]",
          className,
        )}
      >
        {/* Header / Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-3",
            collapsed ? "justify-center" : "gap-3 px-4",
          )}
        >
          {logo ?? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden">
              <Image
                src="/homefixcareicon-removebg-preview-removebg-preview.png"
                alt="HomeFixCare"
                width={32}
                height={32}
                className="h-8 w-8 object-cover"
              />
            </div>
          )}
          {!collapsed && (
            <span className="truncate text-base font-semibold tracking-tight">
              {appName}
            </span>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav
            className={cn("flex flex-col gap-1", collapsed ? "px-2" : "px-3")}
          >
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} onClick={onMobileClose} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom items */}
        {bottomItems && bottomItems.length > 0 && (
          <>
            <Separator />
            <nav
              className={cn(
                "flex flex-col gap-1 py-3",
                collapsed ? "px-2" : "px-3",
              )}
            >
              {bottomItems.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} onClick={onMobileClose} />
              ))}
            </nav>
          </>
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn(
            "absolute -right-3 top-[72px] z-10 h-6 w-6 rounded-full border bg-background shadow-md",
            "hover:bg-accent transition-transform duration-200 hidden md:flex items-center justify-center",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Mobile Profile Area */}
        {user && (
          <div className="mt-auto border-t p-3 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors text-left w-full">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="text-sm font-medium leading-none truncate">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate mt-1">{user.email}</span>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { onProfileClick?.(); onMobileClose?.(); }}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onSettingsClick?.(); onMobileClose?.(); }}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { onLogout?.(); onMobileClose?.(); }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────
export default Sidebar;
