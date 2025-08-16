"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Controls from "./Control";

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
      ECLIPSE_HEIGHT: 80,
      TOTAL_BOX_SPACING: 80 + 16,
      ARROW_Y_OFFSET_DOWN: (80 * 2.4) / 2,
      ARROW_X_OFFSET: 80 / 2,
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
    };
  }
};

const SelectionSort: React.FC = () => {
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
  const minArrowRef = useRef<HTMLDivElement>(null);
  const jArrowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, isAscending, isPlaying });

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
  } = dynamicSizing;

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
      });

      timeline.add(swapAnimation);
    });

    return timeline;
  };

  // Play animation
  const playAnimation = (): void => {
    // Handle normal pause case
    if (wasPausedRef.current && timelineRef.current) {
      timelineRef.current.play();
      wasPausedRef.current = false;
      return;
    }

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

    let stepIndex = 1;

    // Selection sort algorithm with labels and eclipse swap
    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;

      // Add label for this iteration
      // mainTimeline.addLabel(`step-${stepIndex}`, "+=0.2");
      // {
      //   const thisStep = stepIndex;
      //   mainTimeline.call(() => {
      //     currentStepRef.current = thisStep;
      //   });
      // }
      // stepIndex++;

      if (minArrowRef.current && jArrowRef.current) {
        if (
          arrayElementsRef.current[0] &&
          arrayElementsRef.current[1] &&
          minArrowRef.current &&
          jArrowRef.current
        ) {
          mainTimeline.add(
            gsap.fromTo(
              minArrowRef.current,
              {
                x:  i * TOTAL_BOX_SPACING + BOX_WIDTH*0.25,
                y: 0,
                opacity: 0,
                zIndex: -1,
              },
              {
                y: ARROW_Y_OFFSET_DOWN ,
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
                x:  (i + 1) * TOTAL_BOX_SPACING + BOX_WIDTH*0.75,
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

      // Highlight initial min element (red)
      mainTimeline.add(highlightMinElement(i), "-=0.3");

      // Find minimum element in remaining array
      for (let j = i + 1; j < n; j++) {
        // Add label for comparison step
        mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
        {
          const thisStep = stepIndex;
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
        }
        stepIndex++;

        // Move j arrow to current comparison position
        if (jArrowRef.current && j != i + 1) {
          mainTimeline.add(
            slideElementTo(
              jArrowRef.current,
               j * TOTAL_BOX_SPACING + BOX_WIDTH*0.75,
              `+=0`,
              0.3
            ),
            "+=0.2"
          );
        }

        // Remove highlight from previous j only if it's not the current min
        if (j > i + 1 && j - 1 !== minIndex) {
          mainTimeline.add(removeHighlight(j - 1), "-=0.4");
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
            mainTimeline.add(
              slideElementTo(
                minArrowRef.current,
                 j * TOTAL_BOX_SPACING + BOX_WIDTH*0.25,
                `+=0`,
                0.3
              ),
              "+=0.2"
            );
          }

          // Highlight the new minimum (red) - this will override the blue j highlight
          mainTimeline.add(highlightMinElement(j), "-=0.1");
        } else {
          // If j is not the new min, ensure the current min stays highlighted
          mainTimeline.add(highlightMinElement(minIndex), "-=0.2");
        }

        mainTimeline.to({}, { duration: 0.3 }); // Pause for comparison
      }

      // Remove highlight from last j element if it's not the min
      const lastJ = n - 1;
      if (lastJ !== minIndex) {
        mainTimeline.add(removeHighlight(lastJ));
      }

      // Swap if needed
      if (minIndex !== i) {
        // Add label for swap step
        // mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
        // {
        //   const thisStep = stepIndex;
        //   mainTimeline.call(() => {
        //     currentStepRef.current = thisStep;
        //   });
        // }
        // stepIndex++;

        // Move arrows up before swap
        if (minArrowRef.current) {
          mainTimeline.add(
            slideElementTo(
              minArrowRef.current,
              "+=0",
              `-=${ARROW_Y_OFFSET_DOWN}`,
              0.5
            )
          );
        }
        if (jArrowRef.current) {
          mainTimeline.add(
            slideElementTo(
              jArrowRef.current,
              "+=0",
              `-=${ARROW_Y_OFFSET_DOWN}`,
              0.5
            ),
            "-=0.5"
          );
        }

        // Hide arrows before swap
        if (minArrowRef.current && jArrowRef.current) {
          mainTimeline.to([minArrowRef.current, jArrowRef.current], {
            opacity: 0,
            duration: 0,
          });
        }

        // Perform swap in array
        const temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;

        // Visual eclipse swap animation
        if (arrayElementsRef.current[i] && arrayElementsRef.current[minIndex]) {
          mainTimeline.add(
            eclipseSwap(
              arrayElementsRef.current[i] as HTMLElement,
              arrayElementsRef.current[minIndex] as HTMLElement,
              1.2
            ),
            "+=0.3"
          );
        }
        // Swap the references in arrayElementsRef.current to match the visual swap
        const tempRef = arrayElementsRef.current[i];
        arrayElementsRef.current[i] = arrayElementsRef.current[minIndex];
        arrayElementsRef.current[minIndex] = tempRef;

        mainTimeline.add(removeHighlight(i));
        mainTimeline.to({}, { duration: 1.2 });
      } else {
        if (minArrowRef.current) {
          mainTimeline.add(
            slideElementTo(
              minArrowRef.current,
              "+=0",
              `-=${ARROW_Y_OFFSET_DOWN}`,
              0.5
            )
          );
        }
        if (jArrowRef.current) {
          mainTimeline.add(
            slideElementTo(
              jArrowRef.current,
              "+=0",
              `-=${ARROW_Y_OFFSET_DOWN}`,
              0.5
            ),
            "-=0.5"
          );
        }
        // No swap needed, just remove min highlight
        mainTimeline.add(removeHighlight(i), "-=0.2");
      }

      // Mark element at position i as sorted
      mainTimeline.add(animateSortedIndicator(i));
    }

    // Hide arrows at the end
    if (minArrowRef.current && jArrowRef.current) {
      mainTimeline.add(
        gsap.to(minArrowRef.current, {
          x: "+=0",
          y: 0,
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
        }),
        "+=0.5"
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
    }

    // Final sorted animation
    mainTimeline.add(
      animateSortedIndicator([...Array(arr.length).keys()]),
      "-=0.5"
    );

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
      // Reset all element styles
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

      // Restore original array order based on the original array prop, handling duplicates
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

    // Reset arrows
    if (minArrowRef.current && jArrowRef.current) {
      gsap.killTweensOf([minArrowRef.current, jArrowRef.current]);
      gsap.set([minArrowRef.current, jArrowRef.current], {
        opacity: 0,
        x: 0,
        y: 0,
        zIndex: "auto",
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
          className="selection-sort-container"
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
                  fontWeight: 600,
                  color: "#0d6efd",
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
      <Controls
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

export default SelectionSort;

// "use client";
// import React, { useRef, useEffect, useState } from "react";
// import { gsap } from "gsap";
// import Controls from "./Control";

// const getDynamicSizing = (arrayLength: number) => {
//   if (arrayLength <= 9) {
//     return {
//       BOX_WIDTH: 80,
//       BOX_HEIGHT: 80,
//       BOX_GAP: 16,
//       BOX_BORDER_RADIUS: 12,
//       BOX_FONT_SIZE: 20,
//       ARROW_SIZE: 8,
//       ARROW_FONT_SIZE: 16,
//       ECLIPSE_HEIGHT: 100,
//       TOTAL_BOX_SPACING: 80 + 16,
//       ARROW_Y_OFFSET_DOWN: (80 * 2.4) / 2,
//       ARROW_X_OFFSET: 80 / 2,
//     };
//   } else {
//     return {
//       BOX_WIDTH: 55,
//       BOX_HEIGHT: 55,
//       BOX_GAP: 10,
//       BOX_BORDER_RADIUS: 8,
//       BOX_FONT_SIZE: 16,
//       ARROW_SIZE: 6,
//       ARROW_FONT_SIZE: 14,
//       ECLIPSE_HEIGHT: 60,
//       TOTAL_BOX_SPACING: 55 + 10,
//       ARROW_Y_OFFSET_DOWN: (55 * 2.4) / 2,
//       ARROW_X_OFFSET: 55 / 2,
//     };
//   }
// };
// // Constants for sizing - matching your Insertion Sort exactl

// const SelectionSort: React.FC = () => {
//   // Fixed initial array to prevent hydration mismatch
//   const getFixedInitialArray = () => [42, 17, 89, 31, 65, 8];
//   const initialArray = getFixedInitialArray();

//   // State management
//   const [array, setArray] = useState<number[]>(initialArray);
//   const [arraySize, setArraySize] = useState<number>(6);
//   const [isAscending, setIsAscending] = useState<boolean>(true);
//   const [speed, setSpeed] = useState<number>(1);
//   const [isPlaying, setIsPlaying] = useState<boolean>(false);

//   // Refs for DOM elements - removed iArrowRef
//   const containerRef = useRef<HTMLDivElement>(null);
//   const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
//   const minArrowRef = useRef<HTMLDivElement>(null);
//   const jArrowRef = useRef<HTMLDivElement>(null);
//   const timelineRef = useRef<gsap.core.Timeline | null>(null);
//   const wasPausedRef = useRef<boolean>(false);
//   const propsRef = useRef({ array, speed, isAscending, isPlaying });

//   // Add refs for step management
//   const currentStepRef = useRef<number>(0);
//   const totalStepsRef = useRef<number>(0);

//   const dynamicSizing = getDynamicSizing(array.length);
//   const {
//     BOX_WIDTH,
//     BOX_HEIGHT,
//     BOX_GAP,
//     BOX_BORDER_RADIUS,
//     BOX_FONT_SIZE,
//     ARROW_SIZE,
//     ARROW_FONT_SIZE,
//     ECLIPSE_HEIGHT,
//     ARROW_X_OFFSET,
//     ARROW_Y_OFFSET_DOWN,
//     TOTAL_BOX_SPACING,
//   } = dynamicSizing;

//   // Animates an element from its current position to (toX, toY) over the given duration
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

//   // Highlight min element (persistent red)
//   const highlightMinElement = (index: number): gsap.core.Timeline => {
//     const element = arrayElementsRef.current[index];
//     if (!element) return gsap.timeline();

//     const timeline = gsap.timeline();
//     timeline.to(element, {
//       backgroundColor: "#ffebee",
//       borderColor: "#f44336",
//       boxShadow:
//         "0 0 20px rgba(244, 67, 54, 0.4), 0 2px 15px rgba(244, 67, 54, 0.2)",
//       duration: 0.4,
//       ease: "power2.out",
//     });

//     return timeline;
//   };

//   // Highlight j element (blue comparison)
//   const highlightJElement = (index: number): gsap.core.Timeline => {
//     const element = arrayElementsRef.current[index];
//     if (!element) return gsap.timeline();

//     const timeline = gsap.timeline();
//     timeline.to(element, {
//       backgroundColor: "#e3f2fd",
//       borderColor: "#2196f3",
//       boxShadow:
//         "0 0 15px rgba(33, 150, 243, 0.3), 0 2px 12px rgba(33, 150, 243, 0.2)",
//       duration: 0.3,
//       ease: "power2.out",
//     });

//     return timeline;
//   };

//   // Remove highlighting from element
//   const removeHighlight = (index: number): gsap.core.Timeline => {
//     const element = arrayElementsRef.current[index];
//     if (!element) return gsap.timeline();

//     const timeline = gsap.timeline();
//     timeline.to(element, {
//       backgroundColor: "#f8f9fa",
//       borderColor: "#e9ecef",
//       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
//       duration: 0.3,
//       ease: "power2.out",
//     });

//     return timeline;
//   };

//   // Eclipse swap animation from your second implementation
//   const eclipseSwap = (
//     elementA: HTMLElement,
//     elementB: HTMLElement,
//     duration: number = 1.2
//   ): gsap.core.Timeline => {
//     const timeline = gsap.timeline();

//     const indexA = arrayElementsRef.current.findIndex((el) => el === elementA);
//     const indexB = arrayElementsRef.current.findIndex((el) => el === elementB);

//     if (indexA === -1 || indexB === -1) {
//       return timeline;
//     }

//     timeline.call(() => {
//       const currentXA = gsap.getProperty(elementA, "x") as number;
//       const currentXB = gsap.getProperty(elementB, "x") as number;

//       const distance = (indexB - indexA) * TOTAL_BOX_SPACING;
//       const midPoint = distance / 2;

//       const swapAnimation = gsap.timeline();

//       // Element A moves in upper arc with flip
//       swapAnimation
//         .to(
//           elementA,
//           {
//             x: currentXA + midPoint,
//             y: -ECLIPSE_HEIGHT,
//             rotation: 180,
//             duration: duration / 2,
//             ease: "power2.out",
//           },
//           0
//         )
//         .to(
//           elementA,
//           {
//             x: currentXA + distance,
//             y: 0,
//             rotation: 360,
//             duration: duration / 2,
//             ease: "power2.in",
//           },
//           duration / 2
//         );

//       // Element B moves in lower arc with flip
//       swapAnimation
//         .to(
//           elementB,
//           {
//             x: currentXB - midPoint,
//             y: ECLIPSE_HEIGHT,
//             rotation: -180,
//             duration: duration / 2,
//             ease: "power2.out",
//           },
//           0
//         )
//         .to(
//           elementB,
//           {
//             x: currentXB - distance,
//             y: 0,
//             rotation: -360,
//             duration: duration / 2,
//             ease: "power2.in",
//           },
//           duration / 2
//         );

//       swapAnimation.call(() => {
//         gsap.set([elementA, elementB], { rotation: 0 });
//       });

//       timeline.add(swapAnimation);
//     });

//     return timeline;
//   };

//   // Play animation - adapted with eclipse swap and arrows going up before swap
//   const playAnimation = (): void => {
//     // Handle normal pause case
//     if (wasPausedRef.current && timelineRef.current) {
//       timelineRef.current.play();
//       wasPausedRef.current = false;
//       return;
//     }

//     resetAnimation();

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

//     // Show and position arrows with slide down animation (only min and j arrows)

//     let stepIndex = 1;

//     // Selection sort algorithm with labels and eclipse swap
//     for (let i = 0; i < n - 1; i++) {
//       let minIndex = i;

//       // Add label for this iteration
//       mainTimeline.addLabel(`step-${stepIndex}`, "+=0.2");
//       {
//         const thisStep = stepIndex;
//         mainTimeline.call(() => {
//           currentStepRef.current = thisStep;
//         });
//       }
//       stepIndex++;
//       if (minArrowRef.current && jArrowRef.current) {
//         if (
//           arrayElementsRef.current[0] &&
//           arrayElementsRef.current[1] &&
//           minArrowRef.current &&
//           jArrowRef.current
//         ) {
//           mainTimeline.add(
//             gsap.fromTo(
//               minArrowRef.current,
//               {
//                 x: ARROW_X_OFFSET + i * TOTAL_BOX_SPACING,
//                 y: 0,
//                 opacity: 0,
//                 zIndex: -1,
//               },
//               {
//                 y: ARROW_Y_OFFSET_DOWN,
//                 opacity: 1,
//                 duration: 0.5,
//                 ease: "power1.out",
//               }
//             )
//           );
//           mainTimeline.add(
//             gsap.fromTo(
//               jArrowRef.current,
//               {
//                 x: ARROW_X_OFFSET + (i + 1) * TOTAL_BOX_SPACING,
//                 y: 0,
//                 opacity: 0,
//                 zIndex: -1,
//               },
//               {
//                 y: ARROW_Y_OFFSET_DOWN,
//                 opacity: 1,
//                 duration: 0.5,
//                 ease: "power1.out",
//               }
//             ),
//             "-=0.5"
//           );
//         }
//       }

//       // // Move min arrow to current i position, but skip if i == 0
//       // if (i !== 0 && minArrowRef.current) {
//       //   mainTimeline.add(
//       //     slideElementTo(
//       //       minArrowRef.current,
//       //       ARROW_X_OFFSET + i * TOTAL_BOX_SPACING,
//       //       `+=0`,
//       //       0.3
//       //     ),
//       //     "+=0.5"
//       //   );
//       // }

//       // Highlight initial min element (red)
//       mainTimeline.add(highlightMinElement(i), "-=0.3");

//       // Find minimum element in remaining array
//       for (let j = i + 1; j < n; j++) {
//         // Add label for comparison step
//         mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
//         {
//           const thisStep = stepIndex;
//           mainTimeline.call(() => {
//             currentStepRef.current = thisStep;
//           });
//         }
//         stepIndex++;

//         // Move j arrow to current comparison position
//         if (jArrowRef.current && j != i + 1) {
//           mainTimeline.add(
//             slideElementTo(
//               jArrowRef.current,
//               ARROW_X_OFFSET + j * TOTAL_BOX_SPACING,
//               `+=0`,
//               0.3
//             ),
//             "+=0.2"
//           );
//         }

//         // Remove highlight from previous j only if it's not the current min
//         if (j > i + 1 && j - 1 !== minIndex) {
//           mainTimeline.add(removeHighlight(j - 1), "-=0.4");
//         }

//         // Highlight current j element (blue) only if it's not the current min
//         if (j !== minIndex) {
//           mainTimeline.add(highlightJElement(j), "-=0.3");
//         }

//         // Small pause for comparison
//         mainTimeline.to({}, { duration: 0.4 });

//         // Check if we found a new minimum
//         if (isAscending ? arr[j] < arr[minIndex] : arr[j] > arr[minIndex]) {
//           const oldMinIndex = minIndex;
//           minIndex = j;

//           // Remove red highlight from old minimum only if it's different from new min
//           if (oldMinIndex !== j) {
//             mainTimeline.add(removeHighlight(oldMinIndex), "-=0.1");
//           }

//           // Move min arrow to new minimum position
//           if (minArrowRef.current) {
//             mainTimeline.add(
//               slideElementTo(
//                 minArrowRef.current,
//                 ARROW_X_OFFSET + j * TOTAL_BOX_SPACING,
//                 `+=0`,
//                 0.3
//               ),
//               "+=0.2"
//             );
//           }

//           // Highlight the new minimum (red) - this will override the blue j highlight
//           mainTimeline.add(highlightMinElement(j), "-=0.1");
//         } else {
//           // If j is not the new min, ensure the current min stays highlighted
//           mainTimeline.add(highlightMinElement(minIndex), "-=0.2");
//         }

//         mainTimeline.to({}, { duration: 0.3 }); // Pause for comparison
//       }

//       // Remove highlight from last j element if it's not the min
//       const lastJ = n - 1;
//       if (lastJ !== minIndex) {
//         mainTimeline.add(removeHighlight(lastJ));
//       }

//       // Swap if needed
//       if (minIndex !== i) {
//         // Add label for swap step
//         mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
//         {
//           const thisStep = stepIndex;
//           mainTimeline.call(() => {
//             currentStepRef.current = thisStep;
//           });
//         }
//         stepIndex++;

//         // Move arrows up before swap (like in your second implementation)
//         if (minArrowRef.current) {
//           mainTimeline.add(
//             slideElementTo(
//               minArrowRef.current,
//               "+=0",
//               `-=${ARROW_Y_OFFSET_DOWN}`,
//               0.5
//             )
//           );
//         }
//         if (jArrowRef.current) {
//           mainTimeline.add(
//             slideElementTo(
//               jArrowRef.current,
//               "+=0",
//               `-=${ARROW_Y_OFFSET_DOWN}`,
//               0.5
//             ),
//             "-=0.5"
//           );
//         }

//         // Hide arrows before swap
//         if (minArrowRef.current && jArrowRef.current) {
//           mainTimeline.to([minArrowRef.current, jArrowRef.current], {
//             opacity: 0,
//             duration: 0,
//           });
//         }

//         // Perform swap in array
//         const temp = arr[i];
//         arr[i] = arr[minIndex];
//         arr[minIndex] = temp;

//         // Visual eclipse swap animation
//         if (arrayElementsRef.current[i] && arrayElementsRef.current[minIndex]) {
//           mainTimeline.add(
//             eclipseSwap(
//               arrayElementsRef.current[i] as HTMLElement,
//               arrayElementsRef.current[minIndex] as HTMLElement,
//               1.2
//             ),
//             "+=0.3"
//           );
//         }
//         // Swap the references in arrayElementsRef.current to match the visual swap
//         const tempRef = arrayElementsRef.current[i];
//         arrayElementsRef.current[i] = arrayElementsRef.current[minIndex];
//         arrayElementsRef.current[minIndex] = tempRef;

//         mainTimeline.add(removeHighlight(i));
//         mainTimeline.to({}, { duration: 1.2 });

//         // Show arrows again after swap
//         // if (minArrowRef.current && jArrowRef.current) {
//         //   mainTimeline.to(
//         //     [minArrowRef.current, jArrowRef.current],
//         //     {
//         //       opacity: 1,
//         //       duration: 0.3,
//         //     },
//         //     "+=0.5"
//         //   );
//         // }
//       } else {
//         if (minArrowRef.current) {
//           mainTimeline.add(
//             slideElementTo(
//               minArrowRef.current,
//               "+=0",
//               `-=${ARROW_Y_OFFSET_DOWN}`,
//               0.5
//             )
//           );
//         }
//         if (jArrowRef.current) {
//           mainTimeline.add(
//             slideElementTo(
//               jArrowRef.current,
//               "+=0",
//               `-=${ARROW_Y_OFFSET_DOWN}`,
//               0.5
//             ),
//             "-=0.5"
//           );
//         }
//         // No swap needed, just remove min highlight
//         mainTimeline.add(removeHighlight(i), "-=0.2");
//       }

//       // Mark element at position i as sorted
//       mainTimeline.add(animateSortedIndicator(i));
//     }

//     // Hide arrows at the end
//     if (minArrowRef.current && jArrowRef.current) {
//       mainTimeline.add(
//         gsap.to(minArrowRef.current, {
//           x: "+=0",
//           y: 0,
//           opacity: 0,
//           duration: 0.5,
//           ease: "power1.out",
//         }),
//         "+=0.5"
//       );
//       mainTimeline.add(
//         gsap.to(jArrowRef.current, {
//           x: "+=0",
//           y: 0,
//           opacity: 0,
//           duration: 0.5,
//           ease: "power1.out",
//         }),
//         "-=0.5"
//       );
//     }

//     // Final sorted animation
//     mainTimeline.add(
//       animateSortedIndicator([...Array(arr.length).keys()]),
//       "-=0.5"
//     );

//     totalStepsRef.current = stepIndex;
//     mainTimeline.addLabel("end");

//     mainTimeline.call(() => {
//       wasPausedRef.current = false;
//       setIsPlaying(false);
//     });

//     timelineRef.current = mainTimeline;
//   };

//   // All the control functions - same pattern as your Insertion Sort
//   const nextStep = (): void => {
//     if (!timelineRef.current) {
//       playAnimation();
//       if (timelineRef.current) {
//         (timelineRef.current as gsap.core.Timeline).pause();
//         currentStepRef.current = 0;
//         (timelineRef.current as gsap.core.Timeline).play(`step-${0}`);
//         currentStepRef.current = 1;
//         (timelineRef.current as gsap.core.Timeline).addPause(`step-${1}`);
//       }
//       return;
//     }

//     if (propsRef.current.isPlaying) {
//       (timelineRef.current as gsap.core.Timeline).pause();
//       currentStepRef.current++;
//       timelineRef.current!.timeScale(4);
//       (timelineRef.current as gsap.core.Timeline).play();
//       (timelineRef.current as gsap.core.Timeline).addPause(
//         `step-${currentStepRef.current}`
//       );
//       setIsPlaying(false);
//     } else {
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
//     }
//   };

//   const pauseAnimation = (): void => {
//     if (timelineRef.current) {
//       timelineRef.current.pause();
//       wasPausedRef.current = true;
//     }
//   };

//   const resetAnimation = (): void => {
//     // Kill any existing timeline
//     if (timelineRef.current) {
//       timelineRef.current.kill();
//       timelineRef.current = null;
//     }

//     // Reset all array elements to original state and restore original order
//     if (arrayElementsRef.current) {
//       // Reset all element styles
//       arrayElementsRef.current.forEach((element) => {
//         if (element) {
//           gsap.set(element, {
//             x: 0,
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

//       // Restore original array order based on the original array prop, handling duplicates
//       // We use a map of value to a queue of elements, so each duplicate is matched in order
//       const valueToElements: Map<number, HTMLDivElement[]> = new Map();
//       arrayElementsRef.current.forEach((element) => {
//         if (element) {
//           const value = parseInt(element.textContent || "0");
//           if (!valueToElements.has(value)) {
//             valueToElements.set(value, []);
//           }
//           valueToElements.get(value)!.push(element);
//         }
//       });

//       const originalOrder: (HTMLDivElement | null)[] = [];
//       for (let i = 0; i < array.length; i++) {
//         const value = array[i];
//         const queue = valueToElements.get(value);
//         if (queue && queue.length > 0) {
//           originalOrder.push(queue.shift()!);
//         } else {
//           originalOrder.push(null);
//         }
//       }
//       arrayElementsRef.current = originalOrder;
//     }

//     // Reset arrows (only min and j arrows now)
//     if (minArrowRef.current && jArrowRef.current) {
//       gsap.killTweensOf([minArrowRef.current, jArrowRef.current]);
//       gsap.set([minArrowRef.current, jArrowRef.current], {
//         opacity: 0,
//         x: 0,
//         y: 0,
//         zIndex: "auto",
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

//   // Control handlers
//   const handlePlay = (): void => {
//     setIsPlaying(true);
//     playAnimation();
//   };

//   const handlePause = (): void => {
//     setIsPlaying(false);
//     pauseAnimation();
//   };

//   const handleReset = (): void => {
//     setIsPlaying(false);
//     resetAnimation();
//   };

//   const handleNextStep = (): void => {
//     nextStep();
//   };

//   const handlePreviousStep = (): void => {
//     previousStep();
//   };

//   const handleArrayChange = (newArray: number[]): void => {
//     setArray(newArray);
//     setIsPlaying(false);
//     resetAnimation();
//   };

//   const handleArraySizeChange = (newSize: number): void => {
//     setArraySize(newSize);
//   };

//   const handleSortOrderChange = (ascending: boolean): void => {
//     setIsAscending(ascending);
//     setIsPlaying(false);
//     resetAnimation();
//   };

//   const handleSpeedChange = (newSpeed: number): void => {
//     setSpeed(newSpeed);
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
//     return () => {
//       if (timelineRef.current) {
//         timelineRef.current.kill();
//         timelineRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div>
//       {/* Animation Container */}
//       <div className="mb-8">
//         <div
//           ref={containerRef}
//           className="selection-sort-container"
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: "2rem",
//             padding: "2rem",
//             fontFamily: "system-ui, -apple-system, sans-serif",
//             backgroundColor: "#ffffff",
//             color: "#1a1a1a",
//             minHeight: "400px",
//             zIndex: 0,
//           }}
//         >
//           {/* Array Elements */}
//           <div
//             className="array-container"
//             style={{
//               display: "flex",
//               gap: `${BOX_GAP}px`,
//               alignItems: "center",
//               justifyContent: "center",
//               position: "relative",
//               zIndex: 1,
//             }}
//           >
//             {array.map((value, index) => (
//               <div
//                 key={`${index}-${value}`}
//                 ref={(el) => {
//                   arrayElementsRef.current[index] = el;
//                 }}
//                 className={`array-element array-element-${index}`}
//                 style={{
//                   width: `${BOX_WIDTH}px`,
//                   height: `${BOX_HEIGHT}px`,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   backgroundColor: "#f8f9fa",
//                   border: "2px solid #e9ecef",
//                   borderRadius: `${BOX_BORDER_RADIUS}px`,
//                   fontSize: `${BOX_FONT_SIZE}px`,
//                   fontWeight: "600",
//                   color: "#212529",
//                   transition: "all 0.3s ease",
//                   boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
//                   zIndex: 2,
//                 }}
//               >
//                 {value}
//               </div>
//             ))}

//             {/* Min Arrow */}
//             <div
//               ref={minArrowRef}
//               className="min-arrow"
//               style={{
//                 position: "absolute",
//                 left: "0px",
//                 top: "0px",
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "center",
//                 opacity: 0,
//                 transform: "translateX(-50%)",
//               }}
//             >
//               <div
//                 style={{
//                   width: "0",
//                   height: "0",
//                   borderLeft: `${ARROW_SIZE}px solid transparent`,
//                   borderRight: `${ARROW_SIZE}px solid transparent`,
//                   borderBottom: "20px solid #dc3545",
//                 }}
//               />
//               <div
//                 style={{
//                   fontSize: `${ARROW_FONT_SIZE}px`,
//                   fontWeight: "600",
//                   color: "#dc3545",
//                   marginTop: "4px",
//                 }}
//               >
//                 {isAscending ? "min" : "max"}
//               </div>
//             </div>

//             {/* J Arrow */}
//             <div
//               ref={jArrowRef}
//               className="j-arrow"
//               style={{
//                 position: "absolute",
//                 left: "0px",
//                 top: "0px",
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "center",
//                 opacity: 0,
//                 transform: "translateX(-50%)",
//               }}
//             >
//               <div
//                 style={{
//                   width: "0",
//                   height: "0",
//                   borderLeft: `${ARROW_SIZE}px solid transparent`,
//                   borderRight: `${ARROW_SIZE}px solid transparent`,
//                   borderBottom: "20px solid #0d6efd",
//                 }}
//               />
//               <div
//                 style={{
//                   fontSize: `${ARROW_FONT_SIZE}px`,
//                   fontWeight: 600,
//                   color: "#0d6efd",
//                   marginTop: "4px",
//                 }}
//               >
//                 j
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Controls */}
//       <Controls
//         array={array}
//         arraySize={arraySize}
//         isAscending={isAscending}
//         speed={speed}
//         isPlaying={isPlaying}
//         onArrayChange={handleArrayChange}
//         onArraySizeChange={handleArraySizeChange}
//         onSortOrderChange={handleSortOrderChange}
//         onSpeedChange={handleSpeedChange}
//         onPlay={handlePlay}
//         onPause={handlePause}
//         onReset={handleReset}
//         onNextStep={handleNextStep}
//         onPreviousStep={handlePreviousStep}
//       />
//     </div>
//   );
// };

// export default SelectionSort;
