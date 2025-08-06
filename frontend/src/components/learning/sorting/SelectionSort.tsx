"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

// Constants for sizing
const BOX_WIDTH = 80;
const BOX_HEIGHT = 80;
const BOX_GAP = 16;
const BOX_BORDER_RADIUS = 12;
const BOX_FONT_SIZE = 20;
const ARROW_HEIGHT = 60;
const ARROW_SIZE = 8;
const ARROW_FONT_SIZE = 14;
const ECLIPSE_HEIGHT = 60;
const TOTAL_BOX_SPACING = BOX_WIDTH + BOX_GAP;

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
}) => {
  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const minArrowRef = useRef<HTMLDivElement>(null);
  const jArrowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);

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
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    });

    return timeline;
  };

  // Highlight boxes animation
  const highlightBoxes = (
    indices: number | number[],
    intensity: "low" | "high" = "low",
    duration: number = 0.6
  ): gsap.core.Timeline => {
    const targetIndices = Array.isArray(indices) ? indices : [indices];
    const elements = targetIndices
      .map((index) => arrayElementsRef.current[index])
      .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement);

    if (elements.length === 0) return gsap.timeline();

    const timeline = gsap.timeline();
    const shadowConfig = {
      low: "0 0 10px #ffd700, 0 2px 15px rgba(255, 215, 0, 0.3)",
      high: "0 0 25px #ff4444, 0 4px 30px rgba(255, 68, 68, 0.5)",
    };

    const glowShadow = shadowConfig[intensity];
    const originalBoxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";

    elements.forEach((element) => {
      timeline
        .to(
          element,
          {
            boxShadow: glowShadow,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          element,
          {
            boxShadow: originalBoxShadow,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );
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

      // Show and position arrows
      if (
        minArrowRef.current &&
        jArrowRef.current &&
        arrayElementsRef.current[i] &&
        arrayElementsRef.current[i + 1]
      ) {
        const minTargetX = i * TOTAL_BOX_SPACING + 40;
        const jTargetX = (i + 1) * TOTAL_BOX_SPACING + 40;

        gsap.set([minArrowRef.current, jArrowRef.current], { opacity: 1 });

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
        mainTimeline.add(
          slideElement(jArrowRef.current, jTargetX, jTargetX, -60, -20, 0.5),
          "-=0.5"
        );

        mainTimeline.add(highlightBoxes(i, "low", 0.6));
        mainTimeline.to({}, { duration: 1 });
      }

      // Find minimum element
      for (let j = i + 1; j < n; j++) {
        if (jArrowRef.current && j > i + 1) {
          const newJTargetX = j * TOTAL_BOX_SPACING + 40;
          mainTimeline.add(
            slideElement(
              jArrowRef.current,
              (j - 1) * TOTAL_BOX_SPACING + 40,
              newJTargetX,
              -20,
              -20,
              0.5
            )
          );
        }

        if (isAscending ? arr[j] < arr[minIndex] : arr[j] > arr[minIndex]) {
          minIndex = j;

          if (minArrowRef.current) {
            const newMinTargetX = j * TOTAL_BOX_SPACING + 40;
            mainTimeline.add(
              slideElement(
                minArrowRef.current,
                minIndex * TOTAL_BOX_SPACING + 40,
                newMinTargetX,
                -20,
                -20,
                0.5
              )
            );
          }
        }
      }

      // Swap if needed
      if (minIndex !== i) {
        const temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;

        // Move arrows out of the way
        if (minArrowRef.current && jArrowRef.current) {
          mainTimeline.add(
            slideElement(
              minArrowRef.current,
              minArrowRef.current.offsetLeft,
              minIndex * TOTAL_BOX_SPACING + 40,
              -20,
              -60,
              0.5
            )
          );
          mainTimeline.add(
            slideElement(
              jArrowRef.current,
              jArrowRef.current.offsetLeft,
              i * TOTAL_BOX_SPACING + 40,
              -20,
              -60,
              0.5
            ),
            "-=0.5"
          );
          gsap.set([minArrowRef.current, jArrowRef.current], { opacity: 0 });
        }

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
      }

      mainTimeline.add(animateSortedIndicator(i));
    }

    // Reset array elements order
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

    timelineRef.current = mainTimeline;
  };

  const pauseAnimation = (): void => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      wasPausedRef.current = true;
    }
  };

  const resetAnimation = (): void => {
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
            min
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
