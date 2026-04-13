"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarProps } from "./Sidebar";
import { Header, HeaderProps } from "./Header";
import { Footer, FooterProps } from "./Footer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: SidebarProps;
  header?: HeaderProps;
  footer?: FooterProps;
  /** Show footer inside the dashboard shell */
  showFooter?: boolean;
  className?: string;
}

/**
 * Composes Sidebar + Header + Footer into a full dashboard shell.
 * Usage:
 *   <DashboardLayout sidebar={sidebarProps} header={headerProps}>
 *     <YourPageContent />
 *   </DashboardLayout>
 */
export function DashboardLayout({
  children,
  sidebar,
  header,
  footer,
  showFooter = false,
  className,
}: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div
      className={cn("flex h-screen overflow-hidden bg-background", className)}
    >
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        {...sidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        user={header?.user}
        onProfileClick={header?.onProfileClick}
        onSettingsClick={header?.onSettingsClick}
        onLogout={header?.onLogout}
      />

      {/* Mobile Sidebar Floating Action Button */}
      {!isMobileOpen && (
        <Button
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-lg shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 md:hidden transition-all hover:scale-105 active:scale-95 border-2 border-background"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {header && (
          <Header
            {...header}
            onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)}
          />
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Optional footer */}
        {<Footer compact {...footer} />}
      </div>
    </div>
  );
}

export default DashboardLayout;
