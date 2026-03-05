"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarProps } from "./Sidebar";
import { Header, HeaderProps } from "./Header";
import { Footer, FooterProps } from "./Footer";

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
  return (
    <div
      className={cn("flex h-screen overflow-hidden bg-background", className)}
    >
      {/* Sidebar */}
      <Sidebar {...sidebar} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {header && <Header {...header} />}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Optional footer */}
        {showFooter && footer && <Footer compact {...footer} />}
      </div>
    </div>
  );
}

export default DashboardLayout;
