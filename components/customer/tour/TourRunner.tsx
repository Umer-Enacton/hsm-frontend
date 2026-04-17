"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Driver, DriveStep } from "driver.js";

// ---------------------------------------------------------------------------
// ExtendedDriveStep
// ---------------------------------------------------------------------------
// A thin superset of driver.js's DriveStep that adds one optional flag used
// by the tour system.  Driver.js ignores unknown properties, so passing an
// ExtendedDriveStep[] where DriveStep[] is expected is always safe at runtime.

export interface ExtendedDriveStep extends DriveStep {
  /**
   * When `true`, clicking the highlighted element automatically advances the
   * tour to the next step instead of requiring the user to press "Next".
   *
   * Pair this with `popover.showButtons: ["close"]` so there is no visible
   * "Next" button and the user is clearly guided to interact with the element.
   */
  __clickToAdvance?: boolean;
}

// ---------------------------------------------------------------------------
// useTourRunner options
// ---------------------------------------------------------------------------

interface UseTourRunnerOptions {
  onTourStart?: () => void;
  onTourEnd?: () => void;
  /**
   * Called whenever driver.js highlights a new step.
   * Receives the **absolute** step index in the original steps array
   * (i.e. `fromStep + relativeIndex`), so callers can always resume
   * from the exact position.
   */
  onStepChange?: (absoluteStepIndex: number) => void;
}

// ---------------------------------------------------------------------------
// useTourRunner hook
// ---------------------------------------------------------------------------

export function useTourRunner({
  onTourStart,
  onTourEnd,
  onStepChange,
}: UseTourRunnerOptions = {}) {
  const driverRef = useRef<Driver | null>(null);

  // ── Stable refs for callbacks ─────────────────────────────────────────────
  // Updating a ref during render is the recommended pattern when you need a
  // callback to always use its latest value inside long-lived closures (e.g.
  // driver.js event handlers) without re-creating those closures.
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  const onTourStartRef = useRef(onTourStart);
  onTourStartRef.current = onTourStart;

  const onTourEndRef = useRef(onTourEnd);
  onTourEndRef.current = onTourEnd;

  // ── destroyTour ───────────────────────────────────────────────────────────
  const destroyTour = useCallback(() => {
    if (driverRef.current) {
      try {
        driverRef.current.destroy();
      } catch {
        // driver may already be cleaned up — ignore
      }
      driverRef.current = null;
    }
    onTourEndRef.current?.();
  }, []);

  // ── startTour ─────────────────────────────────────────────────────────────
  const startTour = useCallback(
    async (steps: ExtendedDriveStep[], fromStep = 0) => {
      // Dynamic imports keep driver.js out of the server bundle entirely
      const [{ driver }] = await Promise.all([
        import("driver.js"),
        // @ts-expect-error – driver.js ships its own CSS without TS declarations
        import("driver.js/dist/driver.css"),
      ]);

      // Tear down any tour already in progress before starting a new one
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch {
          // ignore
        }
        driverRef.current = null;
      }

      const stepsToRun = fromStep > 0 ? steps.slice(fromStep) : steps;
      if (stepsToRun.length === 0) return;

      // ── Click-to-advance cleanup ref ──────────────────────────────────────
      // Holds a function that removes the current step's click listener.
      // Cleared on every step transition and on tour destroy.
      let clickToAdvanceCleanup: (() => void) | null = null;

      const teardownClickListener = () => {
        if (clickToAdvanceCleanup) {
          clickToAdvanceCleanup();
          clickToAdvanceCleanup = null;
        }
      };

      const driverObj = driver({
        showProgress: true,
        // Show progress relative to the full tour, not just the slice
        progressText: `{{current}} of ${steps.length}`,
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 8,
        allowClose: true,
        smoothScroll: true,
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done ✓",
        showButtons: ["next", "previous", "close"],
        popoverClass: "hsm-tour-popover",

        // ── Step tracking ──────────────────────────────────────────────────
        // `onHighlightStarted` fires as soon as driver.js begins transitioning
        // to a new step — before the highlight animation completes — giving us
        // the earliest possible moment to record the current position.
        onHighlightStarted: () => {
          // `getActiveIndex()` returns the 0-based index within `stepsToRun`.
          // We add `fromStep` to convert it back to an absolute index so the
          // caller can resume the full tour from exactly this point.
          const relIdx = driverObj.getActiveIndex() ?? 0;
          onStepChangeRef.current?.(fromStep + relIdx);
        },

        // ── Click-to-advance ───────────────────────────────────────────────
        // After the highlight animation completes, check whether the current
        // step has `__clickToAdvance: true`.  If so, wire a one-time click
        // listener on the highlighted element so that tapping it (e.g. a
        // hamburger menu button) automatically moves the tour forward instead
        // of requiring the user to press "Next".
        //
        // Any previously attached listener is cleaned up first, preventing
        // double-fires if the user navigates back to a click-to-advance step.
        onHighlighted: () => {
          // Always remove any listener from the previous step first
          teardownClickListener();

          const relIdx = driverObj.getActiveIndex() ?? 0;
          const currentStep = stepsToRun[relIdx] as ExtendedDriveStep;

          if (!currentStep?.__clickToAdvance) return;

          const selector =
            typeof currentStep.element === "string"
              ? currentStep.element
              : null;
          if (!selector) return;

          const el = document.querySelector(selector);
          if (!el) return;

          const handleClick = () => {
            // Remove ourself so we never fire twice
            el.removeEventListener("click", handleClick);
            clickToAdvanceCleanup = null;

            // Allow the element's own click handler (e.g. open sidebar) to
            // complete its DOM work, then advance the tour.
            setTimeout(() => {
              try {
                if (driverObj.hasNextStep()) {
                  driverObj.moveNext();
                }
              } catch {
                // Tour may have been destroyed while the timeout was pending
              }
            }, 350);
          };

          el.addEventListener("click", handleClick);
          // Store a reference so we can remove it on step change or destroy
          clickToAdvanceCleanup = () =>
            el.removeEventListener("click", handleClick);
        },

        // ── Teardown ───────────────────────────────────────────────────────
        // driver.js calls `onDestroyStarted` before its own cleanup. We must
        // call `.destroy()` ourselves here to actually complete the teardown,
        // then clear our ref and notify the caller.
        onDestroyStarted: () => {
          // Always clean up click listener before the DOM context changes
          teardownClickListener();

          try {
            driverObj.destroy();
          } catch {
            // ignore
          }
          driverRef.current = null;
          onTourEndRef.current?.();
        },

        steps: stepsToRun,
      });

      driverRef.current = driverObj;
      onTourStartRef.current?.();
      driverObj.drive();
    },
    [],
  ); // no deps — all callbacks accessed via stable refs

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch {
          // ignore
        }
        driverRef.current = null;
      }
    };
  }, []);

  const isRunning = useCallback(() => driverRef.current !== null, []);

  return { startTour, destroyTour, isRunning };
}

// ---------------------------------------------------------------------------
// TourRunner — render-less component for consumers that prefer a JSX API.
// Most consumers should use the `useTourRunner` hook directly.
// ---------------------------------------------------------------------------

export function TourRunner() {
  return null;
}
