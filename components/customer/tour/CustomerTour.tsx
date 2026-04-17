"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAddresses } from "@/lib/queries/use-profile";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";

interface CustomerTourProps {
  userId?: number;
}

export function CustomerTour({ userId }: CustomerTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const [hasForcedAddress, setHasForcedAddress] = useState(false);
  const hasChecked = useRef(false);
  const driverRef = useRef<Driver | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);
  const clickListenerRef = useRef<((e: Event) => void) | null>(null);
  const resizeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTourActiveRef = useRef(false);
  const tourStartedRef = useRef(false);
  const currentStepRef = useRef<number>(0);
  const resumeStepRef = useRef<number | null>(null);

  // Check if user should see the address prompt and auto-start tour
  useEffect(() => {
    if (userId && !addressesLoading && !hasChecked.current && !tourStartedRef.current) {
      hasChecked.current = true;
      const tourKey = `customer_tour_seen_${userId}`;
      const hasSeenTour = localStorage.getItem(tourKey);
      const hasNoAddresses = !addresses || addresses.length === 0;

      if (!hasSeenTour && hasNoAddresses) {
        setHasForcedAddress(true);
        
        // Auto-start tour after a short delay
        setTimeout(() => {
          tourStartedRef.current = true;
          driverRef.current = setupTour();
          isTourActiveRef.current = true;
          
          clickListenerRef.current = handleInteraction;
          document.addEventListener("pointerdown", handleInteraction, true);
          document.addEventListener("pointerup", handleInteraction, true);
          
          driverRef.current.drive();
        }, 500);
      }
    }
  }, [userId, addresses, addressesLoading]);

  // Handle unexpected browser navigation (e.g. hitting the Back button)
  useEffect(() => {
    if (isTourActiveRef.current && driverRef.current) {
      const stepIndex = driverRef.current.getActiveIndex();
      
      // Step 3 and beyond require the user to be on the Profile page.
      if (stepIndex !== undefined && stepIndex >= 3) {
        if (!pathname.includes('/profile')) {
          console.log(">> Navigated away from profile during tour. Redirecting back to resume...");
          
          // Clean up broken tour
          if (clickListenerRef.current) {
            document.removeEventListener("pointerdown", clickListenerRef.current, true);
            document.removeEventListener("pointerup", clickListenerRef.current, true);
            clickListenerRef.current = null;
          }
          if (resizeIntervalRef.current) {
            clearInterval(resizeIntervalRef.current);
            resizeIntervalRef.current = null;
          }
          
          driverRef.current.destroy();
          driverRef.current = null;
          
          isTourActiveRef.current = false;
          
          // Bookmark to resume at Step 3 (Address Tab) 
          resumeStepRef.current = 3;
          
          // Redirect them right back
          router.push('/customer/profile');
        }
      }
    }
    
    // Start checking sessionStorage. This survives page loads and component unmounts.
      const savedStep = sessionStorage.getItem('hsm_tour_resume_step');
      if (savedStep && pathname.includes('/profile')) {
        const stepToResume = parseInt(savedStep, 10);
        console.log(">> Arrived back on profile. Resuming tour at step:", stepToResume);
        
        // Clear it so we don't accidentally resume again on normal page reloads
        sessionStorage.removeItem('hsm_tour_resume_step');
        
        const attemptResume = (attempts = 0) => {
          if (attempts > 20) {
            console.error(">> Tour failed to resume: target element never mounted.");
            return;
          }
          
          // Wait until the Profile data finishes fetching and the Address tab is actually in the DOM
          const targetIsReady = document.querySelector('[data-tour-address-tab]');
          if (!targetIsReady) {
            setTimeout(() => attemptResume(attempts + 1), 500);
            return;
          }
          
          console.log(">> Target element found! Synthesizing tour resume...");
          tourStartedRef.current = true;
          driverRef.current = setupTour();
          isTourActiveRef.current = true;
          
          clickListenerRef.current = handleInteraction;
          document.addEventListener("pointerdown", handleInteraction, true);
          document.addEventListener("pointerup", handleInteraction, true);
          
          driverRef.current.drive(stepToResume);
        };
        
        attemptResume();
      }
  }, [pathname]);

  const finishTour = () => {
    if (userId) {
      localStorage.setItem(`customer_tour_seen_${userId}`, "true");
    }
    setHasForcedAddress(false);
    isTourActiveRef.current = false;
    
    if (clickListenerRef.current) {
      document.removeEventListener("pointerdown", clickListenerRef.current, true);
      document.removeEventListener("pointerup", clickListenerRef.current, true);
      clickListenerRef.current = null;
    }
    if (resizeIntervalRef.current) {
      clearInterval(resizeIntervalRef.current);
      resizeIntervalRef.current = null;
    }
    
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  };

  const handleInteraction = (e: Event) => {
    if (!isTourActiveRef.current) return;
    
    const isPointerDown = e.type === 'pointerdown';
    const isPointerUp = e.type === 'pointerup';

    const targetEl = currentTargetRef.current;
    if (!targetEl) return;

    const targetTag = targetEl.tagName;
    const isStateStep = targetEl.hasAttribute('data-tour-state');
    const isCityStep = targetEl.hasAttribute('data-tour-city');
    const isStateOptionsStep = targetEl.hasAttribute('data-tour-state-options');
    const isCityOptionsStep = targetEl.hasAttribute('data-tour-city-options');
    const isProfileStep = targetEl.hasAttribute('data-tour-profile');

    console.log("=== CLICK DEBUG ===");
    console.log("isStateStep:", isStateStep);
    console.log("isCityStep:", isCityStep);
    console.log("isStateOptionsStep:", isStateOptionsStep);
    console.log("isCityOptionsStep:", isCityOptionsStep);
    console.log("Clicked element:", e.target?.tagName);
    
    // Step 6: State dropdown - advance when clicking on the dropdown (any part of it)
    if (isStateStep) {
      if (!isPointerDown) return;
      const clickedElement = e.target as HTMLElement;
      
      // Check if clicked element is inside the target (state dropdown)
      const isInsideTarget = targetEl.contains(clickedElement);
      
      console.log("Clicked on:", clickedElement.tagName);
      console.log("Is inside target dropdown?:", isInsideTarget);
      
      if (isInsideTarget) {
        console.log(">> State dropdown clicked, advancing...");
        setTimeout(() => {
          if (driverRef.current && driverRef.current.hasNextStep()) {
            driverRef.current.moveNext();
          }
        }, 500);
        return;
      }
      console.log(">> Waiting for state dropdown click...");
      return;
    }

    // Step 6a: Select state from options - must select an option
    if (isStateOptionsStep) {
      if (!isPointerUp) return;
      const clickedElement = e.target as HTMLElement;
      const selectItem = clickedElement.closest('[role="option"]');
      
      if (selectItem) {
        console.log(">> Selected a state, advancing...");
        setTimeout(() => {
          if (driverRef.current && driverRef.current.hasNextStep()) {
            driverRef.current.moveNext();
          }
        }, 300);
        return;
      }
      
      // If clicked outside the dropdown and not on the driver popover buttons,
      // the dropdown will close. We should move back to step 6.
      if (!targetEl.contains(clickedElement) && !clickedElement.closest('.driver-popover')) {
        console.log(">> Clicked outside state dropdown, going back...");
        setTimeout(() => {
          if (driverRef.current && driverRef.current.hasPreviousStep()) {
            driverRef.current.movePrevious();
          }
        }, 300);
      }
      
      // No advance if not clicking on an option
      console.log(">> Waiting for state selection...");
      return;
    }

    // Step 7: City dropdown - advance when clicking on the dropdown (any part of it)
    if (isCityStep) {
      if (!isPointerDown) return;
      const clickedElement = e.target as HTMLElement;
      
      // Check if clicked element is inside the target (city dropdown)
      const isInsideTarget = targetEl.contains(clickedElement);
      
      console.log("Clicked on:", clickedElement.tagName);
      console.log("Is inside target dropdown?:", isInsideTarget);
      
      if (isInsideTarget) {
        console.log(">> City dropdown clicked, advancing...");
        setTimeout(() => {
          if (driverRef.current && driverRef.current.hasNextStep()) {
            driverRef.current.moveNext();
          }
        }, 500);
        return;
      }
      console.log(">> Waiting for city dropdown click...");
      return;
    }

    // Step 7a: Select city from options - must select an option
    if (isCityOptionsStep) {
      if (!isPointerUp) return;
      const clickedElement = e.target as HTMLElement;
      const selectItem = clickedElement.closest('[role="option"]');
      
      if (selectItem) {
        console.log(">> Selected a city, advancing...");
        setTimeout(() => {
          if (driverRef.current && driverRef.current.hasNextStep()) {
            driverRef.current.moveNext();
          }
        }, 300);
        return;
      }
      
      // If clicked outside the dropdown and not on the driver popover buttons,
      // the dropdown will close. We should move back to step 7.
      if (!targetEl.contains(clickedElement) && !clickedElement.closest('.driver-popover')) {
        console.log(">> Clicked outside city dropdown, going back...");
        setTimeout(() => {
          if (driverRef.current && driverRef.current.hasPreviousStep()) {
            driverRef.current.movePrevious();
          }
        }, 300);
      }
      
      // No advance if not clicking on an option
      console.log(">> Waiting for city selection...");
      return;
    }

    // Step 2: Go to Profile - Bridge the cross-page navigation gracefully
    if (isProfileStep) {
      if (!isPointerDown) return;
      const clickedElement = e.target as HTMLElement;
      
      // If they clicked the Profile item in the dropdown
      if (clickedElement.closest('[data-tour-profile]')) {
        console.log(">> Profile clicked. Bridging navigation...");
        
        if (driverRef.current) {
          driverRef.current.destroy();
        }

        // Give the page time to route or remount if they are already there
        if (typeof window !== "undefined") {
          // Permanently bookmark the tour state into browser storage so we never lose it
          // When the tour re-initializes on the profile page, the Address Tab will strictly be at Index 1
          sessionStorage.setItem('hsm_tour_resume_step', "1");
          
          if (window.location.pathname.includes('/profile')) {
            // We are already on the profile page, pathname won't change, so trigger check manually
            const savedStep = sessionStorage.getItem('hsm_tour_resume_step');
            if (savedStep) {
              const stepToResume = parseInt(savedStep, 10);
              sessionStorage.removeItem('hsm_tour_resume_step');
              
              const attemptResumeInline = (attempts = 0) => {
                if (attempts > 20) return;
                const targetIsReadyInline = document.querySelector('[data-tour-address-tab]');
                if (!targetIsReadyInline) {
                  setTimeout(() => attemptResumeInline(attempts + 1), 500);
                  return;
                }
                tourStartedRef.current = true;
                driverRef.current = setupTour();
                isTourActiveRef.current = true;
                driverRef.current.drive(stepToResume);
              };
              attemptResumeInline();
            }
          }
        }
        return;
      }
    }

    // Ignore unhandled pointerup events for non-option steps
    if (!isPointerDown) {
      return;
    }

    // For input fields (step 5, 8), don't auto-advance - use Next button
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
      return;
    }

    // For body step (step 0), don't auto-advance
    if (targetTag === 'BODY') {
      return;
    }

    // Check if clicking on popover buttons
    const popoverBtn = (e.target as HTMLElement).closest('.driver-popover-next-btn, .driver-popover-prev-btn, .driver-popover-done-btn');
    if (popoverBtn) {
      return;
    }

    // For other steps, check if clicked inside the target element
    if (targetEl.contains(e.target as Node)) {
      console.log(">> Clicked on target element, advancing...");
      setTimeout(() => {
        if (driverRef.current && driverRef.current.hasNextStep()) {
          driverRef.current.moveNext();
        } else if (driverRef.current && driverRef.current.isLastStep()) {
          finishTour();
        }
      }, 500);
    }
  };

  // Setup the tour with driver.js
  const setupTour = (): Driver => {
    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      overlayOpacity: 0.52,
      stagePadding: 8,
      stageRadius: 8,
      allowClose: false,
      smoothScroll: true,
      nextBtnText: "",
      prevBtnText: "Back",
      doneBtnText: "Done",
      showButtons: ["previous"],
      popoverClass: "driver-popover-custom",
      onHighlighted: (element, step, options) => {
        console.log("=== STEP CHANGED ===");
        console.log("Step index:", step?.index);
        console.log("Step element selector:", step?.element);
        console.log("Actual element:", element?.tagName, element?.className);
        
        // Clean up previous interval if it exists
        if (resizeIntervalRef.current) {
          clearInterval(resizeIntervalRef.current);
          resizeIntervalRef.current = null;
        }

        // Store current target element
        currentTargetRef.current = element as HTMLElement | null;
        
        // Driver.js determines the overlay hole size on mount. Radix Select dropdowns 
        // animate in and aggressively shift position during scrolling in 'item-aligned' mode.
        // We use an interval to continuously refresh the highlight tracking so it 
        // perfectly follows and wraps the dropdown frame as it resizes and shifts.
        if (element && (step?.element === '[data-tour-state-options]' || step?.element === '[data-tour-city-options]')) {
          resizeIntervalRef.current = setInterval(() => {
            if (driverRef.current) {
              driverRef.current.refresh();
            }
          }, 50);
        }
      },
      steps: (() => {
        const isMobile = window.innerWidth < 768;
        const isAlreadyOnProfile = window.location.pathname.includes('/profile');
        
        const steps: any[] = [
          {
            element: "body",
            popover: {
              title: "👋 Welcome to HomeFixCare!",
              description: "I'll guide you step by step to add your first address. Let's get started!",
              side: "top" as const,
              align: "center" as const,
              showButtons: ["previous", "next"] as any,
              nextBtnText: "Start Tour →",
              prevBtnText: "Skip Tour",
              onPrevClick: () => {
                finishTour();
              },
              onPopoverRender: (popover: any) => {
                if (popover.previousButton) {
                  popover.previousButton.style.display = "inline-block";
                  popover.previousButton.disabled = false;
                  popover.previousButton.classList.remove('driver-popover-btn-disabled');
                }
              }
            },
          }
        ];

        // Skip the profile navigation guidance if they are ALREADY on the profile page
        if (!isAlreadyOnProfile) {
          if (isMobile) {
            steps.push(
              {
                element: "[data-tour-mobile-menu]",
                popover: {
                  title: "📱 Open Menu",
                  description: "Click the floating menu button to open the sidebar",
                  side: "top" as const,
                  align: "start" as const,
                  showButtons: [] as any,
                },
              },
              {
                element: "[data-tour-mobile-profile-trigger]",
                popover: {
                  title: "👤 Open profile",
                  description: "Click on your profile section at the bottom of the menu",
                  side: "top" as const,
                  align: "center" as const,
                  showButtons: [] as any,
                },
              }
            );
          } else {
            steps.push(
              {
                element: "[data-tour-user-menu]",
                popover: {
                  title: "👤 Click your profile",
                  description: "Click on your name or avatar in the header to open the user menu",
                  side: "left" as const,
                  align: "center" as const,
                  showButtons: [] as any,
                },
              }
            );
          }

          steps.push(
            {
              element: "[data-tour-profile]",
              popover: {
                title: "📝 Go to Profile",
                description: "Click on 'Profile' in the dropdown menu",
                side: isMobile ? "top" : "left",
                align: "start" as const,
                showButtons: [] as any,
              },
            }
          );
        }

        steps.push(
          {
            element: "[data-tour-address-tab]",
            popover: {
              title: "📍 Open Addresses",
              description: "Click on the 'Addresses' tab to see your addresses",
              side: "bottom" as const,
              align: "center" as const,
              showButtons: [] as any,
            },
          },
          {
            element: "[data-tour-add-address]",
            popover: {
              title: "➕ Add New Address",
              description: "Click the 'Add New Address' button",
              side: "bottom" as const,
              align: "center" as const,
              showButtons: [] as any,
            },
          },
          {
            element: "[data-tour-street]",
            popover: {
              title: "🏠 Enter Street Address",
              description: "Type your house number, building, street area",
              side: "top" as const,
              align: "center" as const,
              showButtons: ["next"] as any,
              nextBtnText: "Next →",
            },
          },
          {
            element: "[data-tour-state]",
            popover: {
              title: "🗺️ Select State",
              description: "Click to open the state dropdown",
              side: "top" as const,
              align: "center" as const,
              showButtons: [] as any,
            },
          },
          {
            element: "[data-tour-state-options]",
            popover: {
              title: "🗺️ Choose State",
              description: "Select your state from the list",
              side: "bottom" as const,
              align: "center" as const,
              showButtons: [] as any,
            },
          },
          {
            element: "[data-tour-city]",
            popover: {
              title: "🏙️ Select City",
              description: "Click to open the city dropdown",
              side: "top" as const,
              align: "center" as const,
              showButtons: [] as any,
            },
          },
          {
            element: "[data-tour-city-options]",
            popover: {
              title: "🏙️ Choose City",
              description: "Select your city from the list",
              side: "bottom" as const,
              align: "center" as const,
              showButtons: [] as any,
            },
          },
          {
            element: "[data-tour-zip]",
            popover: {
              title: "📮 Enter PIN Code",
              description: "Enter your 6-digit postal code",
              side: "top" as const,
              align: "center" as const,
              showButtons: ["next"] as any,
              nextBtnText: "Next →",
            },
          },
          {
            element: "[data-tour-submit-address]",
            popover: {
              title: "✅ Save Address",
              description: "Click the button to save your address - you're almost done!",
              side: "top" as const,
              align: "center" as const,
              showButtons: ["next"] as any,
              nextBtnText: "Finish ✓",
            },
          }
        );

        return steps;
      })(),
    });

    return driverObj;
  };

  const handleSkip = () => {
    if (userId) {
      localStorage.setItem(`customer_tour_seen_${userId}`, "true");
    }
    setHasForcedAddress(false);
    isTourActiveRef.current = false;
    
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    if (clickListenerRef.current) {
      document.removeEventListener("pointerdown", clickListenerRef.current, true);
      document.removeEventListener("pointerup", clickListenerRef.current, true);
      clickListenerRef.current = null;
    }
    if (resizeIntervalRef.current) {
      clearInterval(resizeIntervalRef.current);
      resizeIntervalRef.current = null;
    }
  };

  if (!hasForcedAddress) {
    return null;
  }

  return null;
}

export function resetCustomerTour(userId: number) {
  localStorage.removeItem(`customer_tour_seen_${userId}`);
}