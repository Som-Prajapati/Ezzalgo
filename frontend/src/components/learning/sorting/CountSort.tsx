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
      BOX_BORDER_RADIUS: 10,
      BOX_FONT_SIZE: 20,
      ARROW_SIZE: 8,
      ARROW_FONT_SIZE: 16,
      ECLIPSE_HEIGHT: 80,
      TOTAL_BOX_SPACING: 80 + 16,
      ARROW_Y_OFFSET_DOWN: (80 * 2.4) / 2,
      ARROW_X_OFFSET: 80 / 2,
      COUNT_WIDTH: 60,
      COUNT_HEIGHT: 40,
      COUNT_GAP: 10,
      COUNT_LABEL_HEIGHT: 25,
      COUNT_SET_X: (80 - 60) / 2,
      COUNT_SET_Y: -90,

      ARRAY_OFFSET_Y:
        typeof window !== "undefined" ? window.innerHeight * 0.3 : 150,
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
      COUNT_WIDTH: 45,
      COUNT_HEIGHT: 35,
      COUNT_GAP: 8,
      COUNT_LABEL_HEIGHT: 20,
      ARRAY_OFFSET_Y: "30vh",
      COUNT_SET_X: (80 - 60) / 2,
      // INSERT_YOUR_CODE
      COUNT_SET_Y: -30,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const CountSort: React.FC<SidebarProps> = ({ isOpen, width }: SidebarProps) => {
  // Fixed initial array to prevent hydration mismatch
  console.log(isOpen, width);
  const getFixedInitialArray = () => [4, 2, 2, 8, 3, 3, 1];
  const initialArray = getFixedInitialArray();

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(7);
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPseudoCodeLine, setCurrentPseudoCodeLine] = useState(0);
  const tabTitles = ["Selection Sort"] as const;
  const showPseudoCode = 0;
  const pseudoCode = [["------- selection sort"]];
  const [showCodePanel, setShowCodePanel] = useState(false);

  const highlightStateRef = useRef<
    Map<number, { elementIndex: number; type: string }>
  >(new Map());

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const countElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const countElementsIndexRef = useRef<(HTMLDivElement | null)[]>([]);
  const countLabelRef = useRef<HTMLDivElement>(null);

  const currentElementArrowRef = useRef<HTMLDivElement>(null);
  const stepIndicatorRef = useRef<HTMLDivElement>(null);
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
    COUNT_WIDTH,
    COUNT_HEIGHT,
    COUNT_GAP,
    COUNT_LABEL_HEIGHT,
    ARRAY_OFFSET_Y,
    COUNT_SET_X,
    COUNT_SET_Y,
  } = dynamicSizing;

  const TOP_OFFSET = BOX_HEIGHT * 4;
  const BOTTOM_OFFSET = BOX_HEIGHT * 2;

  // Get max value for count array size
  const getMaxValue = (arr: number[]): number => {
    return Math.max(...arr);
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

  // Highlight element
  const highlightElement = (
    element: HTMLElement,
    color: string = "#ffeb3b"
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    const elementIndex = arrayElementsRef.current.indexOf(
      element as HTMLDivElement
    );

    // Animate to highlighted state
    timeline.fromTo(
      element,
      {
        opacity: 1,
        scale: 1,
      },
      {
        opacity: 1,
        scale: 1.05,
        backgroundColor: color,
        duration: 0.15,
        ease: "power2.out",
        onStart: () => {
          highlightStateRef.current.set(currentStepRef.current, {
            elementIndex,
            type: "element",
          });
        },
      }
    );

    // Scale back to normal
    timeline.to(element, {
      scale: 1,
      duration: 0.15,
      ease: "power2.out",
    });

    return timeline;
  };

  const removeElementHighlight = (element: HTMLElement): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    timeline.to({}, { duration: 0.1 });

    // Animate back to original state
    timeline.add(
      gsap.to(element, {
        opacity: 0,
        scale: 0.95,
        backgroundColor: "#f8f9fa",
        duration: 0.15,
        ease: "power2.out",
      })
    );

    return timeline;
  };

  // Highlight count element
  const highlightCountElement = (countIndex: number): gsap.core.Timeline => {
    const countElement = countElementsRef.current[countIndex];
    if (!countElement) return gsap.timeline();

    const timeline = gsap.timeline();

    timeline.to(countElement, {
      backgroundColor: "#f0ad4e",
      scale: 1.1,
      duration: 0.3,
      ease: "power1.inOut",
    });

    return timeline;
  };

  // Remove count element highlighting
  const removeCountElementHighlight = (
    countIndex: number
  ): gsap.core.Timeline => {
    const countElement = countElementsRef.current[countIndex];
    if (!countElement) return gsap.timeline();

    const timeline = gsap.timeline();

    timeline.to(countElement, {
      backgroundColor: "transparent",
      scale: 1,
      duration: 0.3,
      ease: "power1.inOut",
    });

    return timeline;
  };

  const removeStepIndicator = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    if (stepIndicatorRef.current) {
      timeline.to(stepIndicatorRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        ease: "power1.inOut",
      });
    }

    return timeline;
  };

  // Update step indicator
  const updateStepIndicator = (step: string): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    const element = stepIndicatorRef.current;
    if (element) {
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
            element.textContent = `Current step: ${step}`;
          },
        }
      );
    }

    return timeline;
  };

  // Show count array
  const showCountArray = (maxVal: number): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Initialize count elements if they don't exist
    if (countElementsRef.current.length < maxVal + 1) {
      countElementsRef.current = new Array(maxVal + 1).fill(null);
    }

    timeline.to({}, { duration: 0.3 });

    return timeline;
  };

  // Update count value
  const updateCountValue = (
    countIndex: number,
    newValue: number
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    const countElement = countElementsRef.current[countIndex];

    if (countElement) {
      timeline.to({}, { duration: 0.1 });

      timeline.call(() => {
        countElement.textContent = newValue.toString();
      });

      // Add a bounce effect
      timeline.fromTo(
        countElement,
        { scale: 1 },
        {
          scale: 1.2,
          duration: 0.1,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
        }
      );
    }

    return timeline;
  };

  // INSERT_YOUR_CODE
  /**
   * Returns the actual position (bounding client rect) of the count element for a given index.
   * @param {number} index - The index of the count element.
   * @returns {{x: number, y: number, width: number, height: number} | null} The bounding rect, or null if not found.
   */

  function slideArrayElementToCountElement(
    arrayIdx: number,
    countIdx: number
  ): gsap.core.Timeline {
    const arrayEl = arrayElementsRef.current[arrayIdx];
    const countEl = countElementsRef.current[countIdx];
    if (!arrayEl || !countEl) return gsap.timeline(); // Return an empty timeline instead of null

    // Get the bounding rectangles of both elements
    const arrayRect = arrayEl.getBoundingClientRect();
    const countRect = countEl.getBoundingClientRect();

    // Calculate the offset needed to move arrayEl to countEl (relative to their current positions)
    const dx = countRect.left - arrayRect.left - COUNT_SET_X;
    const dy = countRect.top - arrayRect.top + COUNT_SET_Y;

    // Animate the movement
    const tl = gsap.timeline();
    tl.add(slideElementTo(arrayEl, dx, dy, 0.8));
    // INSERT_YOUR_CODE
    // Add a fade animation (opacity 0 -> 1) with no position change
    // Fade out the array element after sliding to the count element
    tl.add(
      gsap.to(arrayEl, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      })
      // start slightly before the previous animation ends for a smooth effect
    );

    return tl;
  }

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

    // Make all array elements slide to the top using slideElementTo with a stagger of 0.1
    arrayElementsRef.current.forEach((element, idx) => {
      if (element) {
        mainTimeline.add(
          slideElementTo(element, 0, -ARRAY_OFFSET_Y),
          idx * 0.1
        );
      }
    });

    // Fade in all countElementsRef elements (opacity 0 -> 1)
    mainTimeline.to(countElementsRef.current.filter(Boolean), {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });

    mainTimeline.to(
      Array.from(
        containerRef.current?.querySelectorAll(
          ".count-container > div > div > div:last-child"
        ) || []
      ),
      {
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
      }
    );
    // Fade in "Count Array" label
    mainTimeline.to(
      containerRef.current?.querySelectorAll(
        ".count-container > div:last-child"
      ) || [],
      {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      }
    );

    const max = Math.max(...array);
    // let min = Math.min(...array);
    const count = new Array(max - 0 + 1).fill(0);

    for (let i = 0; i < arr.length; i++) {
      count[arr[i]]++;
      const count_increment = count[arr[i]];
      // INSERT_YOUR_CODE
      if (arrayElementsRef.current[i]) {
        // mainTimeline.add(
        //   highlightElement(arrayElementsRef.current[i]!, "blue")
        // );

        // mainTimeline.add(highlightCountElement(arr[i]));

        mainTimeline.add(slideArrayElementToCountElement(i, arr[i]));
        // INSERT_YOUR_CODE
        // mainTimeline.add(removeElementHighlight(arrayElementsRef.current[i]!));
        // mainTimeline.add(
        //   highlightElement(arrayElementsRef.current[i]!, "blue")
        // );

        // INSERT_YOUR_CODE
        // Update the value in the count array visually and update the countElementsRef
        mainTimeline.add(() => {
          // Update the count value in the DOM
          const countElement = countElementsRef.current[arr[i]];
          if (countElement) {
            // Find the value display (assume it's the last child div)
            const valueDiv = countElement.querySelector("div:last-child");
            if (valueDiv) {
              valueDiv.textContent = count_increment.toString();
            }
          }
        });
      }

      // mainTimeline.add(() => {
      //   const thisValue = count[arr[i]];
      //   updateCountValue(array[i], thisValue);
      // }, ">");

      // const newArrayElementsOrder: (HTMLDivElement | null)[] = [];
      // for (let i = 0; i < array.length; i++) {
      //   // Find the element whose textContent matches array[i] and hasn't been used yet
      //   let foundIdx = -1;
      //   for (let j = 0; j < arrayElementsRef.current.length; j++) {
      //     if (
      //       arrayElementsRef.current[j] &&
      //       parseInt(arrayElementsRef.current[j]!.textContent || "0") ===
      //         array[i] &&
      //       !newArrayElementsOrder.includes(arrayElementsRef.current[j])
      //     ) {
      //       foundIdx = j;
      //       break;
      //     }
      //   }
      //   if (foundIdx !== -1) {
      //     newArrayElementsOrder.push(arrayElementsRef.current[foundIdx]);
      //   } else {
      //     newArrayElementsOrder.push(null);
      //   }
      // }
      // arrayElementsRef.current = newArrayElementsOrder;
    }

    // let sortedIdx = 0;
    // for (let i = 0; i < count.length; i++) {
    //   while (count[i] > 0) {
    //     array[sortedIdx++] = i;
    //     count[i]--;
    //   }
    // }

    timelineRef.current = mainTimeline;
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
            opacity: 1,
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

    if (countElementsRef.current) {
      countElementsRef.current.forEach((element) => {
        if (element) {
          gsap.set(element, { opacity: 0 });
        }
      });
    }

    // INSERT_YOUR_CODE
    // Reset countElementsIndexRef
    if (countElementsIndexRef.current) {
      countElementsIndexRef.current.forEach((element) => {
        if (element) {
          gsap.set(element, { opacity: 0 });
        }
      });
    }
    // Reset countLabelRef
    if (countLabelRef.current) {
      gsap.set(countLabelRef.current, { opacity: 0 });
    }

    wasPausedRef.current = false;
    currentStepRef.current = 0;
  };
  const handleToggleCodePanel = () => {
    setShowCodePanel(!showCodePanel);
  };

  // 1. Add these step functions
  const nextStep = (): void => {
    console.log("currentStepRef.current:", currentStepRef.current);

    if (!timelineRef.current) {
      playAnimation();
      return;
    }

    if (propsRef.current.isPlaying) {
      (timelineRef.current as gsap.core.Timeline).pause();
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

      timelineRef.current.reverse();
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
        }, 100);
      }
    }
  };

  const pauseAnimation = (): void => {
    if (timelineRef.current) {
      timelineRef.current.pause();
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
    // resetAnimation() would be called here
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
    // resetAnimation() would be called here
  };

  const handleArraySizeChange = (newSize: number): void => {
    setArraySize(newSize);
  };

  const handleSortOrderChange = (ascending: boolean): void => {
    setIsAscending(ascending);
    setIsPlaying(false);
    resetAnimation();
    // resetAnimation() would be called here
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

  const maxValue = getMaxValue(array);

  return (
    <div>
      {/* Animation Container */}
      <div className="mb-8">
        <div
          ref={containerRef}
          className="count-sort-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            // minHeight: "700px",
            zIndex: 0,
          }}
        >
          {/* Step Indicator */}
          <div
            ref={stepIndicatorRef}
            className="step-indicator"
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#495057",
              opacity: 0,
              position: "absolute",
              top: "10%",
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
                  width: BOX_WIDTH,
                  height: BOX_HEIGHT,
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

          {/* Count Array */}
          <div
            className="count-container"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              position: "absolute",
              bottom: "30%",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: `${COUNT_GAP}px`,
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              {Array.from({ length: maxValue + 1 }, (_, index) => (
                <div
                  key={`count-${index}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Count Value */}
                  <div
                    ref={(el) => {
                      countElementsRef.current[index] = el;
                    }}
                    className={`count-element count-element-${index}`}
                    style={{
                      width: `${COUNT_WIDTH}px`,
                      height: `${COUNT_HEIGHT}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "transparent",
                      borderBottom: "2px solid #6c757d",
                      fontSize: `${BOX_FONT_SIZE - 4}px`,
                      fontWeight: "600",
                      color: "#212529",
                      transition: "all 0.3s ease",
                      zIndex: 3,
                      opacity: 0,
                    }}
                  >
                    <div>0</div>
                  </div>

                  {/* Index Label */}
                  <div
                    ref={(el) => {
                      countElementsIndexRef.current[index] = el;
                    }}
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#6c757d",
                      marginTop: "8px",
                      opacity: 0,
                    }}
                  >
                    {index}
                  </div>
                </div>
              ))}
            </div>
            <div
              ref={countLabelRef}
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#495057",
                opacity: 0,
              }}
            >
              Count Array
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <SortingControls
        limit={16}
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

export default CountSort;
