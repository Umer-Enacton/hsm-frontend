"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Driver, DriveStep } from "driver.js";

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
  const startTour = useCallback(async (steps: DriveStep[], fromStep = 0) => {
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

      // ── Teardown ───────────────────────────────────────────────────────
      // driver.js calls `onDestroyStarted` before its own cleanup. We must
      // call `.destroy()` ourselves here to actually complete the teardown,
      // then clear our ref and notify the caller.
      onDestroyStarted: () => {
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
  }, []); // no deps — all callbacks accessed via stable refs

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

/**
 * TourRunner — render-less component for consumers that prefer a JSX API.
 * Most consumers should use the `useTourRunner` hook directly.
 */
export function TourRunner() {
  return null;
}
