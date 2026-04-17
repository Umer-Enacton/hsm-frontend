"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  X,
  ArrowUpRight,
  Layers,
  Library,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useTourRunner } from "./TourRunner";
import {
  getToursByPage,
  TOURS_BY_ID,
  resolveSteps,
  type TourDefinition,
} from "./tours";
import { useBookings } from "@/lib/queries/use-bookings";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HELP_VISITED_KEY = "hsm-help-visited";
const TOUR_RESUME_KEY = "hsm-tour-resume";

// ---------------------------------------------------------------------------
// sessionStorage helpers (all wrapped so SSR never touches window)
// ---------------------------------------------------------------------------

interface ResumeState {
  tourId: string;
  step: number;
  /** The exact pathname the step was on so we redirect back correctly. */
  redirectTo: string;
}

function saveResume(state: ResumeState): void {
  try {
    sessionStorage.setItem(TOUR_RESUME_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

function loadResume(): ResumeState | null {
  try {
    const raw = sessionStorage.getItem(TOUR_RESUME_KEY);
    return raw ? (JSON.parse(raw) as ResumeState) : null;
  } catch {
    return null;
  }
}

function clearResume(): void {
  try {
    sessionStorage.removeItem(TOUR_RESUME_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// HelpButton
//
// Route-change resume design (mirrors CustomerTour.tsx)
// ─────────────────────────────────────────────────────
// This component lives inside the persistent customer layout so it stays
// mounted across all client-side route changes.
//
// Three refs coordinate the resume behaviour:
//
//   activeTourRef     — { tour, step } of the running tour (null when idle).
//                       step is kept current via the onStepChange callback.
//
//   pathnameRef       — always mirrors the latest pathname so callbacks
//                       (driver.js event handlers) can read it without
//                       stale-closure issues.
//
//   intentionalNavRef — set to true whenever handleTourSelect calls
//                       router.push() itself. The pathname effect checks this
//                       flag and skips the resume path so we don't double-start.
//
// sessionStorage key TOUR_RESUME_KEY is written on every step change and
// cleared when the tour ends normally (done / dismissed) or after a
// successful resume. It survives full page refreshes, giving us a persistent
// "bookmark" we can use to redirect the user back if they navigate away.
// ---------------------------------------------------------------------------

export function HelpButton() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  // Lazy initializer reads localStorage once on the client (no useEffect
  // needed — avoids the "setState inside effect" React Compiler lint rule).
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(HELP_VISITED_KEY);
  });

  const [isTourRunning, setIsTourRunning] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────

  const activeTourRef = useRef<{ tour: TourDefinition; step: number } | null>(
    null,
  );

  // Initialised to the current pathname so the first effect run is a no-op.
  const prevPathnameRef = useRef<string>(pathname);

  // Keeps the latest pathname accessible inside callbacks (e.g. handleStepChange)
  // without stale-closure issues. Initialised to the mount-time pathname;
  // kept current inside the pathname useEffect (never written during render).
  const pathnameRef = useRef<string>(pathname);

  // Set to true when handleTourSelect itself triggers a router.push so the
  // pathname effect knows not to kick off a second resume attempt.
  const intentionalNavRef = useRef<boolean>(false);

  // ── Booking data (for conditional tour gating) ────────────────────────────

  const { data: bookingsData } = useBookings({
    pagination: { page: 1, limit: 100 },
  });

  const bookings = bookingsData?.bookings ?? [];
  const hasConfirmedBookings = bookings.some((b) => b.status === "confirmed");
  const hasCompletedBookings = bookings.some((b) => b.status === "completed");

  const { thisPage, otherPages } = getToursByPage(pathname, {
    hasConfirmedBookings,
    hasCompletedBookings,
  });

  // ── Stable tour-runner callbacks ──────────────────────────────────────────
  // useCallback with empty deps → referentially stable → startTour never
  // gets recreated → the pathname useEffect dep array stays stable.

  const handleTourStart = useCallback(() => {
    setIsTourRunning(true);
  }, []);

  const handleTourEnd = useCallback(() => {
    setIsTourRunning(false);
    activeTourRef.current = null;
    // Tour ended normally (Done / ✕) — no resume needed
    clearResume();
  }, []);

  const handleStepChange = useCallback((absoluteStep: number) => {
    if (!activeTourRef.current) return;
    activeTourRef.current.step = absoluteStep;
    // Persist so any subsequent navigation can redirect back and resume
    saveResume({
      tourId: activeTourRef.current.tour.id,
      step: absoluteStep,
      redirectTo: pathnameRef.current, // actual page this step runs on
    });
  }, []);

  const { startTour } = useTourRunner({
    onTourStart: handleTourStart,
    onTourEnd: handleTourEnd,
    onStepChange: handleStepChange,
  });

  // ── Route-change effect ───────────────────────────────────────────────────
  // Runs after every pathname change.
  //
  // Case A — user navigated AWAY mid-tour:
  //   sessionStorage has a saved state, current pathname ≠ redirectTo
  //   → router.push(redirectTo) sends them back
  //
  // Case B — user arrived on the correct page (after Case A redirect, or
  //   after a manual back-then-forward):
  //   pathname === redirectTo
  //   → poll until target element is in the DOM, then resume
  //
  // The polling function is defined inline (not as a useCallback) to avoid
  // the React Compiler's "accessed before declared" error on self-referential
  // callbacks — this mirrors the attemptResume() pattern in CustomerTour.tsx.
  useEffect(() => {
    // Update both refs at the top so callbacks always see the latest pathname
    pathnameRef.current = pathname;

    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // No real navigation (initial mount where prev === pathname)
    if (prev === pathname) return;

    // handleTourSelect owns this navigation — it will start the tour itself
    if (intentionalNavRef.current) return;

    const saved = loadResume();
    if (!saved) return;

    const tour = TOURS_BY_ID[saved.tourId];
    if (!tour) {
      clearResume();
      return;
    }

    if (pathname !== saved.redirectTo) {
      // ── Case A: wrong page — redirect the user back ───────────────────
      console.log(
        `[HelpTour] Navigated away during tour step ${saved.step}. ` +
          `Redirecting back to ${saved.redirectTo}…`,
      );
      router.push(saved.redirectTo);
      return;
    }

    // ── Case B: correct page — poll until element is ready, then resume ──
    console.log(
      `[HelpTour] Back on correct page. Resuming "${tour.id}" at step ${saved.step}…`,
    );

    const { step } = saved;

    // Inline recursive poll — retries every 500 ms for up to 10 seconds.
    // Matches the attemptResume() helper in CustomerTour.tsx exactly.
    const resume = (attempts = 0) => {
      if (attempts > 20) {
        console.warn(
          `[HelpTour] Target element for step ${step} of "${tour.id}" ` +
            "never appeared after 20 attempts — giving up.",
        );
        clearResume();
        return;
      }

      const stepDef = resolveSteps(tour)[step];
      const selector =
        typeof stepDef?.element === "string" ? stepDef.element : null;

      // Steps with no element selector render as a centred overlay and are
      // always considered "ready".
      const isReady = !selector || !!document.querySelector(selector);

      if (!isReady) {
        setTimeout(() => resume(attempts + 1), 500);
        return;
      }

      console.log(
        `[HelpTour] Element found — resuming at step ${step} (attempt ${attempts + 1}).`,
      );
      clearResume(); // consumed; prevents accidental double-resume
      activeTourRef.current = { tour, step };
      startTour(resolveSteps(tour), step);
    };

    resume();
  }, [pathname, router, startTour]);

  // ── First-visit pulse ─────────────────────────────────────────────────────

  const dismissPulse = useCallback(() => {
    if (isFirstVisit) {
      setIsFirstVisit(false);
      try {
        localStorage.setItem(HELP_VISITED_KEY, "true");
      } catch {
        // Private browsing — ignore
      }
    }
  }, [isFirstVisit]);

  // ── Tour selection handler ────────────────────────────────────────────────

  const handleTourSelect = useCallback(
    (tour: TourDefinition) => {
      setOpen(false);
      dismissPulse();

      const isOnDetailPage =
        pathname.startsWith("/customer/services/") &&
        pathname !== "/customer/services/";

      const isOnTargetPage =
        tour.id === "book-service"
          ? isOnDetailPage
          : pathname === tour.targetPath ||
            (tour.targetPath.endsWith("/") &&
              pathname.startsWith(tour.targetPath));

      // ── Special case: "Book a Service" needs a specific service detail page
      if (tour.id === "book-service" && !isOnDetailPage) {
        router.push("/customer/services");
        toast.info(
          "Open any service and tap the help button to start the booking tour.",
          { duration: 5000 },
        );
        return;
      }

      // Clear any stale resume state before starting fresh
      clearResume();

      // The redirect target for sessionStorage: the page the tour actually runs on
      const redirectTo = isOnTargetPage ? pathname : tour.targetPath;
      activeTourRef.current = { tour, step: 0 };

      // Pre-save so a navigation between now and the first onStepChange
      // is still recoverable
      saveResume({ tourId: tour.id, step: 0, redirectTo });

      if (isOnTargetPage) {
        // Already here — short delay lets the popover close and unmount
        // cleanly before driver.js mounts its overlay
        setTimeout(() => {
          startTour(resolveSteps(tour), 0);
        }, 300);
      } else {
        // We're navigating ourselves — flag it so the pathname effect skips
        intentionalNavRef.current = true;
        router.push(tour.targetPath);
        setTimeout(() => {
          intentionalNavRef.current = false;
          startTour(resolveSteps(tour), 0);
        }, 700);
      }
    },
    [pathname, router, startTour, dismissPulse],
  );

  // Hide the button while a tour is running so it never overlaps the overlay
  if (isTourRunning) return null;

  const hasTours = thisPage.length > 0 || otherPages.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Popover
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (val) dismissPulse();
        }}
      >
        {/* ── Trigger button ── */}
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="icon"
            aria-label="Help & Guided Tours"
            className={cn(
              "relative h-12 w-12 rounded-full shadow-lg",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-95 transition-all duration-200",
              // Attention pulse shown once to first-time visitors
              isFirstVisit && [
                "before:absolute before:inset-0 before:rounded-full",
                "before:animate-ping before:bg-primary/60 before:opacity-75",
              ],
            )}
          >
            {open ? (
              <X className="h-5 w-5 shrink-0" />
            ) : (
              <HelpCircle className="h-5 w-5 shrink-0" />
            )}
          </Button>
        </PopoverTrigger>

        {/* ── Popover panel ── */}
        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-80 p-0 shadow-xl border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/40">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">Guided Tours</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                Step-by-step walkthroughs for every feature
              </p>
            </div>
          </div>

          {/* Tour list */}
          <ScrollArea className="max-h-150">
            <div className="p-2 space-y-1">
              {/* This Page section */}
              {thisPage.length > 0 && (
                <section>
                  <SectionLabel icon={Layers}>This Page</SectionLabel>
                  <div className="space-y-0.5">
                    {thisPage.map((tour) => (
                      <TourMenuItem
                        key={tour.id}
                        tour={tour}
                        onSelect={handleTourSelect}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Divider */}
              {thisPage.length > 0 && otherPages.length > 0 && (
                <div className="mx-2 border-t my-1.5" />
              )}

              {/* All Guides section */}
              {otherPages.length > 0 && (
                <section>
                  <SectionLabel icon={Library}>All Guides</SectionLabel>
                  <div className="space-y-0.5">
                    {otherPages.map((tour) => (
                      <TourMenuItem
                        key={tour.id}
                        tour={tour}
                        onSelect={handleTourSelect}
                        isOtherPage
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {!hasTours && (
                <div className="py-10 text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No guided tours available right now.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer hint */}
          {otherPages.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 border-t bg-muted/20">
              <ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                Tours with this icon will navigate to the relevant page first
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionLabel
// ---------------------------------------------------------------------------

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
        {children}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TourMenuItem
// ---------------------------------------------------------------------------

interface TourMenuItemProps {
  tour: TourDefinition;
  onSelect: (tour: TourDefinition) => void;
  isOtherPage?: boolean;
}

function TourMenuItem({
  tour,
  onSelect,
  isOtherPage = false,
}: TourMenuItemProps) {
  const Icon = tour.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(tour)}
      className={cn(
        "w-full flex items-start gap-3 rounded-md px-2.5 py-2 text-left",
        "transition-colors duration-150 group",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {/* Icon badge */}
      <div
        className={cn(
          "mt-0.5 shrink-0 flex items-center justify-center",
          "h-7 w-7 rounded-md bg-muted",
          "group-hover:bg-background transition-colors duration-150",
        )}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-1">
          <span className="text-sm font-medium leading-tight">
            {tour.title}
          </span>
          {isOtherPage && (
            <ArrowUpRight
              className={cn(
                "h-3 w-3 shrink-0",
                "text-muted-foreground group-hover:text-accent-foreground/70",
                "transition-colors duration-150",
              )}
              aria-label="Navigates to another page"
            />
          )}
        </span>
        <p
          className={cn(
            "text-xs leading-snug mt-0.5 line-clamp-2",
            "text-muted-foreground group-hover:text-accent-foreground/80",
            "transition-colors duration-150",
          )}
        >
          {tour.description}
        </p>
      </div>
    </button>
  );
}
