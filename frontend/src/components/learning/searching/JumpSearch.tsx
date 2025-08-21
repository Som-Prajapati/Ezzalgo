"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import SearchingControls from "./SearchingControl";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Search } from "lucide-react";

// Constants for sizing
const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 80,
      BOX_HEIGHT: 80,
      BOX_GAP: 14,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 20,
      ARROW_SIZE: 8,
      ARROW_FONT_SIZE: 16,
      TOTAL_BOX_SPACING: 80 + 14,
      ARROW_Y_OFFSET_DOWN: (80 * 2.4) / 2,
      ARROW_X_OFFSET: 80 / 2,
      IMAGE_HEIGHT: 120,
      IMAGE_WIDTH: 120,
      INDEX_FONT_SIZE: 14,
      INDEX_Y_OFFSET: 100,
      // SEARCH_LEFT constant for left arrow icon sizing
      SEARCH_LEFT: 40 * 1.3,
      // SEARCH_TOP constant for top arrow icon sizing
      SEARCH_TOP: -120,
      ARC_HEIGHT: 60,
    };
  } else {
    return {
      BOX_WIDTH: 55,
      BOX_HEIGHT: 55,
      BOX_GAP: 10,
      BOX_BORDER_RADIUS: 8,
      BOX_FONT_SIZE: 16,
      ARROW_SIZE: 6,
      ARROW_FONT_SIZE: 14,
      TOTAL_BOX_SPACING: 55 + 10,
      ARROW_Y_OFFSET_DOWN: (55 * 2.4) / 2,
      ARROW_X_OFFSET: 55 / 2,
      IMAGE_HEIGHT: 70,
      IMAGE_WIDTH: 70,
      INDEX_FONT_SIZE: 12,
      INDEX_Y_OFFSET: 70,
      SEARCH_LEFT: 27 * 1.3,
      SEARCH_TOP: -80,
      ARC_HEIGHT: 60,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const JumpSearch: React.FC<SidebarProps> = ({ isOpen, width }) => {
  // Fixed initial array to prevent hydration mismatch
  const getFixedInitialArray = () => [8, 17, 25, 31, 42, 65, 75, 89];
  const initialArray = getFixedInitialArray();

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(8);
  const [searchTarget, setSearchTarget] = useState<number>(42);
  const [searchTargetInput, setSearchTargetInput] = useState<string>("42");
  const [jumpSize, setJumpSize] = useState<number>(2);
  const [jumpSizeInput, setJumpSizeInput] = useState<string>("2");
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAscending, setIsAscending] = useState<boolean>(true);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const searchIconRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  // const searchIconRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ array, speed, searchTarget, jumpSize, isPlaying });

  // Add refs for step management
  const currentStepRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(0);
  const dynamicSizing = getDynamicSizing(array.length);

  const {
    BOX_WIDTH,
    BOX_HEIGHT,
    BOX_GAP,
    BOX_BORDER_RADIUS,
    BOX_FONT_SIZE,
    ARROW_SIZE,
    ARROW_FONT_SIZE,
    TOTAL_BOX_SPACING,
    ARROW_Y_OFFSET_DOWN,
    ARROW_X_OFFSET,
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
    INDEX_FONT_SIZE,
    INDEX_Y_OFFSET,
    SEARCH_LEFT,
    SEARCH_TOP,
    ARC_HEIGHT,
  } = dynamicSizing;

  // Animation functions (empty implementations)

  const slideElementTo = (
    element: HTMLElement,
    toX: number | string,
    toY: number | string = 0,
    duration: number = 0.5
  ): gsap.core.Tween => {
    return gsap.to(element, {
      x: toX,
      y: toY,
      duration,
      ease: "power1.inOut",
    });
  };

  const highlightBoxe = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196f3",
      boxShadow:
        "0 0 15px rgba(33, 150, 243, 0.3), 0 2px 12px rgba(33, 150, 243, 0.2)",
      duration: 0.3,
      ease: "power2.out",
    });

    return timeline;
  };

  const removeHighlight = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#f8f9fa",
      borderColor: "#e9ecef",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      duration: 0.3,
      ease: "power2.out",
    });

    return timeline;
  };

  // Sorted indicator animation
  const animateSortedIndicator = (
    indices: number | number[]
  ): gsap.core.Timeline => {
    const targetIndices = Array.isArray(indices) ? indices : [indices];
    const elements = targetIndices
      .map((index) => arrayElementsRef.current[index])
      .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement);

    if (elements.length === 0) return gsap.timeline();

    const timeline = gsap.timeline();

    elements.forEach((element) => {
      timeline.to(
        element,
        {
          backgroundColor: "#d4edda",
          borderColor: "#c3e6cb",
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    });

    return timeline;
  };

  /**
   * Greys out a single array element at the given index.
   * @param index The index of the array element to grey out.
   * @returns GSAP timeline for the animation.
   */
  const greyOutElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#e0e0e0",
      color: "#888",
      borderColor: "#cccccc",
      duration: 0.3,
      ease: "power2.out",
    });

    return timeline;
  };

  /**
   * Animates an element to "jump" from (x1, y1) to (x2, y2) in a half-ellipse arc,
   * leaving a trail of cloud particles along the path.
   * @param element The DOM element to animate.
   * @param x1 Starting x position (relative to parent/container).
   * @param y1 Starting y position.
   * @param x2 Ending x position.
   * @param y2 Ending y position.
   * @param duration Animation duration in seconds.
   * @param trailCount Number of cloud particles to spawn along the path.
   * @returns GSAP timeline for the animation.
   */
  /**
   * Animates the search icon (elementA) to "jump" from (x1, y1) to (x2, y2) in a half-ellipse arc,
   * leaving a trail of cloud particles along the path. When the search icon lands,
   * animates elementB (the target array box) down and up once.
   * @param elementA The search icon DOM element to animate.
   * @param elementB The array box DOM element to animate when elementA lands.
   * @param x1 Starting x position (relative to parent/container).
   * @param y1 Starting y position.
   * @param x2 Ending x position.
   * @param y2 Ending y position.
   * @param duration Animation duration in seconds.
   * @param trailCount Number of cloud particles to spawn along the path.
   * @returns GSAP timeline for the animation.
   */
  const jumpWithCloudTrail = (
    elementA: HTMLElement,
    elementB: HTMLElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 1
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Calculate distance and dynamic arc height
    const distance = Math.abs(x2 - x1);
    const baseHeight = 80; // minimum arc height for short jumps
    const heightMultiplier = 0.4; // scales with distance
    const arcHeight = baseHeight + distance * heightMultiplier;

    // Calculate ellipse parameters for upper half-ellipse (arc)
    const cx = (x1 + x2) / 2; // center X
    const cy = Math.min(y1, y2) - arcHeight; // center Y (above the lower point)
    const a = distance / 2; // horizontal radius
    const b = arcHeight; // vertical radius

    // Set initial position using transforms only (more reliable)
    timeline.set(elementA, {
      x: x1,
      y: y1,
      transformOrigin: "center center",
    });

    // Helper to get point on upper half-ellipse for t in [0,1]
    const getEllipsePoint = (t: number) => {
      // For upper half of ellipse, theta goes from π to 0 (or 180° to 0°)
      const theta = Math.PI * (1 + t);
      const x = cx + a * Math.cos(theta);
      const y = cy + b * Math.sin(theta);
      return { x, y };
    };

    // Calculate proportional timing
    const prepDuration = duration * 0.15; // 15% for pre-jump
    const jumpDuration = duration * 0.7; // 70% for main jump
    const landDuration = duration * 0.15; // 15% for landing

    // Pre-jump animation - slight crouch
    timeline.to(elementA, {
      y: y1 + 15, // slight downward movement
      duration: prepDuration,
      ease: "power2.out",
    });

    // Main jump animation along the elliptical arc
    timeline.to(
      {},
      {
        duration: jumpDuration,
        ease: "power1.inOut",
        onUpdate: function (this: gsap.core.Tween) {
          const progress = this.progress();
          const { x, y } = getEllipsePoint(progress);

          // Use GSAP's set method for consistent transforms
          gsap.set(elementA, { x, y });
        },
      }
    );

    // Landing animation - slight bounce
    timeline.to(elementA, {
      y: y2 + 10, // slight overshoot
      duration: landDuration / 2,
      ease: "power2.in",
    });

    timeline.to(elementA, {
      y: y2, // settle to final position
      duration: landDuration / 2,
      ease: "bounce.out",
    });

    // Element B reaction animation (when elementA lands)
    const reactionStart = duration - landDuration * 1.2;

    timeline.to(
      elementB,
      {
        y: Math.min(50, distance * 0.2), // reaction scales with jump distance
        duration: landDuration,
        ease: "power2.out",
      },
      reactionStart
    );

    timeline.to(elementB, {
      y: 0,
      duration: landDuration,
      ease: "bounce.out",
    });

    return timeline;
  };

  // const jumpWithCloudTrail = (
  //   elementA: HTMLElement,
  //   elementB: HTMLElement,
  //   x1: number,
  //   y1: number,
  //   x2: number,
  //   y2: number,
  //   duration: number = 1
  // ): gsap.core.Timeline => {
  //   const timeline = gsap.timeline();

  //   // Set initial position of search icon using timeline
  //   timeline.set(elementA, { left: SEARCH_LEFT, top: SEARCH_TOP, x: 0, y: 0 });

  //   // Calculate ellipse parameters for upper half-ellipse (arc)
  //   const cx = (x1 + x2) / 2;
  //   const arcHeight = Math.max(ARC_HEIGHT, Math.abs(x2 - x1) * 0.5 - 40);
  //   const cy = (y1 + y2) / 2 - arcHeight;
  //   const a = Math.abs(x2 - x1) / 2;
  //   const b = arcHeight;

  //   // Helper to get point on upper half-ellipse for t in [0,1]
  //   const getEllipsePoint = (t: number) => {
  //     const theta = Math.PI * (1 + t);
  //     const x = cx + a * Math.cos(theta) + SEARCH_LEFT;
  //     const y = cy + b * Math.sin(theta) + SEARCH_TOP * 0.1;
  //     return { x, y };
  //   };

  //   // Animate the search icon along the upper half-ellipse arc (no trail/line)
  //   timeline.to(
  //     {},
  //     {
  //       duration,
  //       ease: "power1.inOut",
  //       onUpdate: function (this: gsap.core.Tween) {
  //         const progress = this.progress();
  //         const { x, y } = getEllipsePoint(progress);
  //         elementA.style.left = `${x}px`;
  //         elementA.style.top = `${y}px`;
  //       },
  //     },
  //     0
  //   );
  //   // Animate elementA a bit down and up before the jump
  //   timeline.to(elementA, {
  //     y: "+=18",
  //     duration: 0.18,
  //     ease: "power1.in",
  //   });
  //   timeline.to(elementA, {
  //     y: 0,
  //     duration: 0.18,
  //     ease: "linear",
  //   });

  //   // When the search icon lands, animate elementB down and up once
  //   timeline.to(
  //     elementB,
  //     {
  //       y: BOX_HEIGHT * 1.5,
  //       duration: 0.1,
  //       ease: "linear",
  //     },
  //     "-=0.4"
  //   );
  //   timeline.to(
  //     elementB,
  //     {
  //       y: 0,
  //       duration: 0.1,
  //       ease: "linear",
  //     },
  //     "-=0.3"
  //   );

  //   return timeline;
  // };

  const playAnimation = (): void => {
    // Handle normal pause case
    if (wasPausedRef.current && timelineRef.current) {
      timelineRef.current.play();
      wasPausedRef.current = false;
      return;
    }

    // Handle case when there is no timeline - create new timeline
    resetAnimation();

    const arr = [...array];
    const n = arr.length;
    // Create main timeline
    const mainTimeline = gsap.timeline();
    mainTimeline.timeScale(propsRef.current.speed);
    currentStepRef.current = 0;

    const jump =
      jumpSize > 0 ? jumpSize : Math.max(1, Math.floor(Math.sqrt(n)));

    let stepIndex = 1; // Counter for animation steps

    // Add initial label for step 0
    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
    });

    // Jump search algorithm with proper step tracking
    let prev = 0;
    let currentPos = Math.min(jump, n - 1);

    // Check if the element at index 'prev' is equal to the search target
    if (arr[prev] === searchTarget) {
      // Highlight the element at 'prev' as found
      mainTimeline.add(highlightBoxe(prev), "+=0.2");
      mainTimeline.add(removeHighlight(prev), "+=0.5");

      mainTimeline.add(animateSortedIndicator(prev), "-=0.2");
      // Add label and step tracking for this found step
      const thisStep = stepIndex;
      mainTimeline.addLabel(`step-${thisStep}`, "+=0.4");
      mainTimeline.call(() => {
        currentStepRef.current = thisStep;
      });
      stepIndex++;
      // No need to continue, target found
      // Optionally, you could break or return here if in a loop
    } else {
      if (jump >= n) {
        currentPos = n - 1;

        // Animate the search icon jumping directly to the last element
        if (
          searchIconRef.current &&
          arrayElementsRef.current[0] &&
          arrayElementsRef.current[currentPos]
        ) {
          const containerRect = containerRef.current?.getBoundingClientRect();
          const startBox = arrayElementsRef.current[0]?.getBoundingClientRect();
          const endBox =
            arrayElementsRef.current[currentPos]?.getBoundingClientRect();

          if (containerRect && startBox && endBox) {
            const x1 = 0 * TOTAL_BOX_SPACING;
            const y1 = startBox.top - containerRect.top;
            const x2 = currentPos * TOTAL_BOX_SPACING;
            const y2 = endBox.top - containerRect.top;

            mainTimeline.add(
              jumpWithCloudTrail(
                searchIconRef.current,
                arrayElementsRef.current[currentPos]!,
                x1,
                0,
                x2,
                0,
                0.8
              ),
              "+=0"
            );
          }
        }

        // Highlight the last element
        mainTimeline.add(highlightBoxe(currentPos), "+=0.2");
        mainTimeline.add(removeHighlight(currentPos), "+=0.5");

        const thisStep = stepIndex;
        mainTimeline.addLabel(`step-${thisStep}`);
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
        stepIndex++;

        // Check if the last element is our target
        if (arr[currentPos] === searchTarget) {
          mainTimeline.add(animateSortedIndicator(currentPos), "-=0.2");
        } else {
          // Grey out the last element and start linear search backwards
          mainTimeline.add(greyOutElement(currentPos), "-=0.2");

          // Start linear search from second-to-last element
          let linearSearchPos = currentPos - 1;
          prev = currentPos; // Set prev to last element for linear search reference

          // Add a brief pause to show transition to linear search
          mainTimeline.add("+=0.3");

          while (linearSearchPos >= 0) {
            // Add label and step tracking for linear search slide
            const thisLinearStep = stepIndex;
            mainTimeline.addLabel(`step-${thisLinearStep}`);
            mainTimeline.call(() => {
              currentStepRef.current = thisLinearStep;
            });
            stepIndex++;

            // Animate sliding the search icon to the current linear search position
            if (
              searchIconRef.current &&
              arrayElementsRef.current[linearSearchPos]
            ) {
              const targetX = linearSearchPos * TOTAL_BOX_SPACING;
              mainTimeline.add(
                slideElementTo(
                  searchIconRef.current,
                  `-=${TOTAL_BOX_SPACING}`,
                  0,
                  0.4
                ),
                "+=0"
              );
            }

            // Highlight the element being checked in linear search
            mainTimeline.add(highlightBoxe(linearSearchPos), "+=0.2");
            mainTimeline.add(removeHighlight(linearSearchPos), "+=0.5");

            // Check if we found the target
            if (arr[linearSearchPos] === searchTarget) {
              mainTimeline.add(
                animateSortedIndicator(linearSearchPos),
                "+=0.1"
              );
              break;
            }

            // Grey out this element and continue backwards
            mainTimeline.add(greyOutElement(linearSearchPos), "-=0.2");
            linearSearchPos--;
            mainTimeline.add("+=0.1");
          }
        }
      } else {
        while (currentPos < n) {
          // Check if we found the target
          if (arr[currentPos] === searchTarget) {
            // Animate the search icon "jumping" from prev to currentPos with cloud trail
            if (
              searchIconRef.current &&
              arrayElementsRef.current[prev] &&
              arrayElementsRef.current[currentPos]
            ) {
              // Get bounding box of array container for relative positioning
              const containerRect =
                containerRef.current?.getBoundingClientRect();
              const prevBox =
                arrayElementsRef.current[prev]?.getBoundingClientRect();
              const currBox =
                arrayElementsRef.current[currentPos]?.getBoundingClientRect();

              if (containerRect && prevBox && currBox) {
                // Calculate relative positions
                const x1 = prev * TOTAL_BOX_SPACING;
                const y1 = prevBox.top - containerRect.top;
                const x2 = currentPos * TOTAL_BOX_SPACING;
                const y2 = currBox.top - containerRect.top;

                // Animate the search icon jumping with cloud trail
                mainTimeline.add(
                  jumpWithCloudTrail(
                    searchIconRef.current,
                    arrayElementsRef.current[currentPos]!,
                    x1,
                    0,
                    x2,
                    0,
                    0.8
                  ),
                  "+=0"
                );
              }
            }

            // Add label and step tracking for this jump

            // Highlight the found elem+nt
            mainTimeline.add(highlightBoxe(currentPos), "+=0.2");
            mainTimeline.add(removeHighlight(currentPos), "+=0.5");

            // Add the sorted indicator animation for the found element
            mainTimeline.add(animateSortedIndicator(currentPos), "-=0.2");

            const thisStep = stepIndex;
            mainTimeline.addLabel(`step-${thisStep}`);
            mainTimeline.call(() => {
              currentStepRef.current = thisStep;
            });
            stepIndex++;
            // Target found - break out of the loop
            break;
          }

          // Check if current element has overshot the target based on sort order
          const hasOvershot = isAscending
            ? arr[currentPos] > searchTarget // In ascending: if current > target, we've gone too far
            : arr[currentPos] < searchTarget; // In descending: if current < target, we've gone too far

          if (hasOvershot) {
            // Animate the search icon "jumping" from prev to currentPos with cloud trail
            if (
              searchIconRef.current &&
              arrayElementsRef.current[prev] &&
              arrayElementsRef.current[currentPos]
            ) {
              // Get bounding box of array container for relative positioning
              const containerRect =
                containerRef.current?.getBoundingClientRect();
              const prevBox =
                arrayElementsRef.current[prev]?.getBoundingClientRect();
              const currBox =
                arrayElementsRef.current[currentPos]?.getBoundingClientRect();

              if (containerRect && prevBox && currBox) {
                // Calculate relative positions
                const x1 = prev * TOTAL_BOX_SPACING;
                const y1 = prevBox.top - containerRect.top;
                const x2 = currentPos * TOTAL_BOX_SPACING;
                const y2 = currBox.top - containerRect.top;

                // Animate the search icon jumping with cloud trail
                mainTimeline.add(
                  jumpWithCloudTrail(
                    searchIconRef.current,
                    arrayElementsRef.current[currentPos]!,
                    x1,
                    0,
                    x2,
                    0,
                    0.8
                  ),
                  "+=0"
                );
              }
            }

            // Highlight the element that has overshot the target
            mainTimeline.add(highlightBoxe(currentPos), "+=0.2");
            mainTimeline.add(removeHighlight(currentPos), "+=0.5");

            // Grey out this element since it has overshot the target
            mainTimeline.add(greyOutElement(currentPos), "-=0.2");

            // Add label and step tracking for this jump
            const thisStep = stepIndex;
            mainTimeline.addLabel(`step-${thisStep}`);
            mainTimeline.call(() => {
              currentStepRef.current = thisStep;
            });
            stepIndex++;

            // Element has overshot target - stop jumping and start linear search from prev
            break;
          }

          // Animate the search icon "jumping" from prev to currentPos with cloud trail
          if (
            searchIconRef.current &&
            arrayElementsRef.current[prev] &&
            arrayElementsRef.current[currentPos]
          ) {
            // Get bounding box of array container for relative positioning
            const containerRect = containerRef.current?.getBoundingClientRect();
            const prevBox =
              arrayElementsRef.current[prev]?.getBoundingClientRect();
            const currBox =
              arrayElementsRef.current[currentPos]?.getBoundingClientRect();

            if (containerRect && prevBox && currBox) {
              // Calculate relative positions
              const x1 = prev * TOTAL_BOX_SPACING;
              const y1 = prevBox.top - containerRect.top;
              const x2 = currentPos * TOTAL_BOX_SPACING;
              const y2 = currBox.top - containerRect.top;

              // Animate the search icon jumping with cloud trail
              mainTimeline.add(
                jumpWithCloudTrail(
                  searchIconRef.current,
                  arrayElementsRef.current[currentPos]!,
                  x1,
                  0,
                  x2,
                  0,
                  0.8
                ),
                "+=0"
              );
            }
          }

          // Highlight the element being checked at current position
          mainTimeline.add(highlightBoxe(currentPos), "+=0.2");
          mainTimeline.add(removeHighlight(currentPos), "+=0.5");

          // Add label and step tracking for this jump
          const thisStep = stepIndex;
          mainTimeline.addLabel(`step-${thisStep}`, "+=0.4");
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
          stepIndex++;

          // Check if we found the target
          if (arr[currentPos] === searchTarget) {
            // Add the sorted indicator animation for the found element
            mainTimeline.add(animateSortedIndicator(currentPos), "-=0.2");
            // Target found - break out of the loop
            break;
          }

          // Check if current element has overshot the target based on sort order (duplicate check for flow)
          const hasOvershotAgain = isAscending
            ? arr[currentPos] > searchTarget // In ascending: if current > target, we've gone too far
            : arr[currentPos] < searchTarget; // In descending: if current < target, we've gone too far

          if (hasOvershotAgain) {
            // Grey out this element since it has overshot the target
            mainTimeline.add(greyOutElement(currentPos), "+=0.1");
            // Element has overshot target - stop jumping
            break;
          }

          // Current element hasn't reached target yet, grey it out
          mainTimeline.add(greyOutElement(currentPos), "+=0.1");

          // Calculate next jump position
          let nextPos = currentPos + jump;

          // Handle boundary case - if jump goes out of bounds, set to last element
          if (nextPos >= n) {
            nextPos = n - 1;

            // If we're already at the last element, target not found - break
            if (currentPos === nextPos) {
              break;
            }
          }

          prev = currentPos;
          currentPos = nextPos;
        }
      }
      // Jump in blocks - find the right block

      if (arr[currentPos] !== searchTarget) {
        let linearSearchPos = currentPos - 1;

        // Add a brief pause to show transition from jump to linear search
        mainTimeline.add("+=0.3");

        while (linearSearchPos > prev) {
          // Add label and step tracking for linear search slide
          const thisStep = stepIndex;
          mainTimeline.addLabel(`step-${thisStep}`);
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
          stepIndex++;

          // Animate sliding the search icon to the current linear search position
          if (
            searchIconRef.current &&
            arrayElementsRef.current[linearSearchPos]
          ) {
            const containerRect = containerRef.current?.getBoundingClientRect();
            const targetBox =
              arrayElementsRef.current[
                linearSearchPos
              ]?.getBoundingClientRect();

            if (containerRect && targetBox) {
              // Calculate target position for the search icon
              const targetX = linearSearchPos * TOTAL_BOX_SPACING;

              // Slide the search icon to this position
              mainTimeline.add(
                slideElementTo(
                  searchIconRef.current,
                  `-=${TOTAL_BOX_SPACING}`,
                  0,
                  0.4 // Slower animation for linear search
                ),
                "+=0"
              );
            }
          }

          // Highlight the element being checked in linear search
          mainTimeline.add(highlightBoxe(linearSearchPos), "+=0.2");
          mainTimeline.add(removeHighlight(linearSearchPos), "+=0.5");

          // Check if we found the target
          if (arr[linearSearchPos] === searchTarget) {
            // Target found during linear search!
            // Add the sorted indicator animation for the found eleme-t
            mainTimeline.add(animateSortedIndicator(linearSearchPos), "-=0.2");
            mainTimeline.add("+=0.2"); // Brief pause to show success
            break;
          }

          // Check if current element has gone past target in linear search based on sort order
          const hasPastTarget = isAscending
            ? arr[linearSearchPos] < searchTarget // In ascending: if current < target, we've gone too far back
            : arr[linearSearchPos] > searchTarget; // In descending: if current > target, we've gone too far back

          if (hasPastTarget) {
            // We've gone too far back - target doesn't exist between prev and currentPos
            mainTimeline.add(greyOutElement(linearSearchPos), "+=0.1");
            break;
          }

          // Current element is still past target, grey it out and continue backwards
          mainTimeline.add(greyOutElement(linearSearchPos), "+=0.1");

          linearSearchPos--;

          // Add small delay between linear search steps
          mainTimeline.add("+=0.1");
        }

        // Final result handling
        const finalStep = stepIndex;
        mainTimeline.call(() => {
          currentStepRef.current = finalStep;
          // You can add logic here to show search result (found/not found)
          if (arr[linearSearchPos] === searchTarget) {
            console.log(
              `Target ${searchTarget} found at index ${linearSearchPos}`
            );
          } else {
            console.log(`Target ${searchTarget} not found in array`);
          }
        });
      }
    }

    // Set total steps and add final timeline actions
    totalStepsRef.current = stepIndex - 1; // stepIndex is one ahead
    mainTimeline.addLabel("end");

    mainTimeline.call(() => {
      wasPausedRef.current = false;
      setIsPlaying(false);
    });

    timelineRef.current = mainTimeline;
  };

  const nextStep = (): void => {
    if (!timelineRef.current) {
      playAnimation();
      if (timelineRef.current) {
        (timelineRef.current as gsap.core.Timeline).pause();
        currentStepRef.current = 0;
        (timelineRef.current as gsap.core.Timeline).play(`step-${0}`);
        currentStepRef.current = 1;
        (timelineRef.current as gsap.core.Timeline).addPause(`step-${1}`);
        wasPausedRef.current = true;
      }
      return;
    }

    if (propsRef.current.isPlaying) {
      (timelineRef.current as gsap.core.Timeline).pause();
      currentStepRef.current++;
      const temp = propsRef.current.speed;
      timelineRef.current!.timeScale(propsRef.current.speed * 4);
      (timelineRef.current as gsap.core.Timeline).play();
      (timelineRef.current as gsap.core.Timeline).addPause(
        `step-${currentStepRef.current}`,
        () => {
          setTimeout(() => {
            if (timelineRef.current) {
              timelineRef.current.timeScale(temp);
              timelineRef.current.play();
            }
            wasPausedRef.current = false;
          }, 0);
        }
      );
      // setIsPlaying(false);
    } else {
      if (currentStepRef.current <= totalStepsRef.current) {
        (timelineRef.current as gsap.core.Timeline).play();
        currentStepRef.current++;
        (timelineRef.current as gsap.core.Timeline).addPause(
          `step-${currentStepRef.current}`
        );
      } else {
        (timelineRef.current as gsap.core.Timeline).play();
        (timelineRef.current as gsap.core.Timeline).addPause("end");
      }
      wasPausedRef.current = true;
    }
  };

  const pauseAnimation = (): void => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      wasPausedRef.current = true;
    }
  };

  const resetAnimation = (): void => {
    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Reset all array elements to original state and restore original order
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
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            zIndex: "auto",
            color: "#212529", // Reset text color to default (Bootstrap body color)
          });
        }
      });

      // Restore original array order based on the original array prop
      // This version handles duplicates by matching both value and DOM order
      const originalOrder: (HTMLDivElement | null)[] = new Array(
        array.length
      ).fill(null);
      const used = new Array(array.length).fill(false);

      arrayElementsRef.current.forEach((element) => {
        if (element) {
          const value = parseInt(element.textContent || "0");
          // Find the first unused index in array with this value
          for (let i = 0; i < array.length; i++) {
            if (!used[i] && array[i] === value) {
              originalOrder[i] = element;
              used[i] = true;
              break;
            }
          }
        }
      });
      arrayElementsRef.current = originalOrder;
    }

    // Reset bubble image
    if (searchIconRef.current) {
      // gsap.killTweensOf(searchIconRef.current);
      gsap.set(searchIconRef.current, {
        x: 0,
        y: 0,
        top: SEARCH_TOP,
        left: SEARCH_LEFT,
        opacity: 0.8,
      });
    }

    // Reset all state variables
    wasPausedRef.current = false;
    currentStepRef.current = 0;
  };

  const previousStep = (): void => {
    if (!timelineRef.current) return;

    if (currentStepRef.current > 0) {
      currentStepRef.current--;
      const prevLabel =
        currentStepRef.current === 0
          ? "step-0"
          : `step-${currentStepRef.current}`;
      const temp = propsRef.current.speed;
      timelineRef.current.timeScale(propsRef.current.speed * 4);

      // Increase the animation speed by increasing the timeScale of the timeline
      timelineRef.current.reverse();
      // timelineRef.current.seek(prevLabel);
      timelineRef.current.pause(prevLabel);
      if (timelineRef.current) {
        timelineRef.current.timeScale(temp);
      }

      wasPausedRef.current = true;

      // INSERT_YOUR_CODE
      if (propsRef.current.isPlaying) {
        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.play();
          }
          wasPausedRef.current = false;
        }, 100); // Add a 100ms delay before playing
      }
    }
  };

  // Control handlers
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
    setArray(newArray);
    setIsPlaying(false);
    resetAnimation();
  };

  const handleArraySizeChange = (newSize: number): void => {
    setArraySize(newSize);
  };

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
  };

  // Modified: On change in jumpsize or targetelement use reset animation
  const handleSearchTargetChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setSearchTargetInput(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSearchTarget(numValue);
      resetAnimation();
      setIsPlaying(false);
    }
  };

  const handleJumpSizeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    if (value !== "") {
      const numValue = parseInt(value);
      if (numValue > 0) {
        setJumpSizeInput(value);
      } else if (numValue === 0) {
        setJumpSizeInput(Math.floor(Math.sqrt(array.length)).toString());
      }
    }
    // setJumpSizeInput(value);
    const numValue = parseInt(value);

    if (!isNaN(numValue) && numValue >= 0) {
      setJumpSize(numValue);
      resetAnimation();
      setIsPlaying(false);
    }
  };

  // handleSortOrderChange is a no-op for JumpSearch (array is always sorted ascending)

  // Replace the existing handleSortOrderChange function with this:
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
    propsRef.current = { array, speed, searchTarget, jumpSize, isPlaying };
    if (timelineRef.current) {
      timelineRef.current.timeScale(speed);
    }
  }, [array, speed, searchTarget, jumpSize, isPlaying]);

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
          className="jump-search-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            minHeight: "400px",
            zIndex: 0,
          }}
        >
          {/* Array Elements */}
          <div
            className="array-container"
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Search Icon */}
            <div
              ref={searchIconRef}
              style={{
                position: "absolute",
                top: `${SEARCH_TOP}px`,
                left: `${SEARCH_LEFT}px`,
                transform: "translateX(-50%)",
                width: `${IMAGE_WIDTH}px`,
                height: `${IMAGE_HEIGHT}px`,
                opacity: 0.8,
                zIndex: -1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/Images/SearchImage.png"
                alt="search indicator"
                width={IMAGE_WIDTH}
                height={IMAGE_HEIGHT}
                style={{ objectFit: "contain" }}
              />

              {/* Target value display inside the search circle */}
              <div
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "40%",
                  transform: "translate(-50%, -50%)",
                  fontSize: `${BOX_FONT_SIZE}px`,
                  fontWeight: "600",
                  color: "#1e40af", // Blue color to match search theme
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  zIndex: 1,
                }}
              >
                {searchTarget}
              </div>
            </div>

            {/* Array Elements */}
            {array.map((value, index) => (
              <div key={`array-container-${index}`} className="relative">
                <div
                  key={`${index}-${value}`}
                  ref={(el) => {
                    arrayElementsRef.current[index] = el;
                  }}
                  className={`array-element array-element-${index}`}
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
                    zIndex: 2,
                  }}
                >
                  {value}
                </div>

                {/* Index below each array element */}
                <div
                  className="array-index"
                  style={{
                    position: "absolute",
                    top: `${INDEX_Y_OFFSET}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: `${INDEX_FONT_SIZE}px`,
                    fontWeight: "500",
                    color: "#6b7280",
                    backgroundColor: "#f9f9f9",
                    padding: "2px 6px",
                    // borderRadius: "4px",
                    // border: "1px solid #e5e7eb",
                  }}
                >
                  {index}
                </div>
              </div>
            ))}
          </div>
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

        <div className="flex flex-col items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Jump Size</label>
          <input
            style={{ zIndex: 1 }}
            type="number"
            value={jumpSizeInput}
            onChange={handleJumpSizeChange}
            placeholder="(0 for auto √n)"
            className="w-32 h-10 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500  [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            min="1"
          />
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

export default JumpSearch;
