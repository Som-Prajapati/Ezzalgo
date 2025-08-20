"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import Controls from "./Control";
import SortingControls from "./SortingControl";

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
      IMAGE_HEIGHT: 260,
      IMAGE_WIDTH: 260,
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
      IMAGE_HEIGHT: 200,
      IMAGE_WIDTH: 200,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const BubbleSort: React.FC<SidebarProps> = ({
  isOpen,
  width
}) => {
  // Fixed initial array to prevent hydration mismatch
  const getFixedInitialArray = () => [42, 17, 89, 31, 65, 8];
  const initialArray = getFixedInitialArray();

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(6);
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const iArrowRef = useRef<HTMLDivElement>(null);
  const jArrowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, isAscending, isPlaying });
  const bubbleRef = useRef<HTMLDivElement>(null);

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
  } = dynamicSizing;
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

  const scaleSwap = (
    elementB: HTMLElement,
    elementA: HTMLElement,
    duration: number = 1.2
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    const indexA = arrayElementsRef.current.findIndex((el) => el === elementA);
    const indexB = arrayElementsRef.current.findIndex((el) => el === elementB);
    if (indexA === -1 || indexB === -1) {
      return timeline;
    }
    timeline.call(() => {
      const temp = arrayElementsRef.current[indexA];
      arrayElementsRef.current[indexA] = arrayElementsRef.current[indexB];
      arrayElementsRef.current[indexB] = temp;

      const currentXA = gsap.getProperty(elementA, "x") as number;
      const currentXB = gsap.getProperty(elementB, "x") as number;
      const distance = (indexB - indexA) * TOTAL_BOX_SPACING;

      // Store original z-index values
      const originalZIndexA = elementA.style.zIndex || "auto";
      const originalZIndexB = elementB.style.zIndex || "auto";

      const swapAnimation = gsap.timeline();

      // Set z-index: left element (A) higher than right element (B)
      swapAnimation.set(elementA, { zIndex: 1001 }, 0);
      swapAnimation.set(elementB, { zIndex: 1000 }, 0);

      // Element A (left) scales up, moves right to midpoint, then scales back to normal when reaching final position
      swapAnimation
        .to(
          elementA,
          {
            scale: 1.5,
            x: currentXA + distance / 2,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          elementA,
          {
            scale: 1,
            x: currentXA + distance,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );

      // Element B (right) scales down, moves left to midpoint, then scales back to normal when reaching final position
      swapAnimation
        .to(
          elementB,
          {
            scale: 0.5,
            x: currentXB - distance / 2,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          elementB,
          {
            scale: 1,
            x: currentXB - distance,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );

      swapAnimation.call(() => {
        // Reset all properties including z-index back to original values
        gsap.set(elementA, {
          scale: 1,
          zIndex: originalZIndexA === "auto" ? "auto" : originalZIndexA,
        });
        gsap.set(elementB, {
          scale: 1,
          zIndex: originalZIndexB === "auto" ? "auto" : originalZIndexB,
        });
      });

      timeline.add(swapAnimation);
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

  // Play animation with step callbacks
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
    const mainTimeline = gsap.timeline();
    mainTimeline.timeScale(propsRef.current.speed);
    currentStepRef.current = 0;

    // Add initial label
    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
    });

    // Show and position arrows with slide down animation
    if (iArrowRef.current && jArrowRef.current) {
      if (arrayElementsRef.current[0] && arrayElementsRef.current[1]) {
        mainTimeline.add(
          gsap.fromTo(
            iArrowRef.current,
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
          )
        );
        mainTimeline.add(
          gsap.fromTo(
            jArrowRef.current,
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

    let stepIndex = 1;

    // Bubble sort algorithm animation with labels
    for (let i = 0; i < n - 1; i++) {
      if (iArrowRef.current && jArrowRef.current) {
        if (i !== 0) {
          mainTimeline.add(
            slideElementTo(
              jArrowRef.current,
              TOTAL_BOX_SPACING + ARROW_X_OFFSET,
              `+=0`,
              0.3
            ),
            "+=0.2"
          );
          mainTimeline.add(
            slideElementTo(iArrowRef.current, ARROW_X_OFFSET, `+=0`, 0.3),
            "-=0.3"
          );
          if (bubbleRef.current) {
            mainTimeline.add(
              gsap.to(bubbleRef.current, { x: 0, y: 0, duration: 0.2 }),
              "-=0.2"
            );
          }
        }
      }

      for (let j = 0; j < n - i - 1; j++) {
        // Add label for this step
        mainTimeline.addLabel(`step-${stepIndex}`, "+=0");
        // The .call() method in GSAP timelines does not pass the label or stepIndex as an argument.
        // To ensure the correct value is used, capture the current value in a local variable.
        // This avoids closure issues with stepIndex in loops.
        {
          const thisStep = stepIndex;
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
        }

        stepIndex++;

        // Highlight comparison elements
        mainTimeline.add(highlightBoxes([j, j + 1], "high"), "+=0.2");

        // Check if swap is needed
        const shouldSwap = isAscending
          ? arr[j] > arr[j + 1]
          : arr[j] < arr[j + 1];

        if (shouldSwap) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;

          // Animate the swap
          if (arrayElementsRef.current[j] && arrayElementsRef.current[j + 1]) {
            const leftElement = arrayElementsRef.current[j];
            const rightElement = arrayElementsRef.current[j + 1];

            if (leftElement && rightElement) {
              mainTimeline.add(
                scaleSwap(leftElement, rightElement, 0.8),
                "+=0.2"
              );
            }
            mainTimeline.add(gsap.to({}, { duration: 0.5 }));
            const tempRef = arrayElementsRef.current[j];
            arrayElementsRef.current[j] = arrayElementsRef.current[j + 1];
            arrayElementsRef.current[j + 1] = tempRef;
          }
        }

        // Move arrows to next position
        if (iArrowRef.current && jArrowRef.current && j < n - i - 2) {
          mainTimeline.add(
            slideElementTo(
              iArrowRef.current,
              `+=${TOTAL_BOX_SPACING}`,
              `+=0`,
              0.3
            ),
            "+=0.5"
          );

          mainTimeline.add(
            slideElementTo(
              jArrowRef.current,
              `+=${TOTAL_BOX_SPACING}`,
              `+=0`,
              0.3
            ),
            "-=0.3"
          );

          if (bubbleRef.current) {
            mainTimeline.add(
              slideElementTo(
                bubbleRef.current,
                `+=${TOTAL_BOX_SPACING}`,
                0,
                0.3
              ),
              "-=0.3"
            );
          }
        }
      }

      // Mark the last element as sorted
      const sortedIndex = n - 1 - i;
      mainTimeline.add(gsap.to({}, { duration: 0.5 }));
      mainTimeline.addLabel(`step-${stepIndex}`, "+=0");
      const thisStep = stepIndex;
      mainTimeline.call(() => {
        currentStepRef.current = thisStep;
      });
      mainTimeline.add(animateSortedIndicator(sortedIndex), "+=0");
      stepIndex++;
    }

    // Add final label and mark first element as sorted
    mainTimeline.addLabel(`step-${stepIndex}`);
    const thisStep = stepIndex;
    mainTimeline.call(() => {
      currentStepRef.current = thisStep;
    });
    mainTimeline.add(animateSortedIndicator(0), "+=0.3");

    // Hide arrows
    if (iArrowRef.current && jArrowRef.current) {
      mainTimeline.add(
        gsap.to(iArrowRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
        }),
        "+=0.5"
      );
      mainTimeline.add(
        gsap.to(jArrowRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
        }),
        "-=0.5"
      );
    }
    totalStepsRef.current = stepIndex;
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
          // Reset speed back to original and resume playing using setTimeout
          // to break out of the current call stack
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

    // Reset arrows
    if (iArrowRef.current && jArrowRef.current) {
      gsap.killTweensOf([iArrowRef.current, jArrowRef.current]);
      gsap.set([iArrowRef.current, jArrowRef.current], {
        opacity: 0,
        x: 0,
        y: 0,
        zIndex: "auto",
      });
    }

    // Reset bubble image
    if (bubbleRef.current) {
      gsap.killTweensOf(bubbleRef.current);
      gsap.set(bubbleRef.current, {
        x: 0,
        y: 0,
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
          className="bubble-sort-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            // backgroundColor: "#ffffff",
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
            <div
              ref={bubbleRef}
              style={{
                position: "absolute",
                top: `${-IMAGE_HEIGHT * 0.34}px`,
                left: `${ARROW_X_OFFSET * 1.1 + BOX_WIDTH / 2}px`,
                transform: "translateX(-50%)",
                width: `${IMAGE_WIDTH}px`,
                height: `${IMAGE_HEIGHT}px`,
                opacity: 0.8,
                zIndex: -1,
              }}
            >
              <Image
                src="/Images/BubbbleImage.png"
                alt="swap indicator"
                width={IMAGE_WIDTH}
                height={IMAGE_HEIGHT}
                style={{ objectFit: "contain" }}
              />
            </div>
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

            {/* i Arrow */}
            <div
              ref={iArrowRef}
              className="i-arrow"
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
                i
              </div>
            </div>

            {/* j Arrow */}
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
                j
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <SortingControls
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

export default BubbleSort;

// "use client";
// import React, { useRef, useEffect } from "react";
// import { gsap } from "gsap";
// import Image from "next/image";
// // Constants for sizing
// const BOX_WIDTH = 80;
// const BOX_HEIGHT = 80;
// const BOX_GAP = 14;
// const BOX_BORDER_RADIUS = 12;
// const BOX_FONT_SIZE = 20;
// const ARROW_SIZE = 8;
// const ARROW_FONT_SIZE = 16;
// const TOTAL_BOX_SPACING = BOX_WIDTH + BOX_GAP;
// const ARROW_Y_OFFSET_DOWN = (BOX_HEIGHT * 2.4) / 2;
// const ARROW_X_OFFSET = BOX_WIDTH / 2;
// const IMAGE_HEIGHT = 260;
// const IMAGE_WIDTH = 260;

// interface BubbleSortProps {
//   array: number[];
//   speed: number;
//   isAscending: boolean;
//   isPlaying: boolean;
//   registerPlayFunction?: (fn: () => void) => void;
//   registerPauseFunction?: (fn: () => void) => void;
//   registerResetFunction?: (fn: () => void) => void;
//   registerNextStepFunction?: (fn: () => void) => void;
//   registerPreviousStepFunction?: (fn: () => void) => void;
//   onAnimationEnd?: () => void;
//   handleTogglePlay?: () => void;
// }

// const BubbleSort: React.FC<BubbleSortProps> = ({
//   array,
//   speed,
//   isAscending,
//   isPlaying,
//   registerPlayFunction,
//   registerPauseFunction,
//   registerResetFunction,
//   registerNextStepFunction,
//   registerPreviousStepFunction,
//   onAnimationEnd,
//   handleTogglePlay,
// }) => {
//   // Refs for DOM elements
//   const containerRef = useRef<HTMLDivElement>(null);
//   const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
//   const iArrowRef = useRef<HTMLDivElement>(null);
//   const jArrowRef = useRef<HTMLDivElement>(null);
//   const timelineRef = useRef<gsap.core.Timeline | null>(null);
//   const wasPausedRef = useRef<boolean>(false);
//   const propsRef = useRef({ array, speed, isAscending, isPlaying });
//   const bubbleRef = useRef<HTMLDivElement>(null);

//   // Add refs for step management
//   const currentStepRef = useRef<number>(0);
//   const totalStepsRef = useRef<number>(0);
//   // const stepsDataRef = useRef<
//   //   Array<{
//   //     i: number;
//   //     j: number;
//   //     shouldSwap: boolean;
//   //     sortedIndex?: number;
//   //     isComplete?: boolean;
//   //   }>
//   // >([]);

//   // Animates an element from its current position to (toX, toY) over the given duration.
//   const slideElementTo = (
//     element: HTMLElement,
//     toX: number | string,
//     toY: number | string = 0,
//     duration: number = 0.5
//   ): gsap.core.Tween => {
//     return gsap.to(element, {
//       x: toX,
//       y: toY,
//       duration,
//       ease: "power1.inOut",
//     });
//   };

//   const scaleSwap = (
//     elementB: HTMLElement,
//     elementA: HTMLElement,
//     duration: number = 1.2
//   ): gsap.core.Timeline => {
//     const timeline = gsap.timeline();
//     const indexA = arrayElementsRef.current.findIndex((el) => el === elementA);
//     const indexB = arrayElementsRef.current.findIndex((el) => el === elementB);
//     if (indexA === -1 || indexB === -1) {
//       return timeline;
//     }
//     timeline.call(() => {
//       const temp = arrayElementsRef.current[indexA];
//       arrayElementsRef.current[indexA] = arrayElementsRef.current[indexB];
//       arrayElementsRef.current[indexB] = temp;

//       const currentXA = gsap.getProperty(elementA, "x") as number;
//       const currentXB = gsap.getProperty(elementB, "x") as number;
//       const distance = (indexB - indexA) * TOTAL_BOX_SPACING;

//       // Store original z-index values
//       const originalZIndexA = elementA.style.zIndex || "auto";
//       const originalZIndexB = elementB.style.zIndex || "auto";

//       const swapAnimation = gsap.timeline();

//       // Set z-index: left element (A) higher than right element (B)
//       swapAnimation.set(elementA, { zIndex: 1001 }, 0);
//       swapAnimation.set(elementB, { zIndex: 1000 }, 0);

//       // Element A (left) scales up, moves right to midpoint, then scales back to normal when reaching final position
//       swapAnimation
//         .to(
//           elementA,
//           {
//             scale: 1.5,
//             x: currentXA + distance / 2,
//             duration: duration / 2,
//             ease: "power2.out",
//           },
//           0
//         )
//         .to(
//           elementA,
//           {
//             scale: 1,
//             x: currentXA + distance,
//             duration: duration / 2,
//             ease: "power2.in",
//           },
//           duration / 2
//         );

//       // Element B (right) scales down, moves left to midpoint, then scales back to normal when reaching final position
//       swapAnimation
//         .to(
//           elementB,
//           {
//             scale: 0.5,
//             x: currentXB - distance / 2,
//             duration: duration / 2,
//             ease: "power2.out",
//           },
//           0
//         )
//         .to(
//           elementB,
//           {
//             scale: 1,
//             x: currentXB - distance,
//             duration: duration / 2,
//             ease: "power2.in",
//           },
//           duration / 2
//         );

//       swapAnimation.call(() => {
//         // Reset all properties including z-index back to original values
//         gsap.set(elementA, {
//           scale: 1,
//           zIndex: originalZIndexA === "auto" ? "auto" : originalZIndexA,
//         });
//         gsap.set(elementB, {
//           scale: 1,
//           zIndex: originalZIndexB === "auto" ? "auto" : originalZIndexB,
//         });

//         // Swap array references
//       });

//       timeline.add(swapAnimation);
//     });
//     return timeline;
//   };

//   // Sorted indicator animation
//   const animateSortedIndicator = (
//     indices: number | number[]
//   ): gsap.core.Timeline => {
//     const targetIndices = Array.isArray(indices) ? indices : [indices];
//     const elements = targetIndices
//       .map((index) => arrayElementsRef.current[index])
//       .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement);

//     if (elements.length === 0) return gsap.timeline();

//     const timeline = gsap.timeline();

//     elements.forEach((element) => {
//       timeline.to(
//         element,
//         {
//           backgroundColor: "#d4edda",
//           borderColor: "#c3e6cb",
//           duration: 0.5,
//           ease: "power2.out",
//         },
//         0
//       );
//     });

//     return timeline;
//   };

//   // Highlight boxes animation
//   const highlightBoxes = (
//     indices: number | number[],
//     intensity: "low" | "high" = "low",
//     duration: number = 0.6
//   ): gsap.core.Timeline => {
//     const targetIndices = Array.isArray(indices) ? indices : [indices];
//     const elements = targetIndices
//       .map((index) => arrayElementsRef.current[index])
//       .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement);

//     if (elements.length === 0) return gsap.timeline();

//     const timeline = gsap.timeline();
//     const shadowConfig = {
//       low: "0 0 10px #ffd700, 0 2px 15px rgba(255, 215, 0, 0.3)",
//       high: "0 0 25px #ff4444, 0 4px 30px rgba(255, 68, 68, 0.5)",
//     };

//     const glowShadow = shadowConfig[intensity];
//     const originalBoxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";

//     elements.forEach((element) => {
//       timeline
//         .to(
//           element,
//           {
//             boxShadow: glowShadow,
//             duration: duration / 2,
//             ease: "power2.out",
//           },
//           0
//         )
//         .to(
//           element,
//           {
//             boxShadow: originalBoxShadow,
//             duration: duration / 2,
//             ease: "power2.in",
//           },
//           duration / 2
//         );
//     });

//     return timeline;
//   };

//   // Generate steps data for the bubble sort algorithm
//   // const generateStepsData = (
//   //   arr: number[]
//   // ): Array<{
//   //   i: number;
//   //   j: number;
//   //   shouldSwap: boolean;
//   //   sortedIndex?: number;
//   //   isComplete?: boolean;
//   // }> => {
//   //   const steps: Array<{
//   //     i: number;
//   //     j: number;
//   //     shouldSwap: boolean;
//   //     sortedIndex?: number;
//   //     isComplete?: boolean;
//   //   }> = [];
//   //   const tempArr = [...arr];
//   //   const n = tempArr.length;

//   //   for (let i = 0; i < n - 1; i++) {
//   //     for (let j = 0; j < n - i - 1; j++) {
//   //       const shouldSwap = isAscending
//   //         ? tempArr[j] > tempArr[j + 1]
//   //         : tempArr[j] < tempArr[j + 1];

//   //       steps.push({
//   //         i,
//   //         j,
//   //         shouldSwap,
//   //       });

//   //       if (shouldSwap) {
//   //         const temp = tempArr[j];
//   //         tempArr[j] = tempArr[j + 1];
//   //         tempArr[j + 1] = temp;
//   //       }
//   //     }

//   //     // Add step for marking sorted element
//   //     steps.push({
//   //       i,
//   //       j: -1, // Special marker for sorted indicator
//   //       shouldSwap: false,
//   //       sortedIndex: n - 1 - i,
//   //     });
//   //   }

//   //   // Add final step for marking first element as sorted
//   //   steps.push({
//   //     i: -1,
//   //     j: -1,
//   //     shouldSwap: false,
//   //     sortedIndex: 0,
//   //     isComplete: true,
//   //   });

//   //   return steps;
//   // };

//   // Play animation with labels
//   // Play animation with step callbacks
//   // Play animation with step callbacks
//   // Play animation with manual step tracking
//   const playAnimation = (): void => {
//     // Handle normal pause case
//     if (wasPausedRef.current && timelineRef.current) {
//       timelineRef.current.play();
//       wasPausedRef.current = false;
//       return;
//     }

//     // Handle case when there is no timeline - create new timeline
//     resetAnimation();

//     // Generate steps data

//     const arr = [...array];
//     const n = arr.length;
//     const mainTimeline = gsap.timeline();
//     mainTimeline.timeScale(propsRef.current.speed);
//     currentStepRef.current = 0;

//     // Add initial label
//     mainTimeline.addLabel("step-0");
//     mainTimeline.call(() => {
//       currentStepRef.current = 0;
//     });

//     // Show and position arrows with slide down animation
//     if (iArrowRef.current && jArrowRef.current) {
//       if (arrayElementsRef.current[0] && arrayElementsRef.current[1]) {
//         mainTimeline.add(
//           gsap.fromTo(
//             iArrowRef.current,
//             {
//               x: ARROW_X_OFFSET,
//               y: 0,
//               opacity: 0,
//               zIndex: -1,
//             },
//             {
//               y: ARROW_Y_OFFSET_DOWN,
//               opacity: 1,
//               duration: 0.5,
//               ease: "power1.out",
//             }
//           )
//         );
//         mainTimeline.add(
//           gsap.fromTo(
//             jArrowRef.current,
//             {
//               x: ARROW_X_OFFSET + TOTAL_BOX_SPACING,
//               y: 0,
//               opacity: 0,
//               zIndex: -1,
//             },
//             {
//               y: ARROW_Y_OFFSET_DOWN,
//               opacity: 1,
//               duration: 0.5,
//               ease: "power1.out",
//             }
//           ),
//           "-=0.5"
//         );
//       }
//     }

//     let stepIndex = 1;

//     // Bubble sort algorithm animation with labels
//     for (let i = 0; i < n - 1; i++) {
//       if (iArrowRef.current && jArrowRef.current) {
//         if (i !== 0) {
//           mainTimeline.add(
//             slideElementTo(
//               jArrowRef.current,
//               TOTAL_BOX_SPACING + ARROW_X_OFFSET,
//               `+=0`,
//               0.3
//             ),
//             "+=0.2"
//           );
//           mainTimeline.add(
//             slideElementTo(iArrowRef.current, ARROW_X_OFFSET, `+=0`, 0.3),
//             "-=0.3"
//           );
//           if (bubbleRef.current) {
//             mainTimeline.add(
//               gsap.to(bubbleRef.current, { x: 0, y: 0, duration: 0.2 }),
//               "-=0.2"
//             );
//           }
//         }
//       }

//       for (let j = 0; j < n - i - 1; j++) {
//         // Add label for this step
//         mainTimeline.addLabel(`step-${stepIndex}`, "+=0");
//         // The .call() method in GSAP timelines does not pass the label or stepIndex as an argument.
//         // To ensure the correct value is used, capture the current value in a local variable.
//         // This avoids closure issues with stepIndex in loops.
//         {
//           const thisStep = stepIndex;
//           mainTimeline.call(() => {
//             currentStepRef.current = thisStep;
//             console.log(currentStepRef.current);
//           });
//         }

//         stepIndex++;

//         // Add a gap of 0.5 duration

//         // Highlight comparison elements
//         mainTimeline.add(highlightBoxes([j, j + 1], "high"), "+=0.2");

//         // Check if swap is needed
//         const shouldSwap = isAscending
//           ? arr[j] > arr[j + 1]
//           : arr[j] < arr[j + 1];

//         if (shouldSwap) {
//           const temp = arr[j];
//           arr[j] = arr[j + 1];
//           arr[j + 1] = temp;

//           // Animate the swap
//           if (arrayElementsRef.current[j] && arrayElementsRef.current[j + 1]) {
//             const leftElement = arrayElementsRef.current[j];
//             const rightElement = arrayElementsRef.current[j + 1];

//             if (leftElement && rightElement) {
//               mainTimeline.add(
//                 scaleSwap(leftElement, rightElement, 0.8),
//                 "+=0.2"
//               );
//             }
//             mainTimeline.add(gsap.to({}, { duration: 0.5 }));
//             const tempRef = arrayElementsRef.current[j];
//             arrayElementsRef.current[j] = arrayElementsRef.current[j + 1];
//             arrayElementsRef.current[j + 1] = tempRef;
//           }
//         }

//         // Move arrows to next position
//         if (iArrowRef.current && jArrowRef.current && j < n - i - 2) {
//           mainTimeline.add(
//             slideElementTo(
//               iArrowRef.current,
//               `+=${TOTAL_BOX_SPACING}`,
//               `+=0`,
//               0.3
//             ),
//             "+=0.5"
//           );

//           mainTimeline.add(
//             slideElementTo(
//               jArrowRef.current,
//               `+=${TOTAL_BOX_SPACING}`,
//               `+=0`,
//               0.3
//             ),
//             "-=0.3"
//           );

//           if (bubbleRef.current) {
//             mainTimeline.add(
//               slideElementTo(
//                 bubbleRef.current,
//                 `+=${TOTAL_BOX_SPACING}`,
//                 0,
//                 0.3
//               ),
//               "-=0.3"
//             );
//           }
//         }
//         // if (j === n - i - 2) {
//         //   mainTimeline.add(gsap.to({}, { duration: 0.5 }));
//         //   mainTimeline.addLabel(`step-${stepIndex}`, "+=0");
//         //   stepIndex++;
//         // }
//       }

//       // Mark the last element as sorted
//       const sortedIndex = n - 1 - i;
//       mainTimeline.add(gsap.to({}, { duration: 0.5 }));
//       mainTimeline.addLabel(`step-${stepIndex}`, "+=0");
//       const thisStep = stepIndex;
//       mainTimeline.call(() => {
//         currentStepRef.current = thisStep;
//       });
//       mainTimeline.add(animateSortedIndicator(sortedIndex), "+=0");
//       stepIndex++;
//     }

//     // Add final label and mark first element as sorted
//     mainTimeline.addLabel(`step-${stepIndex}`);
//     const thisStep = stepIndex;
//     mainTimeline.call(() => {
//       currentStepRef.current = thisStep;
//     });
//     mainTimeline.add(animateSortedIndicator(0), "+=0.3");

//     // Add end label

//     // Hide arrows
//     if (iArrowRef.current && jArrowRef.current) {
//       mainTimeline.add(
//         gsap.to(iArrowRef.current, {
//           opacity: 0,
//           duration: 0.5,
//           ease: "power1.out",
//         }),
//         "+=0.5"
//       );
//       mainTimeline.add(
//         gsap.to(jArrowRef.current, {
//           opacity: 0,
//           duration: 0.5,
//           ease: "power1.out",
//         }),
//         "-=0.5"
//       );
//     }
//     totalStepsRef.current = stepIndex;
//     mainTimeline.addLabel("end");

//     // Manual callback to update currentStepRef during play
//     // mainTimeline.eventCallback("onUpdate", () => {
//     //   const currentTime = mainTimeline.time();
//     //   const totalTime = mainTimeline.duration();
//     //   const progress = currentTime / totalTime;
//     //   const estimatedStep = Math.floor(progress * totalStepsRef.current);
//     //   currentStepRef.current = Math.min(estimatedStep, totalStepsRef.current);
//     // });

//     mainTimeline.call(() => {
//       wasPausedRef.current = false;
//       if (onAnimationEnd) onAnimationEnd();
//     });

//     timelineRef.current = mainTimeline;
//   };

//   const nextStep = (): void => {
//     if (!timelineRef.current) {
//       playAnimation();
//       if (timelineRef.current) {
//         (timelineRef.current as gsap.core.Timeline).pause();
//         currentStepRef.current = 0;
//         (timelineRef.current as gsap.core.Timeline).play(`step-${0}`);
//         currentStepRef.current = 1;
//         (timelineRef.current as gsap.core.Timeline).addPause(`step-${1}`);
//         // Pause the timeline immediately after playing the animation to allow step-by-step navigation
//       }
//       return;
//     }

//     if (propsRef.current.isPlaying) {
//       (timelineRef.current as gsap.core.Timeline).pause();
//       currentStepRef.current++;

//       // timelineRef.current.call(() => {
//       timelineRef.current!.timeScale(4); // Slow down to 30% speed
//       // }, []);

//       (timelineRef.current as gsap.core.Timeline).play();
//       (timelineRef.current as gsap.core.Timeline).addPause(
//         `step-${currentStepRef.current}`
//       );
//       if (handleTogglePlay) {
//         handleTogglePlay();
//       }
//       // setTimeout(() => {
//       //   if (timelineRef.current) {
//       //     timelineRef.current.timeScale(temp);

//       //     // Continue playing from the current position at normal speed
//       //     (timelineRef.current as gsap.core.Timeline).play();
//       //   }
//       // }, 10);
//       // (timelineRef.current as gsap.core.Timeline).play(
//       //   `step-${currentStepRef.current + 1}`
//       // );
//     } else {
//       // timelineRef.current.call(() => {
//       //   timelineRef.current!.timeScale(speed); // Slow down to 30% speed
//       // }, []);

//       if (currentStepRef.current <= totalStepsRef.current) {
//         (timelineRef.current as gsap.core.Timeline).play();
//         currentStepRef.current++;
//         (timelineRef.current as gsap.core.Timeline).addPause(
//           `step-${currentStepRef.current}`
//         );
//       } else {
//         (timelineRef.current as gsap.core.Timeline).play();
//         (timelineRef.current as gsap.core.Timeline).addPause("end");
//       }
//       // timelineRef.current.call(() => {
//       //   timelineRef.current!.timeScale(speed); // Slow down to 30% speed
//       // }, []);
//     }

//     // const nextStepIndex = currentStepRef.current + 1;
//     // const nextLabel =
//     //   nextStepIndex >= totalStepsRef.current ? "end" : `step-${nextStepIndex}`;
//     // if (!timelineRef.current) {
//     //   // Create timeline if it doesn't exist
//     //   playAnimation();
//     //   if (timelineRef.current) {
//     //     (timelineRef.current as gsap.core.Timeline).pause();
//     //     // Play the first step animation immediately
//     //     const tween = (timelineRef.current as gsap.core.Timeline).tweenFromTo(
//     //       "step-1",
//     //       "step-2"
//     //     );
//     //     tween.eventCallback("onComplete", () => {
//     //       timelineRef.current!.pause();
//     //     });
//     //     currentStepRef.current = 1; // Now set to 1 after playing step-0 to step-1
//     //     wasPausedRef.current = true;
//     //   }
//     //   return;
//     // }
//     // timelineRef.current.seek(nextLabel);
//     // // Seek to next label
//     // if (propsRef.current.isPlaying) {
//     //   // If playing is true, create a loop to tween through all remaining steps
//     //   const playFromStep = (stepIndex: number) => {
//     //     if (stepIndex >= totalStepsRef.current) {
//     //       // Reached end
//     //       currentStepRef.current = totalStepsRef.current;
//     //       return;
//     //     }
//     //     // const currentLabel = `step-${stepIndex}`;
//     //     const nextStepLabel =
//     //       stepIndex >= totalStepsRef.current ? "end" : `step-${stepIndex}`;
//     //     const nextStepLabel2 =
//     //       stepIndex + 1 >= totalStepsRef.current
//     //         ? "end"
//     //         : `step-${stepIndex + 1}`;
//     //     const tween = timelineRef.current!.tweenFromTo(
//     //       nextStepLabel,
//     //       nextStepLabel2
//     //     );
//     //     activeTweenRef.current = tween;
//     //     tween.eventCallback("onComplete", () => {
//     //       currentStepRef.current = Math.min(
//     //         stepIndex + 1,
//     //         totalStepsRef.current
//     //       );
//     //       // Continue to next step
//     //       playFromStep(stepIndex + 1);
//     //     });
//     //   };
//     //   // Start the loop from next step
//     //   // Don't run if nextStepIndex is "end" (string) or nextStepIndex >= totalStepsRef.current
//     //   playFromStep(nextStepIndex);
//     // } else {
//     //   // If playing is false, play from current position to just before the next label (step-by-step)
//     //   if (nextStepIndex < totalStepsRef.current) {
//     //     const followingLabel =
//     //       nextStepIndex + 1 >= totalStepsRef.current
//     //         ? "end"
//     //         : `step-${nextStepIndex + 1}`;
//     //     timelineRef.current.tweenFromTo(nextLabel, followingLabel);
//     //     timelineRef.current.pause();
//     //   } else {
//     //     // Play to the end
//     //     timelineRef.current.tweenFromTo(nextLabel, "end");
//     //     timelineRef.current.pause();
//     //   }
//     //   currentStepRef.current = Math.min(nextStepIndex, totalStepsRef.current);
//     //   wasPausedRef.current = true;
//     // }
//   };

//   const pauseAnimation = (): void => {
//     if (timelineRef.current) {
//       timelineRef.current.pause();
//       wasPausedRef.current = true;
//     }
//   };

//   const resetAnimation = (): void => {
//     // Kill any active tweens from nextStep first

//     // Kill any existing timeline
//     if (timelineRef.current) {
//       timelineRef.current.kill();
//       timelineRef.current = null;
//     }

//     // Reset all array elements to original state and restore original order
//     if (arrayElementsRef.current) {
//       arrayElementsRef.current.forEach((element, index) => {
//         if (element) {
//           gsap.set(element, {
//             x: 0, // Reset to original position
//             y: 0,
//             rotation: 0,
//             scale: 1,
//             backgroundColor: "#f8f9fa",
//             borderColor: "#e9ecef",
//             boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
//             zIndex: "auto",
//           });
//         }
//       });

//       // Restore original array order based on the original array prop
//       const originalOrder: (HTMLDivElement | null)[] = new Array(
//         array.length
//       ).fill(null);
//       arrayElementsRef.current.forEach((element) => {
//         if (element) {
//           const value = parseInt(element.textContent || "0");
//           const originalIndex = array.indexOf(value);
//           if (originalIndex !== -1) {
//             originalOrder[originalIndex] = element;
//           }
//         }
//       });
//       arrayElementsRef.current = originalOrder;
//     }

//     // Reset arrows
//     if (iArrowRef.current && jArrowRef.current) {
//       gsap.killTweensOf([iArrowRef.current, jArrowRef.current]);
//       gsap.set([iArrowRef.current, jArrowRef.current], {
//         opacity: 0,
//         x: 0,
//         y: 0,
//         zIndex: "auto",
//       });
//     }

//     // Reset bubble image
//     if (bubbleRef.current) {
//       gsap.killTweensOf(bubbleRef.current);
//       gsap.set(bubbleRef.current, {
//         x: 0,
//         y: 0,
//         opacity: 0.8,
//       });
//     }

//     // Reset all state variables
//     wasPausedRef.current = false;
//     currentStepRef.current = 0;
//   };

//   const previousStep = (): void => {
//     if (!timelineRef.current) return;

//     if (currentStepRef.current > 0) {
//       currentStepRef.current--;
//       const prevLabel =
//         currentStepRef.current === 0
//           ? "step-0"
//           : `step-${currentStepRef.current}`;
//       timelineRef.current.seek(prevLabel);
//       timelineRef.current.pause();
//       wasPausedRef.current = true;
//     }
//   };

//   // Effects
//   useEffect(() => {
//     propsRef.current = { array, speed, isAscending, isPlaying };
//     if (timelineRef.current) {
//       timelineRef.current.timeScale(speed);
//     }
//   }, [array, speed, isAscending, isPlaying]);

//   useEffect(() => {
//     arrayElementsRef.current = arrayElementsRef.current.slice(0, array.length);
//   }, [array]);

//   useEffect(() => {
//     registerPlayFunction?.(playAnimation);
//     registerPauseFunction?.(pauseAnimation);
//     registerResetFunction?.(resetAnimation);
//     registerNextStepFunction?.(nextStep);
//     registerPreviousStepFunction?.(previousStep);
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (timelineRef.current) {
//         timelineRef.current.kill();
//         timelineRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div
//       ref={containerRef}
//       className="bubble-sort-container"
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "2rem",
//         padding: "2rem",
//         fontFamily: "system-ui, -apple-system, sans-serif",
//         backgroundColor: "#ffffff",
//         color: "#1a1a1a",
//         minHeight: "400px",
//         zIndex: 0,
//       }}
//     >
//       {/* Array Elements */}
//       <div
//         className="array-container"
//         style={{
//           display: "flex",
//           gap: `${BOX_GAP}px`,
//           alignItems: "center",
//           justifyContent: "center",
//           position: "relative",
//           zIndex: 1,
//         }}
//       >
//         <div
//           ref={bubbleRef}
//           style={{
//             position: "absolute",
//             top: `${-IMAGE_HEIGHT * 0.34}px`,
//             left: `${ARROW_X_OFFSET * 1.1 + BOX_WIDTH / 2}px`,
//             transform: "translateX(-50%)",
//             width: `${IMAGE_WIDTH}px`,
//             height: `${IMAGE_HEIGHT}px`,
//             opacity: 0.8,
//             zIndex: -1,
//           }}
//         >
//           <Image
//             src="/Images/BubbbleImage.png" // public/Images/BubbbleImage.png
//             alt="swap indicator"
//             width={IMAGE_WIDTH}
//             height={IMAGE_HEIGHT}
//             style={{ objectFit: "contain" }}
//           />
//         </div>
//         {array.map((value, index) => (
//           <div
//             key={`${index}-${value}`}
//             ref={(el) => {
//               arrayElementsRef.current[index] = el;
//             }}
//             className={`array-element array-element-${index}`}
//             style={{
//               width: `${BOX_WIDTH}px`,
//               height: `${BOX_HEIGHT}px`,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               backgroundColor: "#f8f9fa",
//               border: "2px solid #e9ecef",
//               borderRadius: `${BOX_BORDER_RADIUS}px`,
//               fontSize: `${BOX_FONT_SIZE}px`,
//               fontWeight: "600",
//               color: "#212529",
//               transition: "all 0.3s ease",
//               boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
//               zIndex: 2,
//             }}
//           >
//             {value}
//           </div>
//         ))}

//         {/* i Arrow */}
//         <div
//           ref={iArrowRef}
//           className="i-arrow"
//           style={{
//             position: "absolute",
//             left: "0px",
//             top: "0px",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             opacity: 0,
//             transform: "translateX(-50%)",
//           }}
//         >
//           <div
//             style={{
//               width: "0",
//               height: "0",
//               borderLeft: `${ARROW_SIZE}px solid transparent`,
//               borderRight: `${ARROW_SIZE}px solid transparent`,
//               borderBottom: "20px solid #0d6efd",
//             }}
//           />
//           <div
//             style={{
//               fontSize: `${ARROW_FONT_SIZE}px`,
//               fontWeight: 600,
//               color: "#0d6efd",
//               marginTop: "4px",
//             }}
//           >
//             i
//           </div>
//         </div>

//         {/* j Arrow */}
//         <div
//           ref={jArrowRef}
//           className="j-arrow"
//           style={{
//             position: "absolute",
//             left: "0px",
//             top: "0px",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             opacity: 0,
//             transform: "translateX(-50%)",
//           }}
//         >
//           <div
//             style={{
//               width: "0",
//               height: "0",
//               borderLeft: `${ARROW_SIZE}px solid transparent`,
//               borderRight: `${ARROW_SIZE}px solid transparent`,
//               borderBottom: "20px solid #fd7e14",
//             }}
//           />
//           <div
//             style={{
//               fontSize: `${ARROW_FONT_SIZE}px`,
//               fontWeight: "600",
//               color: "#fd7e14",
//               marginTop: "4px",
//             }}
//           >
//             j
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BubbleSort;
