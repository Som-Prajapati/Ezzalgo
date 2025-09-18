"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import Controls from "./Control";
import SortingControls from "./SortingControl";

const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 80,
      BOX_HEIGHT: 50,
      BOX_GAP: 16,
      BOX_BORDER_RADIUS: 10,
      BOX_FONT_SIZE: 20,
      ARROW_SIZE: 8,
      ARROW_FONT_SIZE: 16,
      ECLIPSE_HEIGHT: 80,
      TOTAL_BOX_SPACING: 80 + 16,
      ARROW_Y_OFFSET_DOWN: (80 * 2.4) / 2,
      ARROW_X_OFFSET: 80 / 2,
      BUCKET_WIDTH: 60,
      BUCKET_HEIGHT: 200,
      BUCKET_GAP: 10,
      BUCKET_LABEL_HEIGHT: 25,
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
      ECLIPSE_HEIGHT: 60,
      TOTAL_BOX_SPACING: 55 + 10,
      ARROW_Y_OFFSET_DOWN: (55 * 2.4) / 2,
      ARROW_X_OFFSET: 55 / 2,
      BUCKET_WIDTH: 45,
      BUCKET_HEIGHT: 150,
      BUCKET_GAP: 8,
      BUCKET_LABEL_HEIGHT: 20,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const RadixSort: React.FC<SidebarProps> = ({ isOpen, width }: SidebarProps) => {
  // Fixed initial array to prevent hydration mismatch
  console.log(isOpen, width);
  const getFixedInitialArray = () => [170, 451, 752, 903, 204, 802, 214, 656];
  const initialArray = getFixedInitialArray();

  // Register the plugin
  // gsap.registerPlugin(SplitText);

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(8);
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Add this state to track highlights per step (add to your state declarations)
  const highlightStateRef = useRef<
    Map<number, { elementIndex: number; digitPlace: number }>
  >(new Map());

  // Digit place indicator is controlled via GSAP text updates now

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bucketContainerRef = useRef<HTMLDivElement>(null);
  const bucketElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const currentElementArrowRef = useRef<HTMLDivElement>(null);
  const digitPlaceIndicatorRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, isAscending, isPlaying });
  const stepDigitPlaceRef = useRef<Map<number, number>>(new Map());
  const [currentPseudoCodeLine, setCurrentPseudoCodeLine] = useState<
    number | number[]
  >(0);

  const [showCodePanel, setShowCodePanel] = useState(false);
  const tabTitles = ["RadixSort", "CountingSortByDigit"] as const;
  // const showPseudoCode = 0;
  const [showPseudoCode, setShowPseudoCode] = useState(0); // Changed from const to state
  const pseudoCode = [
    [
      "RadixSort(array, size):",
      "",
      "   maxElement ← maximum value in array",
      "   exp ← 1",
      "",
      "   while (maxElement / exp) > 0 do",
      "       CountingSortByDigit(array, size, exp)",
      "       exp ← exp * 10",
      "",
      "return array",
    ],
    [
      "CountingSortByDigit(array, size, exp):",
      "",
      "   output[size]",
      "   count[10] ← all zeros",
      "",
      "   for i ← 0 to (size - 1) do",
      "       index ← (array[i] / exp) mod 10",
      "       count[index] ← count[index] + 1",
      "",
      "   for i ← 1 to 9 do",
      "       count[i] ← count[i] + count[i - 1]",
      "",
      "   for i ← (size - 1) to 0 do",
      "       index ← (array[i] / exp) mod 10",
      "       output[count[index] - 1] ← array[i]",
      "       count[index] ← count[index] - 1",
      "",
      "   for i ← 0 to (size - 1) do",
      "       array[i] ← output[i]",
      "",
    ],
  ];

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
    ECLIPSE_HEIGHT,
    ARROW_X_OFFSET,
    ARROW_Y_OFFSET_DOWN,
    TOTAL_BOX_SPACING,
    BUCKET_WIDTH,
    BUCKET_HEIGHT,
    BUCKET_GAP,
    BUCKET_LABEL_HEIGHT,
  } = dynamicSizing;

  const TOP_OFFSET = BOX_HEIGHT * 4;
  const BOTTOM_OFFSET = BOX_HEIGHT * 2;

  // Helper function to get the digit at a specific place
  const getDigitAtPlace = (num: number, place: number): number => {
    return Math.floor(num / Math.pow(10, place)) % 10;
  };

  // Helper function to get maximum number of digits
  const getMaxDigits = (arr: number[]): number => {
    const maxNum = Math.max(...arr);
    return maxNum.toString().length;
  };

  // Helper function to update pseudo code line highlighting
  const updatePseudoCodeLine = (
    line: number | number[],
    tabIndex: number = 0
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    timeline.call(() => {
      setCurrentPseudoCodeLine(line);
      if (tabIndex !== showPseudoCode) {
        setShowPseudoCode(tabIndex);
      }
    });

    return timeline;
  };

  // Helper to map digit place to user-friendly label
  const getDigitPlaceLabel = (p: number): string => {
    if (p === 0) return "Ones";
    if (p === 1) return "Tens";
    if (p === 2) return "Hundreds";
    return `10^${p}`;
  };

  // Animates an element from its current position to (toX, toY) over the given duration
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
      // Move the element down to its original position (y: 0)
      timeline.to(
        element,
        {
          y: 0,
          duration: 0.5,
          ease: "power1.inOut",
        },
        0
      );
    });

    elements.forEach((element) => {
      // Then, animate the green color
      timeline.to(
        element,
        {
          backgroundColor: "#d4edda",
          borderColor: "#c3e6cb",
          duration: 0.5,
          ease: "power1.inOut",
        },
        "0.5"
      );
    });

    return timeline;
  };

  // Add this function to ensure proper tab switching
  const switchToTab = (tabIndex: number): gsap.core.Timeline => {
    const tl = gsap.timeline();
    tl.call(() => {
      setShowPseudoCode(tabIndex);
    });
    return tl;
  };

  // Highlights the digit at the given digitPlace in red for the current element
  const highlightDigit = (
    element: HTMLElement,
    digitPlace: number
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    const value = parseInt(element.textContent || "0");

    // Store original value for restoration
    element.setAttribute("data-original-value", element.textContent || "0");

    // Build a string padded with leading zeros up to the current digit place
    // Example: value=5, digitPlace=2 -> paddedStr="005"
    const paddedStr = value.toString().padStart(digitPlace + 1, "0");
    const digitIndex = paddedStr.length - 1 - digitPlace;

    // Add a delay or animation to the timeline
    timeline.to({}, { duration: 0.1 }); // Small delay before highlighting

    timeline.call(() => {
      const beforeDigit = paddedStr.substring(0, digitIndex);
      const highlightedDigit = paddedStr[digitIndex] ?? "0";
      const afterDigit = paddedStr.substring(digitIndex + 1);

      element.innerHTML = `${beforeDigit}<span style="color:rgb(243, 9, 9);">${highlightedDigit}</span>${afterDigit}`;
    });

    return timeline;
  };

  const removeDigitHighlight = (element: HTMLElement): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Add a small delay or animation to the timeline
    timeline.to({}, { duration: 0.1 }); // Small delay before removing highlight

    timeline.call(() => {
      // Restore original text content
      const originalValue =
        element.getAttribute("data-original-value") ||
        element.textContent?.replace(/<[^>]*>/g, "") ||
        "0";
      element.innerHTML = originalValue;
      element.removeAttribute("data-original-value");
    });

    return timeline;
  };

  // const highlightDigit = (
  //   element: HTMLElement,
  //   digitPlace: number
  // ): gsap.core.Timeline => {
  //   const timeline = gsap.timeline();
  //   const value = parseInt(element.textContent || "0");
  //   const elementIndex = arrayElementsRef.current.indexOf(
  //     element as HTMLDivElement
  //   );

  //   // Store original content and create highlighted version
  //   const originalContent = element.textContent || "0";
  //   element.setAttribute("data-original-content", originalContent);

  //   // Build the highlighted HTML
  //   const paddedStr = value.toString().padStart(digitPlace + 1, "0");
  //   const digitIndex = paddedStr.length - 1 - digitPlace;
  //   const beforeDigit = paddedStr.substring(0, digitIndex);
  //   const highlightedDigit = paddedStr[digitIndex] ?? "0";
  //   const afterDigit = paddedStr.substring(digitIndex + 1);

  //   const highlightedHTML = `${beforeDigit}<span style="color:rgb(243, 9, 9);">${highlightedDigit}</span>${afterDigit}`;

  //   // Use GSAP to animate the highlight
  //   timeline.to({}, { duration: 0.1 });

  //   // Animate to highlighted state
  //   timeline.fromTo(element,
  //     {
  //       opacity: 1,
  //       scale: 1
  //     },
  //     {
  //       opacity: 1,
  //       scale: 1.05,
  //       duration: 0.15,
  //       ease: "power2.out",
  //       onStart: () => {
  //         // Store this highlight in our state map
  //         highlightStateRef.current.set(currentStepRef.current, {
  //           elementIndex,
  //           digitPlace,
  //         });
  //         // Apply the highlighted HTML
  //         element.innerHTML = highlightedHTML;
  //       }
  //     }
  //   );

  //   // Scale back to normal
  //   timeline.to(element, {
  //     scale: 1,
  //     duration: 0.15,
  //     ease: "power2.out"
  //   });

  //   return timeline;
  // };

  // const removeDigitHighlight = (element: HTMLElement): gsap.core.Timeline => {
  //   const timeline = gsap.timeline();

  //   timeline.to({}, { duration: 0.1 });

  //   // Animate back to original state
  //   timeline.fromTo(element,
  //     {
  //       opacity: 1,
  //       scale: 1
  //     },
  //     {
  //       opacity: 1,
  //       scale: 0.95,
  //       duration: 0.15,
  //       ease: "power2.out",
  //       onComplete: () => {
  //         // Restore original content
  //         const originalContent = element.getAttribute("data-original-content") ||
  //                                element.textContent?.replace(/<[^>]*>/g, "") ||
  //                                "0";
  //         element.innerHTML = originalContent;
  //         element.removeAttribute("data-original-content");
  //       }
  //     }
  //   );

  //   // Scale back to normal
  //   timeline.to(element, {
  //     scale: 1,
  //     duration: 0.15,
  //     ease: "power2.out"
  //   });

  //   return timeline;
  // };

  // const removeDigitHighlight = (element: HTMLElement): gsap.core.Timeline => {
  //   const timeline = gsap.timeline();

  //   // Add a small delay
  //   timeline.to({}, { duration: 0.1 });

  //   // Get stored states
  //   const originalHTML = element.getAttribute("data-original-html") || element.textContent || "0";
  //   const highlightedHTML = element.getAttribute("data-highlighted-html") || "";

  //   // Use a zero-duration tween with reversible callbacks
  //   timeline.to(element, {
  //     duration: 0,
  //     onStart: () => {
  //       element.innerHTML = originalHTML;
  //     },
  //     onReverseComplete: () => {
  //       element.innerHTML = highlightedHTML;
  //     },
  //     onComplete: () => {
  //       element.removeAttribute("data-original-html");
  //       element.removeAttribute("data-highlighted-html");
  //     }
  //   });

  //   return timeline;
  // };

  // Highlight bucket dash
  const highlightBucketDash = (bucketIndex: number): gsap.core.Timeline => {
    const bucketElement = bucketElementsRef.current[bucketIndex];
    if (!bucketElement) return gsap.timeline();

    const timeline = gsap.timeline();
    const dashElement = bucketElement.querySelector(
      ".bucket-dash"
    ) as HTMLElement;

    if (dashElement) {
      timeline.to(dashElement, {
        backgroundColor: "#F30909",
        scaleY: 2,
        duration: 0.3,
        ease: "power1.inOut",
      });
    }

    return timeline;
  };

  // Remove bucket dash highlighting
  const removeBucketDashHighlight = (
    bucketIndex: number
  ): gsap.core.Timeline => {
    const bucketElement = bucketElementsRef.current[bucketIndex];
    if (!bucketElement) return gsap.timeline();

    const timeline = gsap.timeline();
    const dashElement = bucketElement.querySelector(
      ".bucket-dash"
    ) as HTMLElement;

    if (dashElement) {
      timeline.to(dashElement, {
        backgroundColor: "#6c757d",
        scaleY: 1,
        duration: 0.3,
        ease: "power1.inOut",
      });
    }

    return timeline;
  };

  const removeDigitPlaceIndicator = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    if (digitPlaceIndicatorRef.current) {
      timeline.to(digitPlaceIndicatorRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        ease: "power1.inOut",
      });
    }

    return timeline;
  };

  // Update digit place indicator
  const updateDigitPlaceIndicator = (place: number): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    const labelForPlace = (p: number): string => {
      if (p === 0) return "Ones";
      if (p === 1) return "Tens";
      if (p === 2) return "Hundreds";
      return `10^${p}`;
    };

    const element = digitPlaceIndicatorRef.current;
    if (element) {
      // Single tween with text update callbacks to guarantee ordering
      timeline.fromTo(
        element,
        {
          y: -10,
        },
        {
          y: 0,
          duration: 0.5,
          ease: "power1.inOut",
          onStart: () => {
            gsap.set(element, { opacity: 1 });
            element.textContent = `Current digit place: ${labelForPlace(
              place
            )}`;
          },
          onReverseComplete: () => {
            gsap.set(element, { opacity: 1 });
            if (place === 0) {
              element.textContent = `Current digit place: ${labelForPlace(0)}`;
            } else {
              element.textContent = `Current digit place: ${labelForPlace(
                place - 1
              )}`;
            }
          },
        }
      );
    }

    return timeline;
  };

  // Show bucket dashes
  const showBucketDashes = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    if (bucketContainerRef.current) {
      timeline.to(bucketContainerRef.current, {
        opacity: 1,
        y: BOTTOM_OFFSET,
        duration: 0.5,
        ease: "power1.inOut",
      });
    }

    return timeline;
  };

  // Hide bucket dashes
  const hideBucketDashes = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    if (bucketContainerRef.current) {
      timeline.to(bucketContainerRef.current, {
        opacity: 0,
        y: BOTTOM_OFFSET,
        duration: 0.5,
        ease: "power1.inOut",
      });
    }

    return timeline;
  };

  const moveElementToBucket = (
    element: HTMLElement,
    bucketIndex: number,
    stackPosition: number,
    duration: number = 0.8
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    if (!containerRef.current || !bucketElementsRef.current[bucketIndex]) {
      return timeline;
    }

    // Get positions relative to container
    const containerRect = containerRef.current.getBoundingClientRect();
    const bucketElement = bucketElementsRef.current[bucketIndex];
    const bucketRect = bucketElement.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate current element position relative to container
    const elementOffsetX = elementRect.left - containerRect.left;
    const elementOffsetY = elementRect.top - containerRect.top;

    // Calculate target position (center of bucket dash)
    const targetX =
      bucketRect.left -
      containerRect.left +
      bucketRect.width / 2 -
      BOX_WIDTH / 2 -
      elementOffsetX;

    // Calculate target Y position (above the dash, stacked)
    // We need to account for the BOTTOM_OFFSET where the buckets are placed
    const targetY =
      bucketRect.top -
      containerRect.top -
      elementOffsetY -
      BOX_HEIGHT -
      10 -
      stackPosition * (BOX_HEIGHT + 4) +
      BOTTOM_OFFSET;

    // Animate to bucket position with slight arc
    timeline.to(element, {
      x: targetX,
      y: targetY - 20, // First go slightly above target
      duration: duration * 0.5,
      ease: "power1.out",
    });

    timeline.to(
      element,
      {
        y: targetY,
        duration: duration * 0.5,
        ease: "bounce.out",
      },
      duration * 0.5
    );

    return timeline;
  };

  const moveElementsFromBucketsToArray = (
    buckets: HTMLElement[][],
    duration: number,
    isAscending: boolean
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Step 1: Collect elements in radix order (bucket 0 to 9)
    const elementsInOrder: HTMLElement[] = [];
    if (isAscending) {
      for (let bucket = 0; bucket < 10; bucket++) {
        buckets[bucket].forEach((element) => {
          elementsInOrder.push(element);
        });
      }
    } else {
      for (let bucket = 9; bucket >= 0; bucket--) {
        buckets[bucket].forEach((element) => {
          elementsInOrder.push(element);
        });
      }
    }

    // Step 2: Animate each element from its bucket dash position up to the top row
    elementsInOrder.forEach((element, i) => {
      if (!element || !containerRef.current) return;

      // Get current position relative to container
      const containerRect = containerRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const currentX = elementRect.left - containerRect.left;
      const currentY = elementRect.top - containerRect.top;

      // Calculate target X/Y for the top row (array line)
      // The top row Y is typically 0 (or a known offset, e.g., TOP_OFFSET)
      // The X is based on the index in the array
      const targetX = i * (BOX_WIDTH + 15); // 8px gap, adjust as needed
      const targetY = 0; // or use TOP_OFFSET if defined

      // Animate element up to the top row position
      timeline.to(
        element,
        {
          x: targetX - currentX + 100,
          y: targetY - currentY + 10,
          duration: duration,
          ease: "power1.inOut",
          zIndex: 10,
        },
        i * 0.5 // All move together; use `i * stagger` for staggered effect
      );
    });

    return timeline;
  };
  const handleToggleCodePanel = () => {
    setShowCodePanel(!showCodePanel);
  };

  // Fixed playAnimation function
  // const playAnimation = (): void => {
  //   if (wasPausedRef.current && timelineRef.current) {
  //     timelineRef.current.play();
  //     wasPausedRef.current = false;
  //     return;
  //   }

  //   // Create an array to store all
  //   // values for step tracking
  //   const addLabelArray: string[] = [];

  //   resetAnimation();
  //   stepDigitPlaceRef.current.clear();

  //   const arr = [...array];
  //   const maxDigits = getMaxDigits(arr);
  //   const mainTimeline = gsap.timeline();
  //   mainTimeline.timeScale(propsRef.current.speed);
  //   currentStepRef.current = 0;

  //   let stepIndex = 0;

  //   // Add initial label
  //   mainTimeline.addLabel("step-0");
  //   mainTimeline.call(() => {
  //     currentStepRef.current = 0;
  //   });
  //   mainTimeline.call(() => {
  //     stepDigitPlaceRef.current.set(0, 0);
  //   });
  //   stepIndex++;

  //   // Add initial label to addLabelArray for step tracking
  //   addLabelArray.push("step-0");

  //   // Move all elements to the top initially
  //   const elements = arrayElementsRef.current;
  //   if (elements) {
  //     mainTimeline.fromTo(
  //       elements,
  //       { y: 0 },
  //       {
  //         y: -TOP_OFFSET,
  //         duration: 0.5,
  //         ease: "power1.inOut",
  //         stagger: 0.1,
  //       },
  //       0
  //     );
  //   }

  //   // Show bucket dashes initially
  //   mainTimeline.add(showBucketDashes());

  //   // Process each digit place (ones, tens, hundreds, etc.)
  //   for (let digitPlace = 0; digitPlace < maxDigits; digitPlace++) {
  //     // Update digit place indicator
  //     mainTimeline.add(updateDigitPlaceIndicator(digitPlace), "+=0.2");

  //     // Add step label for digit place start
  //     mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
  //     {
  //       const thisStep = stepIndex;
  //       mainTimeline.call(() => {
  //         currentStepRef.current = thisStep;
  //       });
  //       mainTimeline.call(() => {
  //         stepDigitPlaceRef.current.set(thisStep, digitPlace);
  //       });
  //     }
  //     stepIndex++;

  //     // PHASE 1: Distribute to buckets
  //     const buckets: HTMLElement[][] = Array.from({ length: 10 }, () => []);

  //     for (let i = 0; i < arr.length; i++) {
  //       const element = arrayElementsRef.current[i];
  //       if (!element) continue;

  //       const digit = getDigitAtPlace(arr[i], digitPlace);
  //       buckets[digit].push(element);

  //       // Add step label for each element distribution
  //       mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
  //       {
  //         const thisStep = stepIndex;
  //         mainTimeline.call(() => {
  //           currentStepRef.current = thisStep;
  //         });
  //         mainTimeline.call(() => {
  //           stepDigitPlaceRef.current.set(thisStep, digitPlace);
  //         });
  //       }
  //       stepIndex++;

  //       // Highlight and animate to bucket
  //       mainTimeline.add(highlightDigit(element, digitPlace), ">");
  //       mainTimeline.add(highlightBucketDash(digit), "-=0.1");

  //       const stackPosition = buckets[digit].length - 1;
  //       mainTimeline.add(
  //         moveElementToBucket(element, digit, stackPosition, 0.8),
  //         "+=0.3"
  //       );

  //       mainTimeline.add(removeBucketDashHighlight(digit), "-=0.4");
  //       mainTimeline.to({}, { duration: 0.2 });
  //     }

  //     // PHASE 2: Collect from buckets back to array
  //     const newOrder: number[] = [];
  //     const newElementOrder: (HTMLDivElement | null)[] = [];

  //     if (propsRef.current.isAscending) {
  //       for (let bucket = 0; bucket < 10; bucket++) {
  //         buckets[bucket].forEach((element) => {
  //           const value = parseInt(element.textContent || "0");
  //           newOrder.push(value);
  //           newElementOrder.push(element as HTMLDivElement);
  //         });
  //       }
  //     } else {
  //       for (let bucket = 9; bucket >= 0; bucket--) {
  //         buckets[bucket].forEach((element) => {
  //           const value = parseInt(element.textContent || "0");
  //           newOrder.push(value);
  //           newElementOrder.push(element as HTMLDivElement);
  //         });
  //       }
  //     }

  //     // Update array state
  //     for (let i = 0; i < newOrder.length; i++) {
  //       arr[i] = newOrder[i];
  //     }
  //     arrayElementsRef.current = newElementOrder;

  //     // Add step label for collection phase
  //     mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
  //     {
  //       const thisStep = stepIndex;
  //       mainTimeline.call(() => {
  //         currentStepRef.current = thisStep;
  //       });
  //       mainTimeline.call(() => {
  //         stepDigitPlaceRef.current.set(thisStep, digitPlace);
  //       });
  //     }
  //     stepIndex++;

  //     mainTimeline.add(
  //       moveElementsFromBucketsToArray(
  //         buckets,
  //         1.2,
  //         propsRef.current.isAscending
  //       )
  //     );

  //     // Remove all digit highlights after elements return to array
  //     for (let i = 0; i < arr.length; i++) {
  //       const element = arrayElementsRef.current[i];
  //       if (!element) continue;
  //       mainTimeline.add(removeDigitHighlight(element), "+=0.1");
  //     }

  //     // Wait for elements to finish moving back before proceeding to next digit
  //     mainTimeline.to({}, { duration: 1.0 });
  //   }

  //   // Final cleanup
  //   mainTimeline.add(hideBucketDashes(), "+=0.2");
  //   mainTimeline.add(removeDigitPlaceIndicator(), "+=0.1");
  //   mainTimeline.add(
  //     animateSortedIndicator([...Array(arr.length).keys()]),
  //     "-=0.1"
  //   );

  //   // Set total steps and add end label
  //   totalStepsRef.current = stepIndex - 1;
  //   currentStepRef.current = 0;
  //   mainTimeline.addLabel("end");

  //   mainTimeline.call(() => {
  //     wasPausedRef.current = false;
  //     setIsPlaying(false);
  //   });

  //   console.log("addLabelArray:", addLabelArray);

  //   timelineRef.current = mainTimeline;
  // };

  const playAnimation = (): void => {
    if (wasPausedRef.current && timelineRef.current) {
      timelineRef.current.play();
      wasPausedRef.current = false;
      return;
    }

    // Create an array to store all values for step tracking
    const addLabelArray: string[] = [];

    resetAnimation();
    stepDigitPlaceRef.current.clear();

    const arr = [...array];
    const maxDigits = getMaxDigits(arr);
    const mainTimeline = gsap.timeline();
    mainTimeline.timeScale(propsRef.current.speed);
    currentStepRef.current = 0;

    let stepIndex = 0;

    // Add initial label
    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
    });
    mainTimeline.call(() => {
      stepDigitPlaceRef.current.set(0, 0);
    });

    // Highlight the first line of RadixSort
    mainTimeline.add(updatePseudoCodeLine([2, 3], 0), "+=0.1");
    stepIndex++;

    // Add initial label to addLabelArray for step tracking
    addLabelArray.push("step-0");

    // Move all elements to the top initially
    const elements = arrayElementsRef.current;
    if (elements) {
      mainTimeline.fromTo(
        elements,
        { y: 0 },
        {
          y: -TOP_OFFSET,
          duration: 0.5,
          ease: "power1.inOut",
          stagger: 0.1,
        },
        0
      );
    }

    // Show bucket dashes initially
    mainTimeline.add(showBucketDashes());

    // // Highlight maxElement calculation (line 2)
    // mainTimeline.add(updatePseudoCodeLine(2, 0), "+=0.2");

    // // Highlight exp initialization (line 3)
    // mainTimeline.add(updatePseudoCodeLine(3, 0), "+=0.5");

    // Process each digit place (ones, tens, hundreds, etc.)
    for (let digitPlace = 0; digitPlace < maxDigits; digitPlace++) {
      // Highlight while condition (line 5)
      mainTimeline.add(updatePseudoCodeLine(5, 0), "+=0.3");

      // Update digit place indicator
      mainTimeline.add(updateDigitPlaceIndicator(digitPlace), "+=0.2");

      // Highlight CountingSortByDigit call (line 6) and switch to CountingSortByDigit tab
      mainTimeline.add(updatePseudoCodeLine(6, 0), "+=0.2");
      mainTimeline.add(updatePseudoCodeLine(0, 1), "+=0.3"); // Switch to CountingSortByDigit tab

      // Add step label for digit place start
      mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
      {
        const thisStep = stepIndex;
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
        mainTimeline.call(() => {
          stepDigitPlaceRef.current.set(thisStep, digitPlace);
        });
      }
      stepIndex++;

      // Initialize count array (line 3 in CountingSortByDigit)
      mainTimeline.add(updatePseudoCodeLine([2, 3], 1), "+=0.3");

      // PHASE 1: Count occurrences of each digit (lines 5-7 in CountingSortByDigit)
      mainTimeline.add(updatePseudoCodeLine(5, 1), "+=0.5");

      const buckets: HTMLElement[][] = Array.from({ length: 10 }, () => []);

      for (let i = 0; i < arr.length; i++) {
        const element = arrayElementsRef.current[i];
        if (!element) continue;

        const digit = getDigitAtPlace(arr[i], digitPlace);
        buckets[digit].push(element);

        // Add step label for each element distribution
        mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
        {
          const thisStep = stepIndex;
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
          mainTimeline.call(() => {
            stepDigitPlaceRef.current.set(thisStep, digitPlace);
          });
        }
        stepIndex++;

        // Highlight digit extraction and count increment (lines 6-7)
        mainTimeline.add(updatePseudoCodeLine(6, 1), "+=0.1");

        // Highlight and animate to bucket
        mainTimeline.add(highlightDigit(element, digitPlace), ">");
        mainTimeline.add(highlightBucketDash(digit), "-=0.1");

        mainTimeline.add(updatePseudoCodeLine(7, 1), "+=0.1");

        const stackPosition = buckets[digit].length - 1;
        mainTimeline.add(
          moveElementToBucket(element, digit, stackPosition, 0.8),
          "+=0.3"
        );

        mainTimeline.add(removeBucketDashHighlight(digit), "-=0.4");
        mainTimeline.to({}, { duration: 0.2 });
      }

      // Transform count array to cumulative (lines 9-10 in CountingSortByDigit)
      mainTimeline.add(updatePseudoCodeLine([9, 10], 1), "+=0.3");
      mainTimeline.to({}, { duration: 0.3 });

      // PHASE 2: Collect from buckets back to array
      const newOrder: number[] = [];
      const newElementOrder: (HTMLDivElement | null)[] = [];

      // Build output array (lines 12-15 in CountingSortByDigit)
      // Instead of highlighting all lines at once, highlight each line as each element is collected
      let collectIndex = 0;
      let collectElements: HTMLDivElement[] = [];

      if (propsRef.current.isAscending) {
        for (let bucket = 0; bucket < 10; bucket++) {
          buckets[bucket].forEach((element) => {
            collectElements.push(element as HTMLDivElement);
          });
        }
      } else {
        for (let bucket = 9; bucket >= 0; bucket--) {
          buckets[bucket].forEach((element) => {
            collectElements.push(element as HTMLDivElement);
          });
        }
      }

      // For each element being collected, highlight lines 12-15 in a staggered manner
      for (let i = 0; i < collectElements.length; i++) {
        // // Highlight line 12: for i ← (size - 1) to 0 do
        // mainTimeline.add(updatePseudoCodeLine(12, 1), i === 0 ? "+=0.3" : "+=0.15");
        // // Highlight line 13: index ← (array[i] / exp) mod 10
        // mainTimeline.add(updatePseudoCodeLine(13, 1), "+=0.1");
        // // Highlight line 14: output[count[index] - 1] ← array[i]
        // mainTimeline.add(updatePseudoCodeLine(14, 1), "+=0.1");
        // // Highlight line 15: count[index] ← count[index] - 1
        // mainTimeline.add(updatePseudoCodeLine(15, 1), "+=0.1");

        const element = collectElements[i];
        const value = parseInt(element.textContent || "0");
        newOrder.push(value);
        newElementOrder.push(element as HTMLDivElement);
      }

      // Update array state
      for (let i = 0; i < newOrder.length; i++) {
        arr[i] = newOrder[i];
      }
      arrayElementsRef.current = newElementOrder;

      // Add step label for collection phase
      mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
      {
        const thisStep = stepIndex;
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
        mainTimeline.call(() => {
          stepDigitPlaceRef.current.set(thisStep, digitPlace);
        });
      }
      stepIndex++;

      // For each element being collected, highlight lines 12-15 in a staggered manner
      for (let i = 0; i < collectElements.length; i++) {
        // Highlight line 12: for i ← (size - 1) to 0 do
        mainTimeline.add(updatePseudoCodeLine(12, 1));
        mainTimeline.to({}, { duration: 0.15 });

        // Highlight line 13: index ← (array[i] / exp) mod 10
        mainTimeline.add(updatePseudoCodeLine(13, 1));
        mainTimeline.to({}, { duration: 0.15 });

        // Highlight line 14: output[count[index] - 1] ← array[i]
        mainTimeline.add(updatePseudoCodeLine(14, 1));
        mainTimeline.to({}, { duration: 0.15 });

        // Highlight line 15: count[index] ← count[index] - 1
        mainTimeline.add(updatePseudoCodeLine(15, 1));
        mainTimeline.to({}, { duration: 0.15 });

      }
      // Move elements from buckets to array, highlighting lines 12-15 in sync with the movement
      mainTimeline.add(
        gsap
          .timeline()
          .add(
            moveElementsFromBucketsToArray(
              buckets,
              1.2,
              propsRef.current.isAscending
            )
          ),
          "-=5"
      );

      // Remove all digit highlights after elements return to array
      for (let i = 0; i < arr.length; i++) {
        const element = arrayElementsRef.current[i];
        if (!element) continue;
        mainTimeline.add(removeDigitHighlight(element), "+=0.1");
      }

      mainTimeline.add(updatePseudoCodeLine([17, 18], 1), "+=0.3");

      // Wait for elements to finish moving back before proceeding to next digit
      mainTimeline.to({}, { duration: 1.0 });
      mainTimeline.add(switchToTab(0), "+=0.2");
      mainTimeline.add(updatePseudoCodeLine(7, 0), "+=0.3");
    }

    // Final cleanup - highlight return statement (line 9)
    mainTimeline.add(updatePseudoCodeLine(9, 0), "+=0.2");
    mainTimeline.add(hideBucketDashes(), "+=0.2");
    mainTimeline.add(removeDigitPlaceIndicator(), "+=0.1");
    // Switch back to RadixSort tab and highlight exp increment (line 7)
    mainTimeline.add(updatePseudoCodeLine(9, 0), "+=0.3");

    mainTimeline.add(
      animateSortedIndicator([...Array(arr.length).keys()]),
      "-=0.1"
    );

    // Set total steps and add end label
    totalStepsRef.current = stepIndex - 1;
    currentStepRef.current = 0;
    mainTimeline.addLabel("end");

    mainTimeline.call(() => {
      wasPausedRef.current = false;
      setIsPlaying(false);
      // setCurrentPseudoCodeLine(0); // Reset to initial state
    });

    console.log("addLabelArray:", addLabelArray);

    timelineRef.current = mainTimeline;
  };

  // 1. Add these step functions (replace the commented ones in your code)
  const nextStep = (): void => {
    console.log("currentStepRef.current:", currentStepRef.current);

    if (!timelineRef.current) {
      playAnimation();
      // After playAnimation, timelineRef.current should be set
      if (timelineRef.current) {
        (timelineRef.current as gsap.core.Timeline).pause();
        currentStepRef.current = 0;
        (timelineRef.current as gsap.core.Timeline).play(`step-${0}`);
        currentStepRef.current = 1;
        (timelineRef.current as gsap.core.Timeline).addPause(`step-${1}`);
        console.log("step 0 - 1");
        wasPausedRef.current = true;
      }
      return;
    }

    if (propsRef.current.isPlaying) {
      (timelineRef.current as gsap.core.Timeline).pause();
      // INSERT_YOUR_CODE
      console.log("currentStepRef.current:", currentStepRef.current);
      currentStepRef.current++;
      console.log("currentStepRef.current:", currentStepRef.current);

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
    } else {
      // INSERT_YOUR_CODE
      console.log(
        "currentStepRef.current:",
        currentStepRef.current,
        "totalStepsRef.current:",
        totalStepsRef.current
      );
      if (currentStepRef.current <= totalStepsRef.current) {
        (timelineRef.current as gsap.core.Timeline).play();
        console.log("currentStepRef.current:", currentStepRef.current);

        currentStepRef.current++;
        console.log("currentStepRef.current:", currentStepRef.current);

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

  // const previousStep = (): void => {
  //   if (!timelineRef.current) return;

  //   if (currentStepRef.current > 0) {
  //     // Store the step we're moving away from (current step)
  //     const stepMovingAwayFrom = currentStepRef.current;

  //     // Move to previous step first
  //     currentStepRef.current--;

  //     // Now clear highlights that were added in the step we just moved away from
  //     const stepHighlight = highlightStateRef.current.get(stepMovingAwayFrom);
  //     if (stepHighlight) {
  //       const element = arrayElementsRef.current[stepHighlight.elementIndex];
  //       if (
  //         element &&
  //         element.innerHTML.includes('style="color:rgb(243, 9, 9);"')
  //       ) {
  //         const originalValue =
  //           element.getAttribute("data-original-value") ||
  //           element.textContent?.replace(/<[^>]*>/g, "") ||
  //           "0";
  //         element.innerHTML = originalValue;
  //         element.removeAttribute("data-original-value");
  //       }
  //       highlightStateRef.current.delete(stepMovingAwayFrom);
  //     }

  //     const prevLabel =
  //       currentStepRef.current === 0
  //         ? "step-0"
  //         : `step-${currentStepRef.current}`;

  //     const temp = propsRef.current.speed;
  //     timelineRef.current.timeScale(propsRef.current.speed * 4);
  //     timelineRef.current.reverse();
  //     timelineRef.current.pause(prevLabel);
  //     timelineRef.current.timeScale(temp);

  //     // Ensure digit place indicator reflects the previous step's place
  //     const placeForPrevStep = stepDigitPlaceRef.current.get(
  //       currentStepRef.current
  //     );
  //     if (digitPlaceIndicatorRef.current && placeForPrevStep !== undefined) {
  //       gsap.set(digitPlaceIndicatorRef.current, { opacity: 1 });
  //       digitPlaceIndicatorRef.current.textContent = `Current digit place: ${getDigitPlaceLabel(
  //         placeForPrevStep
  //       )}`;
  //     }

  //     wasPausedRef.current = true;
  //     if (propsRef.current.isPlaying) {
  //       setTimeout(() => {
  //         if (timelineRef.current) {
  //           timelineRef.current.play();
  //         }
  //         wasPausedRef.current = false;
  //       }, 100); // Add a 100ms delay before playing
  //     }
  //   }
  // };

  const pauseAnimation = (): void => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      wasPausedRef.current = true;
    }
  };

  // Reset the animation to the original array positions
  const resetAnimation = (): void => {
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
          });
          // Restore original text content
          element.innerHTML = element.textContent || "0";
        }
      });

      // Restore original array order
      const valueToElements: Map<number, HTMLDivElement[]> = new Map();
      arrayElementsRef.current.forEach((element) => {
        if (element) {
          const value = parseInt(element.textContent || "0");
          if (!valueToElements.has(value)) {
            valueToElements.set(value, []);
          }
          valueToElements.get(value)!.push(element);
        }
      });

      const originalOrder: (HTMLDivElement | null)[] = [];
      for (let i = 0; i < array.length; i++) {
        const value = array[i];
        const queue = valueToElements.get(value);
        if (queue && queue.length > 0) {
          originalOrder.push(queue.shift()!);
        } else {
          originalOrder.push(null);
        }
      }
      arrayElementsRef.current = originalOrder;
    }

    // Reset bucket dashes
    if (bucketContainerRef.current) {
      gsap.set(bucketContainerRef.current, {
        opacity: 0,
        y: 0,
      });
    }

    // Reset bucket dash highlights
    bucketElementsRef.current.forEach((bucketElement) => {
      if (bucketElement) {
        const dashElement = bucketElement.querySelector(
          ".bucket-dash"
        ) as HTMLElement;
        if (dashElement) {
          gsap.set(dashElement, {
            backgroundColor: "#6c757d",
            scaleY: 1,
          });
        }
      }
    });

    // Reset digit place indicator (visibility only; text managed by GSAP)
    if (digitPlaceIndicatorRef.current) {
      gsap.set(digitPlaceIndicatorRef.current, { opacity: 0, y: 0 });
      digitPlaceIndicatorRef.current.textContent = "";
    }

    wasPausedRef.current = false;
    currentStepRef.current = 0;
    highlightStateRef.current.clear();
    stepDigitPlaceRef.current.clear();
    // No React state for digit place; handled by GSAP
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

  const handleSortOrderChange = (ascending: boolean): void => {
    setIsAscending(ascending);
    setIsPlaying(false);
    resetAnimation();
  };

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
  };

  // Effects
  useEffect(() => {
    propsRef.current = { array, speed, isAscending, isPlaying };
    if (timelineRef.current) {
      timelineRef.current.timeScale(speed);
    }
  }, [array, speed, isAscending, isPlaying]);

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
          className="radix-sort-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            minHeight: "600px",
            zIndex: 0,
          }}
        >
          {/* Digit Place Indicator */}
          <div
            ref={digitPlaceIndicatorRef}
            className="digit-place-indicator"
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#495057",
              opacity: 0,
              position: "absolute",
              top: "17%", // Center it vertically in the container
            }}
          ></div>

          {/* Array Elements */}
          <div
            className="array-container"
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 2,
            }}
          >
            {array.map((value, index) => (
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
                  zIndex: 3,
                }}
              >
                {value}
              </div>
            ))}

            {/* Current Element Arrow */}
            <div
              ref={currentElementArrowRef}
              className="current-element-arrow"
              style={{
                position: "absolute",
                left: "0px",
                top: "0px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: 0,
                transform: "translateX(-50%)",
                zIndex: 4,
              }}
            >
              <div
                style={{
                  width: "0",
                  height: "0",
                  borderLeft: `${ARROW_SIZE}px solid transparent`,
                  borderRight: `${ARROW_SIZE}px solid transparent`,
                  borderBottom: "20px solid #28a745",
                }}
              />
              <div
                style={{
                  fontSize: `${ARROW_FONT_SIZE}px`,
                  fontWeight: "600",
                  color: "#28a745",
                  marginTop: "4px",
                }}
              >
                current
              </div>
            </div>
          </div>

          {/* Buckets Container - Dashes with numbers below */}
          <div
            ref={bucketContainerRef}
            className="buckets-container"
            style={{
              display: "flex",
              gap: `${BUCKET_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              marginTop: "4rem",
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <div
                key={`bucket-${digit}`}
                ref={(el) => {
                  bucketElementsRef.current[digit] = el;
                }}
                className={`bucket bucket-${digit}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Bucket Dash - Width matches box width */}
                <div
                  className="bucket-dash"
                  style={{
                    width: `${BOX_WIDTH}px`,
                    height: "4px",
                    backgroundColor: "#6c757d",
                    borderRadius: "2px",
                    transition: "all 0.3s ease",
                    marginBottom: "8px",
                  }}
                />

                {/* Bucket Number Label - Below the dash */}
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#495057",
                  }}
                >
                  {digit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <SortingControls
        limit={150}
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

export default RadixSort;
