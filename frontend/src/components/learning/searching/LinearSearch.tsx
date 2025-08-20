"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import SortingControls from "../sorting/SortingControl";

// In getDynamicSizing function:
const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 90,
      BOX_HEIGHT: 90,
      BOX_GAP: 20,
      BOX_BORDER_RADIUS: 100,
      BOX_FONT_SIZE: 20,
      IMAGE_HEIGHT: 61,
      IMAGE_WIDTH: 61,
      TOTAL_BOX_SPACING: 80 + 20 + 10, // Added +10 here
      ICON_Y_OFFSET: 155,
      ICON_X_OFFSET: 90,
    };
  } else {
    return {
      BOX_WIDTH: 75,
      BOX_HEIGHT: 75,
      BOX_GAP: 15,
      BOX_BORDER_RADIUS: 100,
      BOX_FONT_SIZE: 16,
      IMAGE_HEIGHT: 245,
      IMAGE_WIDTH: 245,
      TOTAL_BOX_SPACING: 55 + 15 + 20, // Added +10 here
      ICON_Y_OFFSET: 185,
      ICON_X_OFFSET: 105,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const LinearSearch: React.FC<SidebarProps> = ({ isOpen, width }: SidebarProps) => {
  // Initial array
  const initialArray = [42, 17, 89, 31, 65, 8];
  const [searchValue, setSearchValue] = useState<number>(31);
  const [foundIndex, setFoundIndex] = useState<number>(-1);

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(6);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const magnifyingGlassRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, isPlaying, searchValue });

  // Step management
  const currentStepRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(0);

  const [targetFound, setTargetFound] = useState<boolean>(false);
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const foundElementRef = useRef<HTMLDivElement>(null);

  const dynamicSizing = getDynamicSizing(array.length);
  const {
    BOX_WIDTH,
    BOX_HEIGHT,
    BOX_GAP,
    BOX_BORDER_RADIUS,
    BOX_FONT_SIZE,
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
    ICON_Y_OFFSET,
    ICON_X_OFFSET,
    TOTAL_BOX_SPACING,
  } = dynamicSizing;

  // Animations
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

  const highlightCurrentElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196f3",
      scale: 1.1,
      boxShadow: "0 0 15px rgba(33, 150, 243, 0.3), 0 2px 12px rgba(33, 150, 243, 0.2)",
      duration: 0.3,
      ease: "power2.out",
    });

    return timeline;
  };

  const animateFoundElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#d4edda",
      borderColor: "#c3e6cb",
      scale: 1.2,
      boxShadow: "0 0 20px rgba(40, 167, 69, 0.4)",
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
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
      scale: 1,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      duration: 0.3,
      ease: "power2.out",
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
    setIsSearching(true);
    setFoundIndex(-1);

    const arr = [...array];
    const n = arr.length;
    const mainTimeline = gsap.timeline();
    mainTimeline.timeScale(propsRef.current.speed);
    currentStepRef.current = 0;

    // Initial setup
    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
    });

    let stepIndex = 1;

    // Show magnifying glass
    if (magnifyingGlassRef.current) {
      mainTimeline.add(
        gsap.fromTo(
          magnifyingGlassRef.current,
          {
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0.5,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
          }
        )
      );
    }

    // Linear search algorithm
    for (let i = 0; i < n; i++) {
      mainTimeline.addLabel(`step-${stepIndex}`, "+=0.2");
      {
        const thisStep = stepIndex;
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
      }
      stepIndex++;

      // Move magnifying glass to current position
      if (magnifyingGlassRef.current) {
        mainTimeline.add(
          slideElementTo(
            magnifyingGlassRef.current,
            i * (TOTAL_BOX_SPACING),
            `+=0`,
            0.3
          ),
          "+=0.2"
        );
      }

      // Highlight current element
      mainTimeline.add(highlightCurrentElement(i), "-=0.3");

      // Small pause for comparison
      mainTimeline.to({}, { duration: 0.4 });

      // Check if current element is the target
      if (arr[i] === propsRef.current.searchValue) {
        // Mark as found
        mainTimeline.add(animateFoundElement(i), "-=0.2");
        
        // Animate element to target box
        const element = arrayElementsRef.current[i];
        if (element && targetBoxRef.current && containerRef.current) {
          mainTimeline.call(() => {
            setFoundIndex(i);
            setTargetFound(true);
            
            // Create clone for animation
            const clone = element.cloneNode(true) as HTMLDivElement;
            if (foundElementRef.current) {
              foundElementRef.current.appendChild(clone);
            }

            // Get positions relative to container
            const containerRect = containerRef.current!.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const targetRect = targetBoxRef.current!.getBoundingClientRect();

            // Position clone at element's location
            gsap.set(clone, {
              position: 'absolute',
              left: elementRect.left - containerRect.left,
              top: elementRect.top - containerRect.top,
              zIndex: 1000,
              backgroundColor: "#d4edda",
              borderColor: "#c3e6cb",
              scale: 1.2,
              boxShadow: "0 0 20px rgba(40, 167, 69, 0.4)",
            });

            // Animate clone to target position
            gsap.to(clone, {
              x: (targetRect.left - containerRect.left) - (elementRect.left - containerRect.left),
              y: (targetRect.top - containerRect.top) - (elementRect.top - containerRect.top),
              duration: 0.8,
              ease: "back.out(1.7)",
              onComplete: () => {
                // Remove clone
                if (foundElementRef.current && clone.parentNode) {
                  foundElementRef.current.removeChild(clone);
                }
                // Make target box green
                if (targetBoxRef.current) {
                  gsap.to(targetBoxRef.current, {
                    backgroundColor: "#d4edda",
                    borderColor: "#c3e6cb",
                    scale: 1.1,
                    duration: 0.5
                  });
                }
              }
            });
          });
        }

        break;
      } else {
        // Remove highlight if not found
        mainTimeline.add(removeHighlight(i), "-=0.2");
      }
    }

    // Hide magnifying glass at the end
    if (magnifyingGlassRef.current) {
      mainTimeline.add(
        gsap.to(magnifyingGlassRef.current, {
          opacity: 0,
          scale: 0.5,
          duration: 0.5,
          ease: "back.in(1.7)",
        }),
        "+=0.5"
      );
    }

    totalStepsRef.current = stepIndex;
    mainTimeline.addLabel("end");

    mainTimeline.call(() => {
      wasPausedRef.current = false;
      setIsPlaying(false);
      setIsSearching(false);
    });

    timelineRef.current = mainTimeline;
  };

  // Control functions
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
    setTargetFound(false);
    if (targetBoxRef.current) {
      gsap.to(targetBoxRef.current, {
        backgroundColor: "#f8f9fa",
        borderColor: "#e9ecef",
        scale: 1,
        duration: 0.3
      });
    }
    if (foundElementRef.current) {
      foundElementRef.current.innerHTML = '';
    }
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
            scale: 1,
            backgroundColor: "#f8f9fa",
            borderColor: "#e9ecef",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            // zIndex: "auto",
          });
        }
      });
    }

    if (magnifyingGlassRef.current) {
      gsap.killTweensOf(magnifyingGlassRef.current);
      gsap.set(magnifyingGlassRef.current, {
        opacity: 0,
        x: 0,
        y: 0,
        rotation: 20,
        scale: 0,
        // zIndex: "auto",
      });
    }

    wasPausedRef.current = false;
    currentStepRef.current = 0;
    setFoundIndex(-1);
    setIsSearching(false);
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
    }
  };

  // Event handlers
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

  const searchForArrayElement = () => {
    // Pick a random element from the array
    const randomIndex = Math.floor(Math.random() * array.length);
    setSearchValue(array[randomIndex]);
    propsRef.current.searchValue = array[randomIndex];
    setIsPlaying(false);
    resetAnimation();
  };

  const searchForNonArrayElement = () => {
    // Pick a number not in the array (between 1-100)
    let randomNum;
    do {
      randomNum = Math.floor(Math.random() * 100) + 1;
    } while (array.includes(randomNum));

    setSearchValue(randomNum);
    propsRef.current.searchValue = randomNum;
    setIsPlaying(false);
    resetAnimation();
  };

  // Effects
  useEffect(() => {
    propsRef.current = { array, speed, isPlaying, searchValue };
    if (timelineRef.current) {
      timelineRef.current.timeScale(speed);
    }
  }, [array, speed, isPlaying, searchValue]);

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
          className="linear-search-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            minHeight: "400px",
            position: "relative",
          }}
        >
          {/* Current Target Display - Improved */}
          <div
            ref={foundElementRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              pointerEvents: 'none',
              zIndex: 999
            }}
          >
            {/* This is where the animated element will be temporarily placed */}
          </div>
          <div
            ref={targetBoxRef}
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
              color: "#6c757d",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              marginBottom: "20px",
              opacity: 0.7
            }}
          >
            {searchValue}
          </div>

          {/* Magnifying Glass - Fixed to appear above */}
          <div
            ref={magnifyingGlassRef}
            style={{
              position: "absolute",
              top: `${ICON_Y_OFFSET}px`,
              left: `${ICON_X_OFFSET}px`,
              transform: "translateX(-50%)",
              width: `${IMAGE_WIDTH}px`,
              height: `${IMAGE_HEIGHT}px`,
              opacity: 0,
              zIndex: 100, // Extremely high z-index
              pointerEvents: "none",
            }}
          >
            <Image
              src="/Images/MagnifyingGlasss.png"
              alt="Magnifying glass"
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
              }}
            />
          </div>

          {/* Array Elements - Ensure lower z-index */}
          <div
            className="array-container"
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 0, // Lower than magnifying glass
              marginTop: "50px",
            }}
          >
            {array.map((value, index) => (
              <div
                key={`${index}-${value}`}
                ref={(el) => {
                  arrayElementsRef.current[index] = el;
                }}
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
                  zIndex: 0, // Lower than magnifying glass
                  position: "relative", // Needed for z-index to work
                }}
              >
                {value}
              </div>
            ))}
          </div>

          {/* Index Labels */}
          <div
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              marginTop: "8px",
            }}
          >
            {array.map((_, index) => (
              <div
                key={`index-${index}`}
                style={{
                  width: `${BOX_WIDTH}px`,
                  textAlign: "center",
                  fontSize: "14px",
                  color: "#6c757d",
                }}
              >
                {index}
              </div>
            ))}
          </div>

          {/* Search Buttons - Shadcn black style */}
          <div style={{
            display: "flex",
            gap: "16px",
            marginTop: "2rem",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            <button
              onClick={searchForArrayElement}
              style={{
                padding: "12px 24px",
                backgroundColor: "hsl(240, 5.9%, 10%)",
                color: "white",
                border: "1px solid hsl(240, 5.9%, 10%)",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              disabled={isSearching}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(240, 4.0%, 16%)";
                e.currentTarget.style.borderColor = "hsl(240, 4.0%, 16%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(240, 5.9%, 10%)";
                e.currentTarget.style.borderColor = "hsl(240, 5.9%, 10%)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.98)";
                e.currentTarget.style.boxShadow = "0 0 0 1px hsl(240, 5.9%, 10%)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7.5C8.00003 7.77614 7.77617 8 7.50003 8C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z"
                  fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              Find in Array
            </button>
            <button
              onClick={searchForNonArrayElement}
              style={{
                padding: "12px 24px",
                backgroundColor: "hsl(0, 0%, 100%)",
                color: "hsl(240, 5.9%, 10%)",
                border: "1px solid hsl(240, 5.9%, 90%)",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              disabled={isSearching}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(240, 4.9%, 83.9%)";
                e.currentTarget.style.borderColor = "hsl(240, 4.9%, 83.9%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(0, 0%, 100%)";
                e.currentTarget.style.borderColor = "hsl(240, 5.9%, 90%)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.98)";
                e.currentTarget.style.boxShadow = "0 0 0 1px hsl(240, 5.9%, 90%)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7.5C8.00003 7.77614 7.77617 8 7.50003 8C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z"
                  fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              Find Outside Array
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <SortingControls
        isOpen={isOpen}
        width={width}
        array={array}
        arraySize={arraySize}
        isAscending={true}
        speed={speed}
        isPlaying={isPlaying}
        onArrayChange={handleArrayChange}
        onArraySizeChange={handleArraySizeChange}
        onSortOrderChange={() => { }}
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

export default LinearSearch;