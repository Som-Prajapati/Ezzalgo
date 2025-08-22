"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Controls from "./Control";
import SortingControls from "./SortingControl";

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
      TOTAL_BOX_SPACING: 80 + 16,
      ARROW_Y_OFFSET_UP: -(80 * 1.5) / 2,
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
      TOTAL_BOX_SPACING: 55 + 10,
      ARROW_Y_OFFSET_UP: -(55 * 2.0) / 2,
      ARROW_Y_OFFSET_DOWN: (55 * 2.4) / 2,
      ARROW_X_OFFSET: 55 / 2,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const InsertionSort: React.FC<SidebarProps> = ({
  isOpen,
  width,
}: SidebarProps) => {
  // Fixed initial array to prevent hydration mismatch
  const getFixedInitialArray = () => [42, 17, 89, 31, 65, 8];
  const initialArray = getFixedInitialArray();

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(6);
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showCodePanel, setShowCodePanel] = useState(false);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const jArrowRef = useRef<HTMLDivElement>(null);
  const jPlusOneArrowRef = useRef<HTMLDivElement>(null);
  const keyArrowRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, isAscending, isPlaying });
  const [currentPseudoCodeLine, setCurrentPseudoCodeLine] = useState(0);

  // Add refs for step management
  const currentStepRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(0);
  const tabTitles = ["Selection Sort"] as const;
  const showPseudoCode = 0;
  const pseudoCode = [["------- selection sort"]];

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
    ARROW_Y_OFFSET_UP,
    ARROW_Y_OFFSET_DOWN,
    ARROW_X_OFFSET,
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
      high: "0 0 25px rgb(235, 167, 22), 0 4px 30px rgb(247, 155, 15)",
    };

    const glowShadow = shadowConfig[intensity];
    const originalBoxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";

    // Color configurations for different intensities
    const colorConfig = {
      low: {
        backgroundColor: "#fff3cd",
        borderColor: "orange",
      },
      high: {
        backgroundColor: "rgb(246, 222, 178)",
        borderColor: "red",
      },
    };

    const highlightColors = colorConfig[intensity];
    const originalColors = {
      backgroundColor: "#f8f9fa",
      borderColor: "#e9ecef",
    };

    elements.forEach((element) => {
      timeline
        .to(
          element,
          {
            boxShadow: glowShadow,
            backgroundColor: highlightColors.backgroundColor,
            borderColor: highlightColors.borderColor,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          element,
          {
            boxShadow: originalBoxShadow,
            backgroundColor: originalColors.backgroundColor,
            borderColor: originalColors.borderColor,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );
    });

    return timeline;
  };

  const handleToggleCodePanel = () => {
    setShowCodePanel(!showCodePanel);
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

    // Show and position arrows with slide down animation
    if (keyArrowRef.current && jArrowRef.current && jPlusOneArrowRef.current) {
      if (
        arrayElementsRef.current[0] &&
        arrayElementsRef.current[1] &&
        keyArrowRef.current &&
        jArrowRef.current &&
        jPlusOneArrowRef.current
      ) {
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

    let stepIndex = 1;

    // Insertion sort algorithm with labels
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;

      // Add label for this step
      mainTimeline.addLabel(`step-${stepIndex}`, "+=0.2");
      {
        const thisStep = stepIndex;
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
      }
      stepIndex++;

      // Slide the key arrow and the key box up by box width + 20 px
      if (keyArrowRef.current && arrayElementsRef.current[i]) {
        const keyBox = arrayElementsRef.current[i] as HTMLElement;

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

        // Make the key box slide up
        mainTimeline.add(
          slideElementTo(keyBox, "+=0", `-=${TOTAL_BOX_SPACING}`, 0.3),
          "-=0.6"
        );
      }

      while (j >= 0 && (isAscending ? arr[j] > key : arr[j] < key)) {
        // Add label for shift step
        mainTimeline.addLabel(`step-${stepIndex}`, "+=0.1");
        {
          const thisStep = stepIndex;
          mainTimeline.call(() => {
            currentStepRef.current = thisStep;
          });
        }
        stepIndex++;

        // Highlight comparison elements
        mainTimeline.add(highlightBoxes([j, j + 1], "high"), "+=0.1");

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
          const jBox = arrayElementsRef.current[j + 1] as HTMLElement;
          const keyArrow = keyArrowRef.current;

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

        // Swap the key element with the j element in arrayElementsRef
        if (arrayElementsRef.current) {
          const temp = arrayElementsRef.current[j + 2];
          arrayElementsRef.current[j + 2] = arrayElementsRef.current[j + 1];
          arrayElementsRef.current[j + 1] = temp;
        }
      }

      arr[j + 1] = key;
      // Instead of checking i !== 1, check if the y position of element 0 is not 0
      const elem0 = arrayElementsRef.current[0] as HTMLElement | undefined;
      const y0 = elem0 ? gsap.getProperty(elem0, "y") : 0;
      if (y0 !== 0) {
        mainTimeline.add(highlightBoxes([j, j + 1], "high"), "-=0.1");
      }
      mainTimeline.add(gsap.to({}, { duration: 0.2 }));

      mainTimeline.addLabel(`step-${stepIndex}`, "-=0.1");
      mainTimeline.call(() => {
        currentStepRef.current = i;
      });
      stepIndex++;

      // Place key in final position
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

      // Don't mark elements as sorted during the process - only at the end
    }

    // Hide arrows
    if (keyArrowRef.current && jArrowRef.current && jPlusOneArrowRef.current) {
      mainTimeline.add(
        gsap.to(keyArrowRef.current, {
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
          });
        }
      });

      // Restore original array order based on the original array prop, handling duplicates
      // We use a map of value to a queue of elements, so each duplicate is matched in order
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
    if (keyArrowRef.current && jArrowRef.current && jPlusOneArrowRef.current) {
      gsap.killTweensOf([
        keyArrowRef.current,
        jArrowRef.current,
        jPlusOneArrowRef.current,
      ]);
      gsap.set(
        [keyArrowRef.current, jArrowRef.current, jPlusOneArrowRef.current],
        {
          opacity: 0,
          x: 0,
          y: 0,
          zIndex: "auto",
        }
      );
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
          className="insertion-sort-container"
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
                  backgroundColor: "#ffffffff",
                  border: "2px solid #e9ecef",
                  borderRadius: `${BOX_BORDER_RADIUS}px`,
                  fontSize: `${BOX_FONT_SIZE}px`,
                  fontWeight: "600",
                  color: "#212529",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.08)",
                  zIndex: 2,
                }}
              >
                {value}
              </div>
            ))}

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
                left: ARROW_FONT_SIZE === 16 ? "-12px" : "-10px",
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

export default InsertionSort;
