"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterProps {
  appName?: string;
  links?: FooterLink[];
  year?: number;
  right?: React.ReactNode;
  /** compact = single-line, great for dashboards */
  compact?: boolean;
  className?: string;
}

export function Footer({
  appName = "App",
  links = [],
  year = new Date().getFullYear(),
  right,
  compact = false,
  className,
}: FooterProps) {
  if (compact) {
    return (
      <footer
        className={cn(
          "flex h-12 shrink-0 items-center justify-between border-t bg-background px-4 md:px-6",
          className,
        )}
      >
        <p className="text-xs text-muted-foreground">
          © {year} {appName}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {right}
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("border-t bg-background", className)}>
      {links.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 md:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Separator />
        </>
      )}
      <div className="flex flex-col items-center justify-between gap-2 px-4 py-4 md:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          © {year} {appName}. All rights reserved.
        </p>
        {right && <div className="flex items-center gap-4">{right}</div>}
      </div>
    </footer>
  );
}

export default Footer;
