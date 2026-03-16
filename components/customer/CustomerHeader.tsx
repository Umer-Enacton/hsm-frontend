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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  Search,
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "@/components/common/Header";
import { useNotifications } from "@/lib/queries/use-notifications";
import { formatDistanceToNow } from "date-fns";

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
    { label: "Browse Services", href: "/customer/services", icon: Home },
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center gap-4 px-4">
        <div className="flex flex-1 items-center gap-4">
          {/* Logo */}
          <Link href="/customer" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
              <Image
                src="/homefixcareicon-removebg-preview-removebg-preview.png"
                alt="HomeFixCare"
                width={32}
                height={32}
                className="h-8 w-8 object-cover"
              />
            </div>
            <span className="hidden font-bold sm:inline-block">
              HomeFixCare
            </span>
          </Link>

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
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors w-full text-left",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Search */}
          {showSearch && (
            <div className="relative hidden max-w-sm flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search services..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

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
              <DropdownMenuContent align="end" className="w-80">
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
                        className={`flex flex-col items-start gap-1 py-3 hover:bg-muted ${
                          !n.isRead
                            ? "cursor-pointer"
                            : "cursor-default opacity-70"
                        }`}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // If already read, do nothing
                          if (n.isRead) {
                            return;
                          }

                          // Mark as read
                          await markAsRead([n.id]);

                          // Navigate only if not already on the target page
                          if (n.data?.actionUrl) {
                            const currentPath = pathname;
                            const targetPath = new URL(
                              n.data.actionUrl,
                              window.location.origin,
                            ).pathname;

                            if (currentPath !== targetPath) {
                              window.location.href = n.data.actionUrl;
                            }
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
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
                  <DropdownMenuItem onClick={onProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                  onClick={() => router.push("/customer/addresses")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Addresses
                </DropdownMenuItem> */}
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
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
