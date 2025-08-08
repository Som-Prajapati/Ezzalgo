"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

// Constants for sizing
const BOX_WIDTH = 80;
const BOX_HEIGHT = 80;
const BOX_GAP = 14;
const BOX_BORDER_RADIUS = 12;
const BOX_FONT_SIZE = 20;
const ARROW_HEIGHT = 60;
const ARROW_SIZE = 8;
const ARROW_FONT_SIZE = 16;
const TOTAL_BOX_SPACING = BOX_WIDTH + BOX_GAP;
const ARROW_Y_OFFSET_UP = -(BOX_HEIGHT * 1.5) / 2;
const ARROW_Y_OFFSET_DOWN = (BOX_HEIGHT * 2.4) / 2;
const ARROW_X_OFFSET = BOX_WIDTH / 2;
// const ARROW_X_OFFSET_KEY = BOX_WIDTH / 2 - 10;

interface InsertionSortProps {
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

const InsertionSort: React.FC<InsertionSortProps> = ({
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
  const jArrowRef = useRef<HTMLDivElement>(null);
  const jPlusOneArrowRef = useRef<HTMLDivElement>(null);
  const keyArrowRef = useRef<HTMLDivElement>(null);
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
      { x: toX, y: toY, duration, ease: "power1.inOut" }
    );
  };

  // New animation: slideElementTo
  // Animates an element from its current position to (toX, toY) over the given duration.
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

  // Play animation
  const playAnimation = (): void => {
    if (wasPausedRef.current && timelineRef.current) {
      timelineRef.current.play();
      wasPausedRef.current = false;
      return;
    }

    const arr = [...array];
    const n = arr.length;
    const mainTimeline = gsap.timeline();

    // Show and position arrows with slide down animation
    if (keyArrowRef.current && jArrowRef.current && jPlusOneArrowRef.current) {
      // Position key arrow behind element at index i (starting at 1)

      if (
        arrayElementsRef.current[0] &&
        arrayElementsRef.current[1] &&
        keyArrowRef.current &&
        jArrowRef.current &&
        jPlusOneArrowRef.current
      ) {
        const keyBox = arrayElementsRef.current[1];
        const jBox = arrayElementsRef.current[0];
        const jPlusOneBox = arrayElementsRef.current[1];
        if (keyBox) {
          console.log("zIndex of keyBox:", keyBox.style.zIndex);
        }

        mainTimeline.add(
          gsap.fromTo(
            keyArrowRef.current,
            {
              x: ARROW_X_OFFSET + TOTAL_BOX_SPACING,
              y: 0,
              opacity: 0,
              zIndex: -1,
            },
            {
              y: ARROW_Y_OFFSET_UP,
              opacity: 1,
              duration: 0.5,
              ease: "power1.out",
            }
          )
        );
        mainTimeline.add(
          gsap.fromTo(
            jArrowRef.current,
            {
              x: ARROW_X_OFFSET,
              y: 0,
              opacity: 0,
              zIndex: -1,
            },
            {
              y: ARROW_Y_OFFSET_DOWN,
              opacity: 1,
              duration: 0.5,
              ease: "power1.out",
            }
          ),
          "-=0.5"
        );
        mainTimeline.add(
          gsap.fromTo(
            jPlusOneArrowRef.current,
            {
              x: ARROW_X_OFFSET + TOTAL_BOX_SPACING,
              y: 0,
              opacity: 0,
              zIndex: -1,
            },
            {
              y: ARROW_Y_OFFSET_DOWN,
              opacity: 1,
              duration: 0.5,
              ease: "power1.out",
            }
          ),
          "-=0.5"
        );
      }
    }

    // Insertion sort algorithm
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;

      //

      // Slide the key arrow and the key box up by box width + 20 px
      if (keyArrowRef.current && arrayElementsRef.current[i]) {
        const keyBox = arrayElementsRef.current[i] as HTMLElement;
        const keyBoxRect = keyBox.getBoundingClientRect();
        const boxHeight = keyBoxRect.height;

        if (i > 1) {
          // Animate keyArrow to move above the i-th element
          mainTimeline.add(
            slideElementTo(
              keyArrowRef.current,
              ARROW_X_OFFSET + i * TOTAL_BOX_SPACING,
              `+=0`,
              0.3
            ),
            "+=0.5"
          );

          // Animate jArrow to move above the j-th element
          if (jArrowRef.current && typeof j === "number" && j >= 0) {
            mainTimeline.add(
              slideElementTo(
                jArrowRef.current,
                j * TOTAL_BOX_SPACING + ARROW_X_OFFSET,
                `+=0`,
                0.3
              ),
              "-=0.3"
            );
          }

          // Animate jPlusOneArrow to move above the (j+1)-th element
          if (
            jPlusOneArrowRef.current &&
            typeof j === "number" &&
            j + 1 < arr.length
          ) {
            mainTimeline.add(
              slideElementTo(
                jPlusOneArrowRef.current,
                (j + 1) * TOTAL_BOX_SPACING + ARROW_X_OFFSET,
                `+=0`,
                0.3
              ),
              "-=0.3"
            );
          }
        }

        mainTimeline.add(
          slideElementTo(
            keyArrowRef.current,
            "+=0",
            `-=${TOTAL_BOX_SPACING}`,
            0.5
          ),
          "+=0.5"
        );

        // Make the key box slide up by animating its y position to moveUpY using gsap.to
        mainTimeline.add(
          slideElementTo(
            keyBox,
            "+=0", // keep current x
            `-=${TOTAL_BOX_SPACING}`,
            0.3
          ),
          "-=0.6"
        );
        // Add a 1 second gap to the mainTimeline for clarity before the next animation
      }

      while (j >= 0 && (isAscending ? arr[j] > key : arr[j] < key)) {
        arr[j + 1] = arr[j];
        j = j - 1;

        if (
          keyArrowRef.current &&
          arrayElementsRef.current[i] &&
          arrayElementsRef.current[j + 1] &&
          jArrowRef.current &&
          jPlusOneArrowRef.current
        ) {
          const keyBox = arrayElementsRef.current[j + 2] as HTMLElement;
          const keyBoxRect = keyBox.getBoundingClientRect();
          const boxHeight = keyBoxRect.height;
          const moveUpY = -(boxHeight + 10);

          const jBox = arrayElementsRef.current[j + 1] as HTMLElement;
          const keyArrow = keyArrowRef.current;

          const keyFromX = (i - 1) * TOTAL_BOX_SPACING;
          const keyToX = (i - 2) * TOTAL_BOX_SPACING;
          const jFromX = j * TOTAL_BOX_SPACING;
          const jToX = (j + 1) * TOTAL_BOX_SPACING;
          const currentKeyIndex = j;
          const keyFromXFixed = currentKeyIndex * TOTAL_BOX_SPACING;
          const keyToXFixed = (currentKeyIndex - 1) * TOTAL_BOX_SPACING;

          mainTimeline.add(
            slideElementTo(keyArrow, `-=${TOTAL_BOX_SPACING}`, `+=0`, 0.5)
          );
          mainTimeline.add(
            slideElementTo(keyBox, `-=${TOTAL_BOX_SPACING}`, `+=0`, 0.3),
            "-=0.6"
          );
          mainTimeline.add(
            slideElementTo(jBox, `+=${TOTAL_BOX_SPACING}`, 0, 0.3),
            "-=0.6"
          );
          mainTimeline.add(
            slideElementTo(
              jArrowRef.current,
              `-=${TOTAL_BOX_SPACING}`,
              `+=0`,
              0.5
            )
          );
          mainTimeline.add(
            slideElementTo(
              jPlusOneArrowRef.current,
              `-=${TOTAL_BOX_SPACING}`,
              `+=0`,
              0.5
            ),
            "-=0.5"
          );
        }

        // Swap the key element with the j element in arrayElementsRef to reflect the visual change

        if (arrayElementsRef.current) {
          const texts = arrayElementsRef.current.map(
            (el: any) => el?.textContent
          );
          console.log("arrayElementsRef text:", texts);
        }
        if (arrayElementsRef.current) {
          const temp = arrayElementsRef.current[j + 2];
          arrayElementsRef.current[j + 2] = arrayElementsRef.current[j + 1];
          arrayElementsRef.current[j + 1] = temp;
          console.log("temp:", temp?.textContent);
          console.log(
            "arrayElementsRef.current[j + 1]:",
            arrayElementsRef.current[j + 1]?.textContent
          );
          console.log(
            "arrayElementsRef.current[j]:",
            arrayElementsRef.current[j]?.textContent
          );
        }
      }
      arr[j + 1] = key;

      // Define keyBox if not already defined
      let keyBox: HTMLElement | null = null;

      if (
        arrayElementsRef.current &&
        arrayElementsRef.current[j + 1] &&
        keyArrowRef.current
      ) {
        keyBox = arrayElementsRef.current[j + 1];
        mainTimeline.add(
          slideElementTo(
            keyArrowRef.current,
            `+=0`,
            `+=${TOTAL_BOX_SPACING}`,
            0.5
          )
        );
        if (keyBox) {
          mainTimeline.add(slideElementTo(keyBox, "+=0", 0, 0.3), "-=0.6");
        }
      }
      if (arrayElementsRef.current) {
        const texts = arrayElementsRef.current.map(
          (el: any) => el?.textContent
        );
        console.log("arrayElementsRef text:", texts);
      }
    }
    // Slide the keyArrow, jArrow, and jPlusOneArrow back to their original positions in a single for loop

    if (keyArrowRef.current && jArrowRef.current && jPlusOneArrowRef.current) {
      // Set zIndex before animation to ensure arrows are above other elements during fade out

      mainTimeline.add(
        gsap.to(keyArrowRef.current, {
          x: "+=0",
          y: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
        })
      );
      mainTimeline.add(
        gsap.to(jArrowRef.current, {
          x: "+=0",
          y: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
        }),
        "-=0.5"
      );
      mainTimeline.add(
        gsap.to(jPlusOneArrowRef.current, {
          x: "+=0",
          y: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
        }),
        "-=0.5"
      );
    }

    console.log("Sorted array:", arr);
  };

  const pauseAnimation = (): void => {
    // TODO: Implement pause functionality
  };

  const resetAnimation = (): void => {
    // TODO: Implement reset functionality
  };

  const nextStep = (): void => {
    // TODO: Implement next step functionality
    console.log("Next step");
  };

  const previousStep = (): void => {
    // TODO: Implement previous step functionality
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
      className="insertion-sort-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
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
              zIndex: 2,
            }}
          >
            {value}
          </div>
        ))}

        {/* Arrows Container */}
        {/* <div
        className="arrows-container"
        style={{
          display: "flex",
          gap: `${BOX_GAP}px`,
          position: "relative",
          width: `${array.length * TOTAL_BOX_SPACING - BOX_GAP}px`,
          height: `${ARROW_HEIGHT}px`,
        }}
      > */}
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
              fontWeight: 600,
              color: "#0d6efd",
              marginTop: "4px",
            }}
          >
            j
          </div>
        </div>

        {/* J+1 Arrow */}
        <div
          ref={jPlusOneArrowRef}
          className="j-plus-one-arrow"
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
              borderBottom: "20px solid #fd7e14",
            }}
          />
          <div
            style={{
              fontSize: `${ARROW_FONT_SIZE}px`,
              fontWeight: "600",
              color: "#fd7e14",
              marginTop: "4px",
            }}
          >
            j+1
          </div>
        </div>

        {/* Key Arrow */}
        <div
          ref={keyArrowRef}
          className="key-arrow"
          style={{
            position: "absolute",
            left: ARROW_FONT_SIZE === 16 ? "-12px" : "0px",
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
              fontSize: `${ARROW_FONT_SIZE}px`,
              fontWeight: "600",
              color: "#28a745",
              marginBottom: "4px",
            }}
          >
            key
          </div>
          <div
            style={{
              width: "0",
              height: "0",
              borderLeft: `${ARROW_SIZE}px solid transparent`,
              borderRight: `${ARROW_SIZE}px solid transparent`,
              borderTop: "20px solid #28a745",
            }}
          />
        </div>
      </div>
    </div>
    // </div>
  );
};

export default InsertionSort;
