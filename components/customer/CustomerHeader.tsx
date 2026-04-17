"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  LogOut,
  User,
  ChevronDown,
  Home,
  Calendar,
  MapPin,
  Star,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "@/components/common/Header";
import { useNotifications } from "@/lib/queries/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { getUserRole } from "@/lib/auth-utils";

interface CustomerHeaderProps {
  user?: HeaderUser;
  onProfileClick?: () => void;
  onLogout?: () => void;
  showSearch?: boolean;
}

// Theme Toggle Button
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
      data-tour-theme-toggle=""
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

export function CustomerHeader({
  user,
  onProfileClick,
  onLogout,
  showSearch = true,
}: CustomerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/customer", icon: Home },
    { label: "Browse Services", href: "/customer/services", icon: Settings },
    { label: "My Bookings", href: "/customer/bookings", icon: Calendar },
  ];

  const isActive = (href: string) => {
    if (href === "/customer") return pathname === "/customer";
    return pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center gap-4 px-4">
          <div className="flex flex-1 items-center gap-4">
            {/* Logo - Desktop */}
            <Link
              href="/customer"
              className="hidden md:flex items-center space-x-2"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
                <Image
                  src="/homefixcareicon-removebg-preview-removebg-preview.png"
                  alt="HomeFixCare"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-cover"
                />
              </div>
              <span className="font-bold">HomeFixCare</span>
            </Link>

            {/* Logo - Mobile */}
            <button
              data-tour-mobile-menu-btn=""
              className="flex md:hidden items-center space-x-2 cursor-pointer p-0 bg-transparent border-none"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              type="button"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
                <Image
                  src="/homefixcareicon-removebg-preview-removebg-preview.png"
                  alt="HomeFixCare"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-cover"
                />
              </div>
              <span className="hidden sm:inline-block font-bold">
                HomeFixCare
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  {...(item.href === "/customer/services"
                    ? { "data-tour-nav-browse": "" }
                    : {})}
                  {...(item.href === "/customer/bookings"
                    ? { "data-tour-nav-bookings": "" }
                    : {})}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
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
                <DropdownMenuContent align="center" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsRead([]);
                        }}
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
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 5).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className={`flex flex-col items-start gap-1 py-3 hover:bg-muted cursor-pointer${
                            !n.isRead ? "" : " opacity-70"
                          }`}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Mark as read (even if already on target page)
                            if (!n.isRead) {
                              await markAsRead([n.id]);
                            }

                            // Get booking info from notification
                            const actionUrl = n.data?.actionUrl;
                            const bookingId = n.data?.bookingId;
                            const policyType = n.data?.policyType;

                            // Get user role for role-based redirects
                            const roleId = getUserRole();
                            const rolePrefix =
                              roleId === 1
                                ? "/customer"
                                : roleId === 2
                                  ? "/provider"
                                  : roleId === 3
                                    ? "/admin"
                                    : "/staff";

                            // Fallback for policy update notifications - use role-based paths
                            let finalActionUrl = actionUrl;
                            if (!actionUrl && policyType === "privacy") {
                              finalActionUrl = `${rolePrefix}/privacy`;
                            } else if (!actionUrl && policyType === "terms") {
                              finalActionUrl = `${rolePrefix}/terms`;
                            } else if (
                              !actionUrl &&
                              policyType === "cancellation"
                            ) {
                              finalActionUrl = `${rolePrefix}/terms`;
                            }

                            if (!finalActionUrl) return;

                            const targetPath = new URL(
                              finalActionUrl,
                              window.location.origin,
                            ).pathname;

                            // Check if already on this page
                            if (pathname === targetPath) {
                              // Already on page - just trigger event to switch tab + expand
                              console.log(
                                "📌 Customer: Same page notification click, bookingId:",
                                bookingId,
                              );
                              window.dispatchEvent(
                                new CustomEvent("booking-notification-click", {
                                  detail: {
                                    expand: bookingId
                                      ? parseInt(bookingId, 10)
                                      : null,
                                  },
                                }),
                              );
                            } else {
                              // Different page - smooth navigation using Next.js router
                              const queryString = bookingId
                                ? `?expand=${bookingId}`
                                : "";
                              const fullPath = `${targetPath}${queryString}`;
                              console.log(
                                "📌 Customer: Navigating to:",
                                fullPath,
                              );
                              router.push(fullPath);
                            }
                          }}
                        >
                          <div className="flex w-full items-center gap-2">
                            {!n.isRead && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            )}
                            <span
                              className={`text-sm font-medium ${n.isRead ? "ml-3.5" : ""}`}
                            >
                              {n.title}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {n.message && (
                            <p className="ml-3.5 text-xs text-muted-foreground">
                              {n.message}
                            </p>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              {user ? (
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-2"
                        data-tour-user-menu
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden flex-col items-start text-left sm:flex">
                          <span className="text-sm font-medium leading-none">
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Customer
                          </span>
                        </div>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onProfileClick}
                        data-tour-profile
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
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
                </div>
              ) : (
                <div className="hidden md:block">
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Same approach as admin/provider */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[240px] flex-col border-r bg-card transition-all duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/homefixcareicon-removebg-preview-removebg-preview.png"
              alt="HomeFixCare"
              width={32}
              height={32}
              className="h-8 w-8 object-cover"
            />
          </div>
          <span className="truncate text-base font-semibold tracking-tight">
            HomeFixCare
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              {...(item.href === "/customer/services"
                ? { "data-tour-mobile-nav-browse": "" }
                : {})}
              {...(item.href === "/customer/bookings"
                ? { "data-tour-mobile-nav-bookings": "" }
                : {})}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full text-left",
                "hover:bg-accent hover:text-accent-foreground",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Mobile Profile Area at Bottom */}
        {user ? (
          <div className="mt-auto border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-accent cursor-pointer transition-colors text-left w-full"
                  data-tour-mobile-profile-trigger
                >
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="text-sm font-medium leading-none truncate">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate mt-1">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    onProfileClick?.();
                    setMobileMenuOpen(false);
                  }}
                  data-tour-profile
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="mt-auto border-t p-3">
            <Button asChild className="w-full">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile FAB - Same as admin/provider */}
      {!mobileMenuOpen && (
        <Button
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-lg shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 md:hidden transition-all hover:scale-105 active:scale-95 border-2 border-background"
          aria-label="Open sidebar"
          data-tour-mobile-menu
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
