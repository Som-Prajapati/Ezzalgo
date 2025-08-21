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
      SEARCH_LEFT: 40 * 1.3,
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

const InterpolationSearch: React.FC<SidebarProps> = ({ isOpen, width }) => {
  // Fixed initial array to prevent hydration mismatch
  const getFixedInitialArray = () => [8, 17, 25, 31, 42, 65, 75, 89];
  const initialArray = getFixedInitialArray();

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(8);
  const [searchTarget, setSearchTarget] = useState<number>(42);
  const [searchTargetInput, setSearchTargetInput] = useState<string>("42");
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAscending, setIsAscending] = useState<boolean>(true);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const searchIconRef = useRef<HTMLDivElement>(null);
  const lowArrowRef = useRef<HTMLDivElement>(null);
  const highArrowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, searchTarget, isPlaying });
  const [currentPseudoCodeLine, setCurrentPseudoCodeLine] = useState(0);
  const tabTitles = ["Selection Sort"] as const;
  const showPseudoCode = 0;
  const pseudoCode = ["------- selection sort"];
  const [showCodePanel, setShowCodePanel] = useState(false);

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
  // Utility to slide an element to a position
  const slideElementTo = (
    element: HTMLElement,
    toX: number | string,
    toY: number | string = 0,
    duration: number = 0.7
  ): gsap.core.Tween => {
    return gsap.to(element, {
      x: toX,
      y: toY,
      duration,
      ease: "power1.inOut",
    });
  };

  // Animation helper functions
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

  const teleportToPosition = (
    searchCircle: HTMLElement,
    targetIndex: number,
    duration: number = 0.8
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Calculate target position above the array element
    const targetX = targetIndex * TOTAL_BOX_SPACING;

    // Step 1: Scale down to 0 (disappear)
    timeline.to(searchCircle, {
      scale: 0,
      duration: duration * 0.5,
      ease: "power2.in",
    });

    // Step 2: Move to new position while invisible
    timeline.set(searchCircle, {
      x: targetX,
      y: 0,
    });

    // Step 3: Scale back up (appear)
    timeline.to(searchCircle, {
      scale: 1,
      duration: duration * 0.5,
      ease: "back.out(1.7)",
    });

    // Step 4: Optional bounce effect
    // timeline.to(searchCircle, {
    //   y: -10,
    //   duration: duration * 0.1,
    //   ease: "power2.out",
    // });

    timeline.to(searchCircle, {
      y: 0,
      duration: duration * 0.2,
      ease: "bounce.out",
    });

    return timeline;
  };

  // Calculate the center position of an array element
  const getElementCenterPosition = (index: number) => {
    return index * TOTAL_BOX_SPACING + BOX_WIDTH / 2;
  };

  const showInterpolationFormula = (
    low: number,
    high: number,
    target: number,
    lowValue: number,
    highValue: number,
    calculatedPos: number
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    const formulaElement = containerRef.current?.querySelector(
      ".interpolation-formula"
    ) as HTMLElement;

    if (formulaElement) {
      // Update formula with actual values
      const formulaContent = `
        <div style="text-align: center; margin-bottom: 8px; font-weight: 600;">
          Interpolation Calculation:
        </div>
        <div style="text-align: center; margin-bottom: 4px;">
          pos = ${low} + [((${target} - ${lowValue}) × (${high} - ${low}))/ (${highValue} - ${lowValue})] )
        </div>
        <div style="text-align: center; color: #059669;">
          pos = ${calculatedPos}
        </div>
      `;

      // Ensure the content is updated at play-time (when this sub-timeline runs),
      // not at timeline construction time.
      timeline.call(() => {
        formulaElement.innerHTML = formulaContent;
      });

      // Animate formula appearance
      timeline.to(formulaElement, {
        opacity: 1,
        y: -10,
        duration: 0.5,
        ease: "back.out(1.7)",
      });

      // Keep formula visible for a moment
      timeline.to({}, { duration: 1.5 });

      // Fade out formula
      timeline.to(formulaElement, {
        opacity: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    }

    return timeline;
  };

  // Core algorithm functions
  const calculateInterpolationPosition = (
    low: number,
    high: number,
    target: number,
    lowValue: number,
    highValue: number
  ): number => {
    // Implement interpolation formula: pos = low + [(target - arr[low]) / (arr[high] - arr[low])] * (high - low)
    if (highValue === lowValue) return low; // Avoid division by zero

    const pos =
      low +
      Math.floor(((target - lowValue) * (high - low)) / (highValue - lowValue));
    // INSERT_YOUR_CODE
    // If pos < low, clamp to low using Math.min; if pos > high, clamp to high using Math.max
    // (though the final return already clamps, but for explicitness per instruction)
    let clampedPos = pos;
    if (pos < low) {
      clampedPos = Math.min(pos, low);
    } else if (pos > high) {
      clampedPos = Math.max(pos, high);
    }
    // Ensure position is within bounds
    return clampedPos;
  };

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

    let stepIndex = 1; // Counter for animation steps

    // Add initial label for step 0
    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
    });

    // Interpolation search algorithm implementation
    let low = 0;
    let high = n - 1;
    let found = false;

    const targetWithinBounds = (lo: number, hi: number): boolean => {
      if (lo < 0 || hi < 0 || lo >= n || hi >= n) return false;
      return isAscending
        ? searchTarget >= arr[lo] && searchTarget <= arr[hi]
        : searchTarget <= arr[lo] && searchTarget >= arr[hi];
    };

    // Show and position low/high arrows with slide down animation
    if (lowArrowRef.current && highArrowRef.current) {
      // low arrow at index 0
      mainTimeline.add(
        gsap.fromTo(
          lowArrowRef.current,
          {
            x: ARROW_X_OFFSET + low * TOTAL_BOX_SPACING,
            y: 0,
            opacity: 0,
            zIndex: -1,
          },
          {
            y: ARROW_Y_OFFSET_DOWN,
            opacity: 1,
            duration: 0.4,
            ease: "power1.out",
          }
        )
      );
      // high arrow at index n-1
      mainTimeline.add(
        gsap.fromTo(
          highArrowRef.current,
          {
            x: ARROW_X_OFFSET + high * TOTAL_BOX_SPACING,
            y: 0,
            opacity: 0,
            zIndex: -1,
          },
          {
            y: ARROW_Y_OFFSET_DOWN,
            opacity: 1,
            duration: 0.4,
            ease: "power1.out",
          }
        ),
        "-=0.4"
      );
    }

    // Early exit: target smaller than minimum value
    const lessThanMin = isAscending
      ? searchTarget < arr[low]
      : searchTarget < arr[high];

    if (lessThanMin) {
      // Calculate interpolation position for the out-of-bounds target
      const pos = calculateInterpolationPosition(
        isAscending ? low : high,
        isAscending ? high : low,
        searchTarget,
        isAscending ? arr[low] : arr[high],
        isAscending ? arr[high] : arr[low]
      );

      // Show interpolation formula calculation (even though it's out of bounds)
      if (containerRef.current?.querySelector(".interpolation-formula")) {
        mainTimeline.add(
          showInterpolationFormula(
            isAscending ? low : high,
            isAscending ? high : low,
            searchTarget,
            isAscending ? arr[low] : arr[high],
            isAscending ? arr[high] : arr[low],
            pos
          ),
          "+=0.2"
        );
      }

      // For ascending: move search icon to first index (min), then grey out all
      // For descending: icon is already at last index (min), so just grey out all
      if (isAscending) {
        if (searchIconRef.current) {
          mainTimeline.add(teleportToPosition(searchIconRef.current, 0, 0.8));
        }
        mainTimeline.add(highlightBoxe(0), "+=0.1");
        mainTimeline.add(removeHighlight(0), "+=0.3");
      } else {
        // In descending, icon is already at last index (min), so just highlight it
        if (searchIconRef.current) {
          mainTimeline.add(
            teleportToPosition(searchIconRef.current, n - 1, 0.8)
          );
        }
        mainTimeline.add(highlightBoxe(n - 1), "+=0.1");
        mainTimeline.add(removeHighlight(n - 1), "+=0.3");
      }
      for (let i = 0; i < n; i++) {
        mainTimeline.add(greyOutElement(i), i === 0 ? "+=0.1" : "-=0.2");
      }

      const finalStep = stepIndex;
      mainTimeline.call(() => {
        currentStepRef.current = finalStep;
        console.log(`Target ${searchTarget} is less than min; not found`);
      });

      totalStepsRef.current = stepIndex - 1;
      mainTimeline.addLabel("end");
      mainTimeline.call(() => {
        wasPausedRef.current = false;
        setIsPlaying(false);
      });
      timelineRef.current = mainTimeline;
      return;
    }

    // Early exit: target greater than maximum value
    const greaterThanMax = isAscending
      ? searchTarget > arr[high]
      : searchTarget > arr[low];

    if (greaterThanMax) {
      // Calculate interpolation position for the out-of-bounds target
      const pos = calculateInterpolationPosition(
        isAscending ? low : high,
        isAscending ? high : low,
        searchTarget,
        isAscending ? arr[low] : arr[high],
        isAscending ? arr[high] : arr[low]
      );

      // Show interpolation formula calculation (even though it's out of bounds)
      if (containerRef.current?.querySelector(".interpolation-formula")) {
        mainTimeline.add(
          showInterpolationFormula(
            isAscending ? low : high,
            isAscending ? high : low,
            searchTarget,
            isAscending ? arr[low] : arr[high],
            isAscending ? arr[high] : arr[low],
            pos
          ),
          "+=0.2"
        );
      }

      // For ascending: move search icon to last index (max), then grey out all
      // For descending: icon is already on max (index 0), so just grey out all
      if (isAscending) {
        if (searchIconRef.current) {
          mainTimeline.add(
            teleportToPosition(searchIconRef.current, n - 1, 0.8)
          );
        }
        mainTimeline.add(highlightBoxe(n - 1), "+=0.1");
        mainTimeline.add(removeHighlight(n - 1), "+=0.3");
      } else {
        // In descending, icon is already at index 0 (max), so just highlight it
        if (searchIconRef.current) {
          mainTimeline.add(teleportToPosition(searchIconRef.current, 0, 0.8));
        }
        mainTimeline.add(highlightBoxe(0), "+=0.1");
        mainTimeline.add(removeHighlight(0), "+=0.3");
      }
      for (let i = 0; i < n; i++) {
        mainTimeline.add(greyOutElement(i), i === 0 ? "+=0.1" : "-=0.2");
      }

      const finalStep = stepIndex;
      mainTimeline.call(() => {
        currentStepRef.current = finalStep;
        console.log(`Target ${searchTarget} is greater than max; not found`);
      });

      totalStepsRef.current = stepIndex - 1;
      mainTimeline.addLabel("end");
      mainTimeline.call(() => {
        wasPausedRef.current = false;
        setIsPlaying(false);
      });
      timelineRef.current = mainTimeline;
      return;
    }

    while (low <= high && targetWithinBounds(low, high)) {
      // Calculate interpolation position
      const pos = calculateInterpolationPosition(
        low,
        high,
        searchTarget,
        arr[low],
        arr[high]
      );
      console.log(pos);
      // Show interpolation formula calculation
      if (containerRef.current?.querySelector(".interpolation-formula")) {
        mainTimeline.add(
          showInterpolationFormula(
            low,
            high,
            searchTarget,
            arr[low],
            arr[high],
            pos
          ),
          "+=0.2"
        );
      }

      // Teleport search circle to calculated position
      if (searchIconRef.current) {
        mainTimeline.add(
          teleportToPosition(searchIconRef.current, pos, 0.8),
          "+=0.3"
        );
      }

      // Highlight the element at calculated position
      mainTimeline.add(highlightBoxe(pos), "+=0.2");
      mainTimeline.add(removeHighlight(pos), "+=0.3");

      // Check if target is found
      if (arr[pos] === searchTarget) {
        // Target found - show success animation
        mainTimeline.add(animateSortedIndicator(pos), "+=0.1");
        found = true;
        // Add step tracking
        const thisStep = stepIndex;
        mainTimeline.addLabel(`step-${thisStep}`);
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
        stepIndex++;
        break;
      }

      // Target not found at current position - narrow the search space
      if (isAscending) {
        if (arr[pos] < searchTarget) {
          // Target is in the upper half (to the right)
          for (let i = low; i <= pos; i++) {
            mainTimeline.add(greyOutElement(i), i === low ? "+=0.1" : "-=0.2");
          }

          low = pos + 1;
          if (lowArrowRef.current) {
            mainTimeline.add(
              slideElementTo(
                lowArrowRef.current,
                low * TOTAL_BOX_SPACING + ARROW_X_OFFSET,
                "+=0",
                0.3
              )
            );
            // Add step tracking
            const thisStep = stepIndex;
            mainTimeline.addLabel(`step-${thisStep}`);
            mainTimeline.call(() => {
              currentStepRef.current = thisStep;
            });
            stepIndex++;
          }
        } else {
          // Target is in the lower half (to the left)
          for (let i = pos; i <= high; i++) {
            mainTimeline.add(greyOutElement(i), i === pos ? "+=0.1" : "-=0.2");
          }
          high = pos - 1;
          if (highArrowRef.current) {
            mainTimeline.add(
              slideElementTo(
                highArrowRef.current,
                high * TOTAL_BOX_SPACING + ARROW_X_OFFSET,
                "+=0",
                0.3
              )
            );
            // Add step tracking
            const thisStep = stepIndex;
            mainTimeline.addLabel(`step-${thisStep}`);
            mainTimeline.call(() => {
              currentStepRef.current = thisStep;
            });
            stepIndex++;
          }
        }
      } else {
        if (arr[pos] > searchTarget) {
          // Descending: target is to the right
          for (let i = low; i <= pos; i++) {
            mainTimeline.add(greyOutElement(i), i === low ? "+=0.1" : "-=0.2");
          }
          low = pos + 1;
          if (lowArrowRef.current) {
            mainTimeline.add(
              slideElementTo(
                lowArrowRef.current,
                low * TOTAL_BOX_SPACING + ARROW_X_OFFSET,
                "+=0",
                0.3
              )
            );
            // Add step tracking
            const thisStep = stepIndex;
            mainTimeline.addLabel(`step-${thisStep}`);
            mainTimeline.call(() => {
              currentStepRef.current = thisStep;
            });
            stepIndex++;
          }
        } else {
          // Descending: target is to the left
          for (let i = pos; i <= high; i++) {
            mainTimeline.add(greyOutElement(i), i === pos ? "+=0.1" : "-=0.2");
          }
          high = pos - 1;
          if (highArrowRef.current) {
            mainTimeline.add(
              slideElementTo(
                highArrowRef.current,
                high * TOTAL_BOX_SPACING + ARROW_X_OFFSET,
                "+=0",
                0.3
              )
            );
          }
          // Add step tracking
          const thisStep = stepIndex;
          mainTimeline.addLabel(`step-${thisStep}`);
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
          stepIndex++;
        }
      }

      // Add brief pause between iterations
      mainTimeline.add("+=0.3");
    }

    // If target not found (loop ended without finding target)
    if (!found) {
      // Add final step for "not found" case
      const finalStep = stepIndex;
      mainTimeline.call(() => {
        currentStepRef.current = finalStep;
        console.log(`Target ${searchTarget} not found in array`);
      });
    }

    // Set total steps and add final timeline actions
    totalStepsRef.current = stepIndex - 1;
    mainTimeline.addLabel("end");

    mainTimeline.call(() => {
      wasPausedRef.current = false;
      setIsPlaying(false);
    });

    timelineRef.current = mainTimeline;
  };

  const handleToggleCodePanel = () => {
    setShowCodePanel(!showCodePanel);
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
            color: "#212529",
          });
        }
      });

      // Restore original array order based on the original array prop
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

    // Reset low/high arrows
    if (lowArrowRef.current && highArrowRef.current) {
      gsap.killTweensOf([lowArrowRef.current, highArrowRef.current]);
      gsap.set([lowArrowRef.current, highArrowRef.current], {
        opacity: 0,
        x: 0,
        y: 0,
        zIndex: "auto",
      });
    }

    // Reset interpolation formula
    const formulaElement = containerRef.current?.querySelector(
      ".interpolation-formula"
    ) as HTMLElement;
    if (formulaElement) {
      gsap.set(formulaElement, {
        opacity: 0,
        y: 0,
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
    propsRef.current = { array, speed, searchTarget, isPlaying };
    if (timelineRef.current) {
      timelineRef.current.timeScale(speed);
    }
  }, [array, speed, searchTarget, isPlaying]);

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
          className="interpolation-search-container"
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
                  color: "#1e40af",
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
                  }}
                >
                  {index}
                </div>
              </div>
            ))}

            {/* Low Arrow */}
            <div
              ref={lowArrowRef}
              className="low-arrow"
              style={{
                position: "absolute",
                left: "0px",
                top: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: 0,
                transform: "translateX(-50%)",
              }}
            >
              <div
                style={{
                  width: "0",
                  height: "0",
                  borderLeft: `${ARROW_SIZE}px solid transparent`,
                  borderRight: `${ARROW_SIZE}px solid transparent`,
                  borderBottom: "20px solid #0d6efd",
                }}
              />
              <div
                style={{
                  fontSize: `${ARROW_FONT_SIZE}px`,
                  fontWeight: 600,
                  color: "#0d6efd",
                  marginTop: "4px",
                }}
              >
                low
              </div>
            </div>

            {/* High Arrow */}
            <div
              ref={highArrowRef}
              className="high-arrow"
              style={{
                position: "absolute",
                left: "0px",
                top: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: 0,
                transform: "translateX(-50%)",
              }}
            >
              <div
                style={{
                  width: "0",
                  height: "0",
                  borderLeft: `${ARROW_SIZE}px solid transparent`,
                  borderRight: `${ARROW_SIZE}px solid transparent`,
                  borderBottom: "20px solid #fd7e14",
                }}
              />
              <div
                style={{
                  fontSize: `${ARROW_FONT_SIZE}px`,
                  fontWeight: 600,
                  color: "#fd7e14",
                  marginTop: "4px",
                }}
              >
                high
              </div>
            </div>
          </div>

          {/* Interpolation Formula Display */}
          <div
            className="interpolation-formula"
            style={{
              position: "absolute",
              bottom: "150px",
              left: "40%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              padding: "12px 20px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
              fontFamily: "monospace",
              fontSize: "14px",
              color: "#374151",
              opacity: 0,
              zIndex: 10,
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "4px",
                fontWeight: "600",
              }}
            >
              Interpolation Formula:
            </div>
            <div style={{ textAlign: "center" }}>
              pos = low + [(target - arr[low]) / (arr[high] - arr[low])] × (high
              - low)
            </div>
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
      </div>

      {/* Controls */}
      <SearchingControls
        randomOnly={ false}
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
        showCodePanel={showCodePanel}
        onToggleCodePanel={handleToggleCodePanel}
        currentLine={currentPseudoCodeLine}
        tabTitles={[...tabTitles]}
        showPseudoCode={showPseudoCode}
        pseudoCode={pseudoCode}
      />
    </div>
  );
};

export default InterpolationSearch;
