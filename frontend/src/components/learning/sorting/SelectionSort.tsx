"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

// Constants for sizing
// const BOX_WIDTH = 80;
// const BOX_HEIGHT = 80;
// const BOX_GAP = 16;
// const BOX_BORDER_RADIUS = 12;
// const BOX_FONT_SIZE = 20;
// const ARROW_HEIGHT = 60;
// const ARROW_SIZE = 8;
// const ARROW_FONT_SIZE = 14;
// const ECLIPSE_HEIGHT = 60;
// const TOTAL_BOX_SPACING = BOX_WIDTH + BOX_GAP;
// Dynamic sizing based on array length
// Dynamic sizing based on array length
const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 80,
      BOX_HEIGHT: 80,
      BOX_GAP: 16,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 20,
      ARROW_SIZE: 8,
      ARROW_FONT_SIZE: 16,
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
    };
  }
  // else {
  //   return {
  //     BOX_WIDTH: 50,
  //     BOX_HEIGHT: 50,
  //     BOX_GAP: 10,
  //     BOX_BORDER_RADIUS: 8,
  //     BOX_FONT_SIZE: 16,
  //     ARROW_SIZE: 4,
  //     ARROW_FONT_SIZE: 10,
  //   };
  // }
};
const ARROW_HEIGHT = 60;
// const ARROW_SIZE = 8;
// const ARROW_FONT_SIZE = 14;
const ECLIPSE_HEIGHT = 60;
// const TOTAL_BOX_SPACING = BOX_WIDTH + BOX_GAP;

interface SelectionSortProps {
  array: number[];
  speed: number;
  isAscending: boolean;
  isPlaying: boolean;
  registerPlayFunction?: (fn: () => void) => void;
  registerPauseFunction?: (fn: () => void) => void;
  registerResetFunction?: (fn: () => void) => void;
  registerNextStepFunction?: (fn: () => void) => void;
  registerPreviousStepFunction?: (fn: () => void) => void;
  onAnimationEnd?: () => void;
}

const SelectionSort: React.FC<SelectionSortProps> = ({
  array,
  speed,
  isAscending,
  isPlaying,
  registerPlayFunction,
  registerPauseFunction,
  registerResetFunction,
  registerNextStepFunction,
  registerPreviousStepFunction,
  onAnimationEnd,
}) => {
  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const minArrowRef = useRef<HTMLDivElement>(null);
  const jArrowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);

  // Get dynamic sizing based on array length
  const dynamicSizing = getDynamicSizing(array.length);
  const {
    BOX_WIDTH,
    BOX_HEIGHT,
    BOX_GAP,
    BOX_BORDER_RADIUS,
    BOX_FONT_SIZE,
    ARROW_SIZE,
    ARROW_FONT_SIZE,
  } = dynamicSizing;
  const TOTAL_BOX_SPACING = BOX_WIDTH + BOX_GAP;

  const propsRef = useRef({ array, speed, isAscending, isPlaying });

  // GSAP animation function to slide element
  const slideElement = (
    element: HTMLElement,
    fromX: number,
    toX: number,
    fromY: number = 0,
    toY: number = 0,
    duration: number = 0.5
  ): gsap.core.Tween => {
    return gsap.fromTo(
      element,
      { x: fromX, y: fromY, opacity: 1 },
      { x: toX, y: toY, duration, ease: "power2.out" }
    );
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
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    });

    return timeline;
  };

  // Highlight min element (persistent red)
  const highlightMinElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#ffebee",
      borderColor: "#f44336",
      boxShadow:
        "0 0 20px rgba(244, 67, 54, 0.4), 0 2px 15px rgba(244, 67, 54, 0.2)",
      duration: 0.4,
      ease: "power2.out",
    });

    return timeline;
  };

  // Highlight j element (blue comparison)
  const highlightJElement = (index: number): gsap.core.Timeline => {
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

  // Remove highlighting from element
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

  // Eclipse swap animation
  const eclipseSwap = (
    elementA: HTMLElement,
    elementB: HTMLElement,
    duration: number = 1.2
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    const indexA = arrayElementsRef.current.findIndex((el) => el === elementA);
    const indexB = arrayElementsRef.current.findIndex((el) => el === elementB);

    if (indexA === -1 || indexB === -1) {
      return timeline;
    }

    timeline.call(() => {
      const currentXA = gsap.getProperty(elementA, "x") as number;
      const currentXB = gsap.getProperty(elementB, "x") as number;

      const distance = (indexB - indexA) * TOTAL_BOX_SPACING;
      const midPoint = distance / 2;

      const swapAnimation = gsap.timeline();

      // Element A moves in upper arc with flip
      swapAnimation
        .to(
          elementA,
          {
            x: currentXA + midPoint,
            y: -ECLIPSE_HEIGHT,
            rotation: 180,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          elementA,
          {
            x: currentXA + distance,
            y: 0,
            rotation: 360,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );

      // Element B moves in lower arc with flip
      swapAnimation
        .to(
          elementB,
          {
            x: currentXB - midPoint,
            y: ECLIPSE_HEIGHT,
            rotation: -180,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          elementB,
          {
            x: currentXB - distance,
            y: 0,
            rotation: -360,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );

      swapAnimation.call(() => {
        gsap.set([elementA, elementB], { rotation: 0 });

        // Swap array references
        const temp = arrayElementsRef.current[indexA];
        arrayElementsRef.current[indexA] = arrayElementsRef.current[indexB];
        arrayElementsRef.current[indexB] = temp;
      });

      timeline.add(swapAnimation);
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

    // Hide arrows initially
    if (minArrowRef.current && jArrowRef.current) {
      gsap.set([minArrowRef.current, jArrowRef.current], { opacity: 0 });
    }

    const arr = [...array];
    const n = arr.length;
    const mainTimeline = gsap.timeline();
    // Selection sort algorithm
    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;

      // Show and position arrows at start of each iteration
      if (
        minArrowRef.current &&
        jArrowRef.current &&
        arrayElementsRef.current[i] &&
        arrayElementsRef.current[i + 1]
      ) {
        const minTargetX = i * TOTAL_BOX_SPACING + BOX_WIDTH * 0.25;
        const jTargetX = (i + 1) * TOTAL_BOX_SPACING + BOX_WIDTH * 0.75;

        // Position min arrow at current minimum (i)
        mainTimeline.add(
          slideElement(
            minArrowRef.current,
            minTargetX,
            minTargetX,
            -60,
            -20,
            0.5
          )
        );

        // Position j arrow at first comparison position (i + 1)
        mainTimeline.add(
          slideElement(jArrowRef.current, jTargetX, jTargetX, -60, -20, 0.5),
          "-=0.5"
        );

        // // Make arrows visible
        // mainTimeline.to(
        //   [minArrowRef.current, jArrowRef.current],
        //   {
        //     opacity: 1,
        //     duration: 0.3,
        //   },
        //   "-=0.2"
        // );

        // Highlight initial min element (red)
        mainTimeline.add(highlightMinElement(i), "-=0.5");
        mainTimeline.to({}, { duration: 0.5 });
      }

      // Find minimum element
      for (let j = i + 1; j < n; j++) {
        // Move j arrow to current comparison position
        if (jArrowRef.current && j > i + 1) {
          const newJTargetX = j * TOTAL_BOX_SPACING + BOX_WIDTH * 0.75;
          mainTimeline.add(
            slideElement(
              jArrowRef.current,
              (j - 1) * TOTAL_BOX_SPACING + BOX_WIDTH * 0.75,
              newJTargetX,
              -20,
              -20,
              0.3
            )
          );
          // Remove highlight from previous j only if it's not the current min
          if (j - 1 !== minIndex) {
            mainTimeline.add(removeHighlight(j - 1), "-=0.4");
          }
        }

        // Highlight current j element (blue) only if it's not the current min
        if (j !== minIndex) {
          mainTimeline.add(highlightJElement(j), "-=0.3");
        }

        // Small pause for comparison
        mainTimeline.to({}, { duration: 0.4 });

        // Check if we found a new minimum
        if (isAscending ? arr[j] < arr[minIndex] : arr[j] > arr[minIndex]) {
          const oldMinIndex = minIndex;
          minIndex = j;

          // Remove red highlight from old minimum only if it's different from new min
          if (oldMinIndex !== j) {
            mainTimeline.add(removeHighlight(oldMinIndex), "-=0.1");
          }

          // Move min arrow to new minimum position
          if (minArrowRef.current) {
            const newMinTargetX = j * TOTAL_BOX_SPACING + BOX_WIDTH * 0.25;
            mainTimeline.add(
              slideElement(
                minArrowRef.current,
                oldMinIndex * TOTAL_BOX_SPACING + BOX_WIDTH * 0.25,
                newMinTargetX,
                -20,
                -20,
                0.5
              ),
              "-=0.2"
            );
          }

          // Highlight the new minimum (red) - this will override the blue j highlight
          mainTimeline.add(highlightMinElement(j), "-=0.1");
        } else {
          // If j is not the new min, ensure the current min stays highlighted
          mainTimeline.add(highlightMinElement(minIndex), "-=0.2");
        }

        // Small pause between comparisons
        mainTimeline.to({}, { duration: 0.3 });
      }

      // Remove highlight from last j element if it's not the min
      const lastJ = n - 1;
      if (lastJ !== minIndex) {
        mainTimeline.add(removeHighlight(lastJ));
      }

      // Swap if needed
      if (minIndex !== i) {
        const temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;

        if (minArrowRef.current) {
          mainTimeline.add(
            slideElement(
              minArrowRef.current,
              minIndex * TOTAL_BOX_SPACING + BOX_WIDTH * 0.25,
              minIndex * TOTAL_BOX_SPACING + BOX_WIDTH * 0.25,
              -20,
              -80,
              0.5
            )
          );
        }
        console.log(i);
        if (jArrowRef.current) {
          const x_initial = Number(gsap.getProperty(jArrowRef.current, "x"));
          mainTimeline.add(
            slideElement(
              jArrowRef.current,
              x_initial + BOX_WIDTH + 15,
              x_initial + BOX_WIDTH + 15,
              -20,
              -80,
              0.5
            ),
            "-=0.5"
          );
        }

        // Hide arrows before swap
        if (minArrowRef.current && jArrowRef.current) {
          mainTimeline.to(
            [minArrowRef.current, jArrowRef.current],
            {
              opacity: 0,
              duration: 0.2,
            },
            "-=0.6"
          );
        }

        mainTimeline.to({}, { duration: 0.3 });
        // Visual swap
        if (arrayElementsRef.current[i] && arrayElementsRef.current[minIndex]) {
          mainTimeline.add(
            eclipseSwap(
              arrayElementsRef.current[i] as HTMLElement,
              arrayElementsRef.current[minIndex] as HTMLElement,
              1.2
            )
          );

          // Update references
          const tempRef = arrayElementsRef.current[i];
          arrayElementsRef.current[i] = arrayElementsRef.current[minIndex];
          arrayElementsRef.current[minIndex] = tempRef;
        }

        mainTimeline.to(
          [minArrowRef.current, jArrowRef.current],
          {
            opacity: 0,
            duration: 0.3,
          },
          "+=0.5"
        );
      } else {
        // No swap needed, just hide arrows and remove min highlight
        if (minArrowRef.current && jArrowRef.current) {
          mainTimeline.to([minArrowRef.current, jArrowRef.current], {
            opacity: 0,
            duration: 0.3,
          });
        }
        // Remove red highlight from min element before marking as sorted
        mainTimeline.add(removeHighlight(minIndex), "-=0.2");
      }

      // Mark element as sorted
      mainTimeline.add(animateSortedIndicator(i));
      mainTimeline.to({}, { duration: 0.5 });
    }

    // Mark final element as sorted
    mainTimeline.add(animateSortedIndicator(n - 1));

    // Reset array elements order for reference tracking
    if (arrayElementsRef.current && Array.isArray(arrayElementsRef.current)) {
      const valueToIndices: Record<string, number[]> = {};
      arrayElementsRef.current.forEach((el, idx) => {
        if (el) {
          const val = el.textContent ?? "";
          if (!valueToIndices[val]) valueToIndices[val] = [];
          valueToIndices[val].push(idx);
        }
      });

      const newOrder: (HTMLDivElement | null)[] = array.map((val) => {
        const valStr = val.toString();
        if (valueToIndices[valStr] && valueToIndices[valStr].length > 0) {
          const idx = valueToIndices[valStr].shift()!;
          return arrayElementsRef.current[idx];
        }
        return null;
      });

      arrayElementsRef.current = newOrder;
    }
    // We use mainTimeline.call(...) to execute a function at the end of the GSAP timeline.
    // This ensures that after all animations are complete, we set isPlaying to false and wasPausedRef to false.
    // The .call() method schedules the callback at the current point in the timeline, which here is the end.
    mainTimeline.call(() => {
      wasPausedRef.current = false;
      if (onAnimationEnd) onAnimationEnd();
      console.log(propsRef.current.isPlaying, wasPausedRef.current);
    });

    timelineRef.current = mainTimeline;
  };

  const pauseAnimation = (): void => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      wasPausedRef.current = true;
    }
  };

  const resetAnimation = (): void => {
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
            backgroundColor: "#f8f9fa",
            borderColor: "#e9ecef",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          });
        }
      });
    }

    if (minArrowRef.current && jArrowRef.current) {
      gsap.set([minArrowRef.current, jArrowRef.current], {
        opacity: 0,
        x: 0,
        y: 0,
      });
    }

    wasPausedRef.current = false;
  };

  const nextStep = (): void => {
    // Next step implementation placeholder
    console.log("Next step");
  };

  const previousStep = (): void => {
    // Previous step implementation placeholder
    console.log("Previous step");
  };

  // Effects
  useEffect(() => {
    propsRef.current = { array, speed, isAscending, isPlaying };
  }, [array, speed, isAscending, isPlaying]);

  useEffect(() => {
    arrayElementsRef.current = arrayElementsRef.current.slice(0, array.length);
  }, [array]);

  useEffect(() => {
    registerPlayFunction?.(playAnimation);
    registerPauseFunction?.(pauseAnimation);
    registerResetFunction?.(resetAnimation);
    registerNextStepFunction?.(nextStep);
    registerPreviousStepFunction?.(previousStep);
  }, []);

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="selection-sort-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
        color: "#1a1a1a",
        minHeight: "300px",
      }}
    >
      {/* Array Elements */}
      <div
        className="array-container"
        style={{
          display: "flex",
          gap: `${BOX_GAP}px`,
          alignItems: "center",
          position: "relative",
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
            }}
          >
            {value}
          </div>
        ))}
      </div>

      {/* Arrows Container */}
      <div
        className="arrows-container"
        style={{
          display: "flex",
          gap: `${BOX_GAP}px`,
          position: "relative",
          width: `${array.length * TOTAL_BOX_SPACING - BOX_GAP}px`,
          height: `${ARROW_HEIGHT}px`,
        }}
      >
        {/* Min Arrow */}
        <div
          ref={minArrowRef}
          className="min-arrow"
          style={{
            position: "absolute",
            left: "0px",
            top: "0px",
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
              borderBottom: "20px solid #dc3545",
            }}
          />
          <div
            style={{
              fontSize: `${ARROW_FONT_SIZE}px`,
              fontWeight: "600",
              color: "#dc3545",
              marginTop: "4px",
            }}
          >
            {isAscending ? "min" : "max"}
          </div>
        </div>

        {/* J Arrow */}
        <div
          ref={jArrowRef}
          className="j-arrow"
          style={{
            position: "absolute",
            left: "0px",
            top: "0px",
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
              fontWeight: "600",
              color: "#0d6efd",
              marginTop: "4px",
            }}
          >
            j
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionSort;
