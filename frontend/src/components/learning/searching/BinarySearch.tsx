"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import SearchingControls from "./SearchingControl";

// In getDynamicSizing function:
const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 80,
      BOX_HEIGHT: 80,
      BOX_GAP: 20,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 20,
      TOTAL_BOX_SPACING: 80 + 20 + 10,
      POINTER_Y_OFFSET: 155,
      POINTER_X_OFFSET: 90,
    };
  } else {
    return {
      BOX_WIDTH: 55,
      BOX_HEIGHT: 55,
      BOX_GAP: 15,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 16,
      TOTAL_BOX_SPACING: 55 + 15 + 20,
      POINTER_Y_OFFSET: 185,
      POINTER_X_OFFSET: 105,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const BinarySearch: React.FC<SidebarProps> = ({
  isOpen,
  width,
}: SidebarProps) => {
  // Initial array (must be sorted for binary search)
  const initialArray = [8, 17, 31, 42, 65, 89];
  const [searchValue, setSearchValue] = useState<number>(42);
  const [foundIndex, setFoundIndex] = useState<number>(-1);

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(6);
  const [speed, setSpeed] = useState<number>(1);
  const [searchTarget, setSearchTarget] = useState<number>(42);
  const [searchTargetInput, setSearchTargetInput] = useState<string>("42");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAscending, setIsAscending] = useState<boolean>(true);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pointerRefs = useRef({
    low: useRef<HTMLDivElement>(null),
    mid: useRef<HTMLDivElement>(null),
    high: useRef<HTMLDivElement>(null),
  });
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({
    array,
    speed,
    isPlaying,
    searchValue,
    isAscending,
  });

  // Step management
  const currentStepRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(0);

  const [targetFound, setTargetFound] = useState<boolean>(false);
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const foundElementRef = useRef<HTMLDivElement>(null);

  const dynamicSizing = getDynamicSizing(array.length);
  const {
    BOX_WIDTH,
    BOX_HEIGHT,
    BOX_GAP,
    BOX_BORDER_RADIUS,
    BOX_FONT_SIZE,
    TOTAL_BOX_SPACING,
    POINTER_Y_OFFSET,
    POINTER_X_OFFSET,
  } = dynamicSizing;

  // Animations
  const highlightCurrentElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196f3",
      scale: 1.1,
      // boxShadow: "0 0 15px rgba(33, 150, 243, 0.5), 0 2px 12px rgba(33, 150, 243, 0.3)",
      duration: 0.8,
      ease: "power2.out",
    });

    return timeline;
  };

  const eliminateElements = (
    start: number,
    end: number,
    direction: "left" | "right"
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Calculate rotation direction based on which side is being eliminated
    const rotation = direction === "left" ? -15 : 15;

    for (let i = start; i <= end; i++) {
      const element = arrayElementsRef.current[i];
      if (element) {
        timeline.to(
          element,
          {
            backgroundColor: "#9e9e9e",
            borderColor: "#757575",
            y: 400,
            opacity: 0,
            rotation: rotation,
            duration: 0.6,
            ease: "power2.in",
            delay: (i - start) * 0, // Reduced delay for faster animation
          },
          `eliminate-${i}`
        );
      }
    }

    return timeline;
  };

  const handleSearchTargetChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setSearchTargetInput(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSearchTarget(numValue);
      setSearchValue(numValue); // Add this line
      propsRef.current.searchValue = numValue; // Add this line
      resetAnimation();
      setIsPlaying(false);
    }
  };

  const restoreElements = (
    mid: number,
    targetedMid: boolean
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    arrayElementsRef.current.forEach((element, index) => {
      if (element) {
        console.log("COLORRR => ", foundIndex, mid, targetedMid);
        timeline.to(
          element,
          {
            backgroundColor:
              index === mid && targetedMid ? "#d4edda" : "#f8f9fa",
            borderColor: index === mid && targetedMid ? "#c3e6cb" : "#e9ecef",
            y: 0,
            opacity: 0.8,
            scale: 1,
            rotation: 0,
            duration: 0.6,
            ease: "back.out(1.5)",
          },
          index * 0.05
        );
      }
    });

    // Add target box coloring during restoration - sync with the longest element animation
    const maxDelay = (arrayElementsRef.current.length - 1) * 0.05;
    timeline.call(
      () => {
        if (targetBoxRef.current) {
          gsap.to(targetBoxRef.current, {
            backgroundColor: targetedMid ? "#d4edda" : "#f8d7da",
            borderColor: targetedMid ? "#c3e6cb" : "#f5c6cb",
            scale: 1.1,
            duration: 0.6,
          });
        }
      },
      [],
      maxDelay
    ); // Start when the last element starts restoring

    return timeline;
  };

  const animateFoundElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();

    // Make the found element animation faster and smoother
    timeline
      .to(element, {
        backgroundColor: "#d4edda",
        borderColor: "#c3e6cb",
        scale: 1.15,
        boxShadow: "#757575",
        duration: 0.6,
        ease: "elastic.out(1.2, 0.5)",
      })
      .to(element, {
        scale: 1,
        backgroundColor: "#d4edda",
        boxShadow: "#757575",
        duration: 0.4,
        ease: "power2.out",
      });

    return timeline;
  };

  const animateNotFound = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Animate all elements to grey
    arrayElementsRef.current.forEach((element, index) => {
      if (element) {
        timeline.to(
          element,
          {
            backgroundColor: "#9e9e9e",
            borderColor: "#757575",
            duration: 1.0,
            ease: "power2.out",
          },
          index * 0.1
        );
      }
    });

    return timeline;
  };

  const resetElementAppearance = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#f8f9fa",
      borderColor: "#e9ecef",
      scale: 1,
      opacity: 0.8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      duration: 0.5,
      ease: "power2.out",
    });

    return timeline;
  };

  // Improved mid pointer logic functions:

  const animatePointerAppearance = (
    pointer: "low" | "mid" | "high",
    position: number
  ): gsap.core.Timeline => {
    const element = pointerRefs.current[pointer].current;
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();

    // Calculate position based on array index
    let actualPosition = position * (BOX_WIDTH + BOX_GAP) + BOX_WIDTH / 2;
    if (pointer === "low") {
      actualPosition -= 20; // Shift low pointer 20px to the left
    }

    // Set initial position (below the array)
    gsap.set(element, {
      x: actualPosition,
      y: 100, // Start below
      opacity: 0,
    });

    // Animate to final position
    timeline.to(element, {
      y: 0, // Move to final position above array
      opacity: 1,
      duration: 1.5,
      ease: "back.out(1.5)",
    });

    return timeline;
  };

  const movePointer = (
    pointer: "low" | "mid" | "high",
    position: number
  ): gsap.core.Timeline => {
    const element = pointerRefs.current[pointer].current;
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();

    // Calculate position based on array index
    let actualPosition = position * (BOX_WIDTH + BOX_GAP) + BOX_WIDTH / 2;
    if (pointer === "low") {
      actualPosition -= 20; // Shift low pointer 20px to the left
    }

    timeline.to(element, {
      x: actualPosition,
      duration: 1.0,
      ease: "power1.inOut",
    });

    return timeline;
  };

  // FIXED MID POINTER LOGIC - only moves vertically, always from below the correct element
  const animateMidPointer = (midPosition: number): gsap.core.Timeline => {
    const element = pointerRefs.current.mid.current;
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    const actualPosition = midPosition * (BOX_WIDTH + BOX_GAP) + BOX_WIDTH / 2;

    // Step 1: Instantly position horizontally at the target element and hide it
    timeline.to(element, {
      opacity: 0,
      x: actualPosition, // Position at the correct horizontal location
      y: 150,
      duration: 0.1, // Start below the array
      scale: 0.8,
      rotation: 0,
    });

    // INSERT_YOUR_CODE
    // timeline.to({}, { duration: 0.3 });
    // Step 2: Animate vertically from bottom to top with opacity
    timeline.to(element, {
      opacity: 1, // Become visible
      y: 0, // Move up to final position above array
      scale: 1, // Scale to normal size
      duration: 0.8,
      ease: "power1.inOut",
    });

    // Step 3: Subtle bounce effect
    timeline
      .to(element, {
        y: -5,
        duration: 0.3,
        ease: "power1.inOut",
      })
      .to(element, {
        y: 0,
        duration: 0.3,
        ease: "bounce.out",
      });

    return timeline;
  };

  const hideMidPointer = (): gsap.core.Timeline => {
    const element = pointerRefs.current.mid.current;
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();

    // Hide animation consistent with hidePointer function
    timeline.to(element, {
      y: -100,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in",
    });

    return timeline;
  };

  const hidePointer = (pointer: "low" | "mid" | "high"): gsap.core.Timeline => {
    const element = pointerRefs.current[pointer].current;
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      y: -100,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in",
    });

    return timeline;
  };

  // Play animation
  const playAnimation = (): void => {
    if (wasPausedRef.current && timelineRef.current) {
      timelineRef.current.play();
      wasPausedRef.current = false;
      return;
    }

    resetAnimation();
    setIsSearching(true);
    setFoundIndex(-1);

    const arr = [...array];
    const n = arr.length;
    const mainTimeline = gsap.timeline();
    mainTimeline.timeScale(propsRef.current.speed);
    currentStepRef.current = 0;

    // Initial setup - set initial state for all elements
    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
      // Set initial state for all elements
      arrayElementsRef.current.forEach((_, index) => {
        gsap.set(arrayElementsRef.current[index], {
          opacity: 0.8,
          y: 0,
          rotation: 0,
        });
      });
    });

    let stepIndex = 1;

    // Binary search algorithm - Pre-calculate all steps
    let low = 0;
    let high = n - 1;
    const searchSteps: Array<{
      low: number;
      high: number;
      mid: number;
      comparison: "found" | "go_right" | "go_left" | "not_found";
      eliminateStart?: number;
      eliminateEnd?: number;
      eliminateDirection?: "left" | "right";
      newLow?: number;
      newHigh?: number;
    }> = [];

    // Pre-calculate all binary search steps - FIXED FOR REVERSE SORTED ARRAYS
    let found = false;
    while (low <= high && !found) {
      const mid = Math.floor((low + high) / 2);

      if (arr[mid] === propsRef.current.searchValue) {
        searchSteps.push({
          low,
          high,
          mid,
          comparison: "found",
        });
        found = true;
      } else {
        // FIXED: Check sort order to determine comparison logic
        const shouldGoRight = propsRef.current.isAscending
          ? arr[mid] < propsRef.current.searchValue // Ascending: go right if mid is smaller
          : arr[mid] > propsRef.current.searchValue; // Descending: go right if mid is larger

        if (shouldGoRight) {
          // Search in the right half - eliminate left half
          searchSteps.push({
            low,
            high,
            mid,
            comparison: "go_right",
            eliminateStart: low,
            eliminateEnd: mid,
            eliminateDirection: "left",
            newLow: mid + 1,
            newHigh: high,
          });
          low = mid + 1;
        } else {
          // Search in the left half - eliminate right half
          searchSteps.push({
            low,
            high,
            mid,
            comparison: "go_left",
            eliminateStart: mid,
            eliminateEnd: high,
            eliminateDirection: "right",
            newLow: low,
            newHigh: mid - 1,
          });
          high = mid - 1;
        }
      }
    }

    if (!found) {
      searchSteps.push({
        low,
        high,
        mid: -1, // Invalid mid for not found case
        comparison: "not_found",
      });
    }

    // Show initial low and high pointers
    if (searchSteps.length > 0) {
      const firstStep = searchSteps[0];
      mainTimeline.add(
        animatePointerAppearance("low", firstStep.low),
        "step-0"
      );
      mainTimeline.add(
        animatePointerAppearance("high", firstStep.high),
        "step-0+=0.3"
      );
    }

    // Now animate each step
    searchSteps.forEach((step, stepIdx) => {
      const currentStep = stepIndex;
      const mid = step.mid;

      // Add step label
      mainTimeline.addLabel(`step-${stepIndex}`, "+=0.8");
      mainTimeline.call(() => {
        currentStepRef.current = stepIndex;
      });
      stepIndex++;

      if (step.comparison === "not_found") {
        // Handle not found case
        mainTimeline.add(animateNotFound(), `step-${currentStep}+=0.5`);

        // Make target box red
        mainTimeline.call(
          () => {
            if (targetBoxRef.current) {
              gsap.to(targetBoxRef.current, {
                backgroundColor: "#f8d7da",
                borderColor: "#f5c6cb",
                scale: 1.1,
                duration: 0.8,
              });
            }
          },
          [],
          `step-${currentStep}+=1.0`
        );
        return; // Skip rest of the steps
      }

      // FIXED MID POINTER ANIMATION - Use consistent animation
      mainTimeline.add(animateMidPointer(step.mid), `step-${currentStep}+=0.2`);

      // Highlight mid element
      mainTimeline.add(
        highlightCurrentElement(step.mid),
        `step-${currentStep}+=1.0`
      );

      // Pause for comparison
      mainTimeline.to({}, { duration: 1.0 }, `step-${currentStep}+=1.6`);

      if (step.comparison === "found") {
        // Mark as found
        mainTimeline.add(
          animateFoundElement(step.mid),
          `step-${currentStep}+=2.2`
        );

        mainTimeline.call(
          () => {
            console.log("COLORRrrrrR => ", step.mid);
            setFoundIndex(step.mid);
            setTargetFound(true);

            // Make target box green
            if (targetBoxRef.current) {
              gsap.to(targetBoxRef.current, {
                backgroundColor: "#d4edda",
                borderColor: "#c3e6cb",
                scale: 1.1,
                duration: 0.6,
              });
            }
          },
          [],
          `step-${currentStep}+=2.5`
        );
      } else {
        // Eliminate elements and move pointers
        if (
          step.eliminateStart !== undefined &&
          step.eliminateEnd !== undefined
        ) {
          mainTimeline.add(
            eliminateElements(
              step.eliminateStart,
              step.eliminateEnd,
              step.eliminateDirection!
            ),
            `step-${currentStep}+=2.2`
          );
        }

        // Move the appropriate pointer
        if (step.comparison === "go_right" && step.newLow !== undefined) {
          mainTimeline.add(
            movePointer("low", step.newLow),
            `step-${currentStep}+=2.8`
          );
        } else if (
          step.comparison === "go_left" &&
          step.newHigh !== undefined
        ) {
          mainTimeline.add(
            movePointer("high", step.newHigh),
            `step-${currentStep}+=2.8`
          );
        }

        // FIXED MID POINTER HIDING - Use consistent hiding
        mainTimeline.add(hideMidPointer(), `step-${currentStep}+=3.4`);
      }
    });

    // Calculate the final mid value for restoration
    let finalMid = -1;
    let targetedMid = false;
    for (let i = searchSteps.length - 1; i >= 0; i--) {
      if (searchSteps[i].mid !== undefined && searchSteps[i].mid !== -1) {
        finalMid = searchSteps[i].mid;
        break;
      }
    }
    if (finalMid !== -1 && arr[finalMid] === propsRef.current.searchValue) {
      targetedMid = true;
    }
    // Add restoration phase - all elements come back at the same time
    mainTimeline.add(restoreElements(finalMid, targetedMid), "+=1.5");

    // Hide all pointers at the end
    mainTimeline.add(hidePointer("low"), "+=0.8");
    mainTimeline.add(hidePointer("high"), "<0.3");
    mainTimeline.add(hidePointer("mid"), "<0.3");

    totalStepsRef.current = stepIndex;
    mainTimeline.addLabel("end");

    mainTimeline.call(() => {
      wasPausedRef.current = false;
      setIsPlaying(false);
      setIsSearching(false);
    });

    timelineRef.current = mainTimeline;
  };

  // Control functions
  // Replace the existing nextStep and previousStep functions with these fixed versions:

  const nextStep = (): void => {
    if (!timelineRef.current) {
      playAnimation();
      if (timelineRef.current) {
        (timelineRef.current as gsap.core.Timeline).pause();
        currentStepRef.current = 0;
        wasPausedRef.current = true;
      }
      return;
    }

    const timeline = timelineRef.current as gsap.core.Timeline;
    timeline.pause();

    // Reset all boxes to original state before highlighting new mid
    arrayElementsRef.current.forEach((element) => {
      if (element) {
        gsap.to(element, {
          backgroundColor: "#f8f9fa",
          borderColor: "#e9ecef",
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        });
      }
    });

    if (currentStepRef.current < totalStepsRef.current) {
      currentStepRef.current++;
      const targetLabel = `step-${currentStepRef.current}`;
      timeline.seek(targetLabel);
      timeline.timeScale(1); // Match normal animation speed
      timeline.pause();
      updateMidPointerVisibility(currentStepRef.current);

      // Check if this is the step before final (when target element should be colored)
      if (currentStepRef.current === totalStepsRef.current - 1) {
        // Calculate final mid for coloring
        const arr = [...array];
        let finalMid = -1;
        let targetedMid = false;
        let low = 0;
        let high = arr.length - 1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);

          if (arr[mid] === propsRef.current.searchValue) {
            finalMid = mid;
            targetedMid = true;
            break;
          } else {
            const shouldGoRight = propsRef.current.isAscending
              ? arr[mid] < propsRef.current.searchValue
              : arr[mid] > propsRef.current.searchValue;

            if (shouldGoRight) {
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
        }

        // Color the target box one step before final
        if (targetBoxRef.current) {
          gsap.to(targetBoxRef.current, {
            backgroundColor: targetedMid ? "#d4edda" : "#f8d7da",
            borderColor: targetedMid ? "#c3e6cb" : "#f5c6cb",
            scale: 1.1,
            duration: 0.8,
          });
        }
      }

      // Highlight the mid element for this step using highlightCurrentElement
      // Re-calculate mid for this step
      const arr = [...array];
      const n = arr.length;
      let low = 0;
      let high = n - 1;
      let step = 1;
      while (low <= high && step <= currentStepRef.current) {
        const mid = Math.floor((low + high) / 2);
        if (step === currentStepRef.current) {
          highlightCurrentElement(mid);
          break;
        }
        if (arr[mid] === propsRef.current.searchValue) {
          break;
        } else {
          const shouldGoRight = propsRef.current.isAscending
            ? arr[mid] < propsRef.current.searchValue
            : arr[mid] > propsRef.current.searchValue;
          if (shouldGoRight) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        step++;
      }
    } else {
      // Final step - seek to end and show final result
      timeline.seek("end");
      timeline.timeScale(1);
      timeline.pause();

      // Hide mid pointer
      if (pointerRefs.current.mid.current) {
        gsap.set(pointerRefs.current.mid.current, { opacity: 0 });
      }

      // Show final state with proper coloring
      const arr = [...array];
      let finalMid = -1;
      let targetedMid = false;

      // Find the final mid element that was targeted
      let low = 0;
      let high = arr.length - 1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (arr[mid] === propsRef.current.searchValue) {
          finalMid = mid;
          targetedMid = true;
          break;
        } else {
          const shouldGoRight = propsRef.current.isAscending
            ? arr[mid] < propsRef.current.searchValue
            : arr[mid] > propsRef.current.searchValue;

          if (shouldGoRight) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
      }

      // Apply final coloring
      arrayElementsRef.current.forEach((element, index) => {
        if (element) {
          gsap.to(element, {
            backgroundColor:
              index === finalMid && targetedMid ? "#d4edda" : "#f8f9fa",
            borderColor:
              index === finalMid && targetedMid ? "#c3e6cb" : "#e9ecef",
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
          });
        }
      });
    }
    wasPausedRef.current = true;
  };

  const previousStep = (): void => {
    if (!timelineRef.current) return;

    const timeline = timelineRef.current as gsap.core.Timeline;
    timeline.pause();

    // Reset all boxes to original state before highlighting new mid
    arrayElementsRef.current.forEach((element) => {
      if (element) {
        gsap.to(element, {
          backgroundColor: "#f8f9fa",
          borderColor: "#e9ecef",
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        });
      }
    });

    if (currentStepRef.current > 0) {
      // Check if we're going back from the step before final (reset target box color)
      if (currentStepRef.current === totalStepsRef.current - 1) {
        if (targetBoxRef.current) {
          gsap.to(targetBoxRef.current, {
            backgroundColor: "#f8f9fa",
            borderColor: "#e9ecef",
            scale: 1,
            duration: 0.8,
          });
        }
      }

      currentStepRef.current--;
      const targetLabel =
        currentStepRef.current === 0
          ? "step-0"
          : `step-${currentStepRef.current}`;
      timeline.seek(targetLabel);
      timeline.timeScale(1);
      timeline.pause();
      updateMidPointerVisibility(currentStepRef.current);

      // Highlight the mid element for this step using highlightCurrentElement
      const arr = [...array];
      const n = arr.length;
      let low = 0;
      let high = n - 1;
      let step = 1;
      while (low <= high && step <= currentStepRef.current) {
        const mid = Math.floor((low + high) / 2);
        if (step === currentStepRef.current) {
          highlightCurrentElement(mid);
          break;
        }
        if (arr[mid] === propsRef.current.searchValue) {
          break;
        } else {
          const shouldGoRight = propsRef.current.isAscending
            ? arr[mid] < propsRef.current.searchValue
            : arr[mid] > propsRef.current.searchValue;
          if (shouldGoRight) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        step++;
      }
    } else {
      timeline.seek("step-0");
      timeline.pause();
      if (pointerRefs.current.mid.current) {
        gsap.set(pointerRefs.current.mid.current, { opacity: 0 });
      }

      // Reset target box color when going back to initial step
      if (targetBoxRef.current) {
        gsap.to(targetBoxRef.current, {
          backgroundColor: "#f8f9fa",
          borderColor: "#e9ecef",
          scale: 1,
          duration: 0.8,
        });
      }
    }
    wasPausedRef.current = true;
  };

  // Helper function to update mid pointer visibility based on current step
  const updateMidPointerVisibility = (stepNumber: number): void => {
    if (!pointerRefs.current.mid.current) return;

    // Mid pointer should be visible during steps where binary search is actively comparing
    // Step 0 = initial state (no mid pointer)
    // Step 1+ = mid pointer should be visible during comparison steps

    if (stepNumber === 0) {
      // Initial step - hide mid pointer
      gsap.set(pointerRefs.current.mid.current, { opacity: 0 });
    } else {
      // During search steps - show mid pointer
      // We need to calculate the correct position for the mid pointer at this step
      calculateAndShowMidPointer(stepNumber);
    }
  };

  // Helper function to calculate and show mid pointer at correct position for given step
  const calculateAndShowMidPointer = (stepNumber: number): void => {
    if (!pointerRefs.current.mid.current) return;

    // Re-calculate the binary search steps to determine mid position at this step
    const arr = [...array];
    const n = arr.length;
    let low = 0;
    let high = n - 1;
    let currentStep = 1;

    while (low <= high && currentStep <= stepNumber) {
      const mid = Math.floor((low + high) / 2);

      if (currentStep === stepNumber) {
        // Show mid pointer at the correct position
        const actualPosition =
          mid *
            (getDynamicSizing(array.length).BOX_WIDTH +
              getDynamicSizing(array.length).BOX_GAP) +
          getDynamicSizing(array.length).BOX_WIDTH / 2;

        gsap.set(pointerRefs.current.mid.current, {
          opacity: 1,
          x: actualPosition,
          y: 0,
          scale: 1,
        });
        break;
      }

      if (arr[mid] === propsRef.current.searchValue) {
        break; // Found
      } else {
        const shouldGoRight = propsRef.current.isAscending
          ? arr[mid] < propsRef.current.searchValue
          : arr[mid] > propsRef.current.searchValue;

        if (shouldGoRight) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      currentStep++;
    }

    // If we've gone past the search steps, hide the mid pointer
    if (currentStep > stepNumber) {
      gsap.set(pointerRefs.current.mid.current, { opacity: 0 });
    }
  };

  const pauseAnimation = (): void => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      wasPausedRef.current = true;
    }
  };

  const resetAnimation = (): void => {
    setTargetFound(false);
    if (targetBoxRef.current) {
      gsap.to(targetBoxRef.current, {
        backgroundColor: "#f8f9fa",
        borderColor: "#e9ecef",
        scale: 1,
        duration: 0.5,
      });
    }
    if (foundElementRef.current) {
      foundElementRef.current.innerHTML = "";
    }
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    if (arrayElementsRef.current) {
      arrayElementsRef.current.forEach((element) => {
        if (element) {
          gsap.set(element, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            backgroundColor: "#f8f9fa",
            borderColor: "#e9ecef",
            opacity: 0.8,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          });
        }
      });
    }

    // Reset pointers to initial state (hidden, positioned below the array)
    if (pointerRefs.current.low.current) {
      gsap.set(pointerRefs.current.low.current, {
        opacity: 0,
        x: BOX_WIDTH / 2 - 20, // Position at first element with left offset
        y: 100, // Start below the array
      });
    }
    if (pointerRefs.current.mid.current) {
      gsap.set(pointerRefs.current.mid.current, {
        opacity: 0,
        x: BOX_WIDTH / 2, // Position at first element
        y: 100, // Start below the array
      });
    }
    if (pointerRefs.current.high.current) {
      gsap.set(pointerRefs.current.high.current, {
        opacity: 0,
        x: BOX_WIDTH / 2, // Position at first element
        y: 100, // Start below the array
      });
    }

    wasPausedRef.current = false;
    currentStepRef.current = 0;
    setFoundIndex(-1);
    setIsSearching(false);
  };

  // const previousStep = (): void => {
  //   if (!timelineRef.current) return;

  //   if (currentStepRef.current > 0) {
  //     currentStepRef.current--;
  //     const prevLabel =
  //       currentStepRef.current === 0
  //         ? "step-0"
  //         : `step-${currentStepRef.current}`;
  //     const temp = propsRef.current.speed;
  //     timelineRef.current.timeScale(propsRef.current.speed * 4);
  //     timelineRef.current.reverse();
  //     timelineRef.current.pause(prevLabel);
  //     if (timelineRef.current) {
  //       timelineRef.current.timeScale(temp);
  //     }
  //     wasPausedRef.current = true;
  //   }
  // };

  // Event handlers
  const handlePlay = (): void => {
    setIsPlaying(true);
    playAnimation();
  };

  const handlePause = (): void => {
    setIsPlaying(false);
    pauseAnimation();
  };

  const handleReset = (): void => {
    setIsPlaying(false);
    resetAnimation();
  };

  const handleNextStep = (): void => {
    nextStep();
  };

  const handlePreviousStep = (): void => {
    previousStep();
  };

  const handleArrayChange = (newArray: number[]): void => {
    // Ensure array is sorted for binary search
    const sortedArray = [...newArray].sort((a, b) =>
      isAscending ? a - b : b - a
    );
    setArray(sortedArray);
    setIsPlaying(false);
    resetAnimation();
  };

  const handleArraySizeChange = (newSize: number): void => {
    setArraySize(newSize);
  };

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
  };

  const handleSortOrderChange = (ascending: boolean): void => {
    setIsAscending(ascending);

    // Sort the array based on the new order
    const sortedArray = [...array].sort((a, b) => {
      if (ascending) {
        return a - b; // Ascending order
      } else {
        return b - a; // Descending order
      }
    });

    setArray(sortedArray);
    setIsPlaying(false);
    resetAnimation();
  };

  // Effects
  useEffect(() => {
    propsRef.current = { array, speed, isPlaying, searchValue, isAscending };
    if (timelineRef.current) {
      timelineRef.current.timeScale(speed);
    }
  }, [array, speed, isPlaying, searchValue, isAscending]);

  useEffect(() => {
    arrayElementsRef.current = arrayElementsRef.current.slice(0, array.length);
  }, [array]);

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      {/* Animation Container */}
      <div className="mb-8">
        <div
          ref={containerRef}
          className="binary-search-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            minHeight: "500px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Current Target Display */}
          <div
            ref={foundElementRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              pointerEvents: "none",
              zIndex: 999,
            }}
          >
            {/* This is where the animated element will be temporarily placed */}
          </div>
          <div
            ref={targetBoxRef}
            style={{
              width: `${BOX_WIDTH}px`,
              height: `${BOX_HEIGHT}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8f9fa",
              border: "2px solid #e9ecef",
              borderRadius: `${BOX_BORDER_RADIUS}px`,
              fontSize: `${BOX_FONT_SIZE}px`,
              fontWeight: "600",
              color: "black",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              marginBottom: "20px",
              opacity: 0.7,
            }}
          >
            {searchTarget}
          </div>

          {/* Array Elements */}
          <div
            className="array-container"
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 0,
              marginTop: "50px",
            }}
          >
            {array.map((value, index) => (
              <div
                key={`${index}-${value}`}
                ref={(el) => {
                  arrayElementsRef.current[index] = el;
                }}
                style={{
                  width: `${BOX_WIDTH}px`,
                  height: `${BOX_HEIGHT}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8f9fa",
                  border: "2px solid #e9ecef",
                  borderRadius: `${BOX_BORDER_RADIUS}px`,
                  fontSize: `${BOX_FONT_SIZE}px`,
                  fontWeight: "600",
                  color: "#212529",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  zIndex: 0,
                  position: "relative",
                  opacity: 0.8,
                }}
              >
                {value}
              </div>
            ))}
          </div>

          {/* Index Labels */}
          <div
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              marginTop: "8px",
            }}
          >
            {array.map((_, index) => (
              <div
                key={`index-${index}`}
                style={{
                  width: `${BOX_WIDTH}px`,
                  textAlign: "center",
                  fontSize: "14px",
                  color: "#6c757d",
                }}
              >
                {index}
              </div>
            ))}
          </div>

          {/* Pointer Indicators */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "80px",
              marginTop: "10px",
            }}
          >
            {/* Low Pointer */}
            <div
              ref={pointerRefs.current.low}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "20px solid #dc3545",
                  rotate: "180deg",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#ff6b6b",
                  marginTop: "4px",
                }}
              >
                Low
              </span>
            </div>

            {/* Mid Pointer */}
            <div
              ref={pointerRefs.current.mid}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "20px solid #4ecdc4",
                  rotate: "180deg",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4ecdc4",
                  marginTop: "4px",
                }}
              >
                Mid
              </span>
            </div>

            {/* High Pointer */}
            <div
              ref={pointerRefs.current.high}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0,
                transform: "translateX(-3000%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "20px solid #0d6efd",
                  rotate: "180deg",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#45b7d1",
                  marginTop: "4px",
                }}
              >
                High
              </span>
            </div>
          </div>

          {/* Search Input Controls */}
          <div
            className="mb-6 flex items-center justify-center gap-6"
            style={{ bottom: "20px", position: "relative" }}
          >
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Search Target
              </label>
              <input
                style={{ zIndex: 1 }}
                type="number"
                value={searchTargetInput}
                onChange={handleSearchTargetChange}
                placeholder="Enter target value"
                className="w-32 h-10 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500  [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <SearchingControls
        randomOnly={false}
        isOpen={isOpen}
        width={width}
        array={array}
        arraySize={arraySize}
        isAscending={isAscending}
        speed={speed}
        isPlaying={isPlaying}
        onArrayChange={handleArrayChange}
        onArraySizeChange={handleArraySizeChange}
        onSortOrderChange={handleSortOrderChange}
        onSpeedChange={handleSpeedChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        onNextStep={handleNextStep}
        onPreviousStep={handlePreviousStep}
      />
    </div>
  );
};

export default BinarySearch;

//helo helo
