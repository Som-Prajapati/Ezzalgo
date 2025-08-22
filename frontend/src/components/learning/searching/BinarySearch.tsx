"use client";
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { Search } from "lucide-react";
import SearchingControls from "./SearchingControl";

// In getDynamicSizing function:
const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 90,
      BOX_HEIGHT: 90,
      BOX_GAP: 20,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 20,
      TOTAL_BOX_SPACING: 80 + 20 + 10,
      POINTER_Y_OFFSET: 155,
      POINTER_X_OFFSET: 90,
    };
  } else {
    return {
      BOX_WIDTH: 75,
      BOX_HEIGHT: 75,
      BOX_GAP: 15,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 16,
      TOTAL_BOX_SPACING: 55 + 15 + 20,
      POINTER_Y_OFFSET: 185,
      POINTER_X_OFFSET: 105,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const BinarySearch: React.FC<SidebarProps> = ({
  isOpen,
  width,
}: SidebarProps) => {
  // Initial array (must be sorted for binary search)
  const initialArray = [8, 17, 31, 42, 65, 89];
  const [searchValue, setSearchValue] = useState<number>(65);
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
  const pointerRefs = useRef({
    low: useRef<HTMLDivElement>(null),
    mid: useRef<HTMLDivElement>(null),
    high: useRef<HTMLDivElement>(null),
  });
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
    TOTAL_BOX_SPACING,
    POINTER_Y_OFFSET,
    POINTER_X_OFFSET,
  } = dynamicSizing;

  // Animations
  const highlightCurrentElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196f3",
      scale: 1.1,
      boxShadow: "0 0 15px rgba(33, 150, 243, 0.5), 0 2px 12px rgba(33, 150, 243, 0.3)",
      duration: 0.8,
      ease: "power2.out",
    });

    return timeline;
  };

  const eliminateElements = (start: number, end: number, direction: 'left' | 'right'): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    
    // Calculate rotation direction based on which side is being eliminated
    const rotation = direction === 'left' ? -15 : 15;
    
    for (let i = start; i <= end; i++) {
      const element = arrayElementsRef.current[i];
      if (element) {
        timeline.to(element, {
          backgroundColor: "#9e9e9e",
          borderColor: "#757575",
          y: 400,
          opacity: 0,
          rotation: rotation,
          duration: 0.6,
          ease: "power2.in",
          delay: (i - start) * 0, // Reduced delay for faster animation
        }, `eliminate-${i}`);
      }
    }
    
    return timeline;
  };

  const restoreElements = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    
    arrayElementsRef.current.forEach((element, index) => {
      if (element) {
        timeline.to(element, {
          backgroundColor: "#f8f9fa",
          borderColor: "#e9ecef",
          y: 0,
          opacity: 0.8,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(1.5)",
        }, index * 0.05);
      }
    });
    
    return timeline;
  };

  const animateFoundElement = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    
    // Make the found element animation faster and smoother
    timeline.to(element, {
      backgroundColor: "#4CAF50",
      borderColor: "#388E3C",
      scale: 1.3,
      boxShadow: "0 0 25px rgba(76, 175, 80, 0.8)",
      duration: 0.6,
      ease: "elastic.out(1.2, 0.5)",
    }).to(element, {
      scale: 1.2,
      boxShadow: "0 0 15px rgba(76, 175, 80, 0.6)",
      duration: 0.4,
      ease: "power2.out",
    });

    return timeline;
  };

  const animateNotFound = (): gsap.core.Timeline => {
    const timeline = gsap.timeline();
    
    // Animate all elements to grey
    arrayElementsRef.current.forEach((element, index) => {
      if (element) {
        timeline.to(element, {
          backgroundColor: "#9e9e9e",
          borderColor: "#757575",
          duration: 1.0,
          ease: "power2.out",
        }, index * 0.1);
      }
    });

    return timeline;
  };

  const resetElementAppearance = (index: number): gsap.core.Timeline => {
    const element = arrayElementsRef.current[index];
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      backgroundColor: "#f8f9fa",
      borderColor: "#e9ecef",
      scale: 1,
      opacity: 0.8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      duration: 0.5,
      ease: "power2.out",
    });

    return timeline;
  };

// Replace the animatePointerAppearance and movePointer functions:

const animatePointerAppearance = (pointer: 'low' | 'mid' | 'high', position: number): gsap.core.Timeline => {
  const element = pointerRefs.current[pointer].current;
  if (!element) return gsap.timeline();

  const timeline = gsap.timeline();
  
  // Calculate position based on array index
  // Start from the left edge of the container and account for each box + gap
  const actualPosition = position * (BOX_WIDTH + BOX_GAP) + (BOX_WIDTH / 2);
  
  console.log(`Animating ${pointer} pointer for index ${position}: Calculated position: ${actualPosition}`);
//   console.log(`  BOX_WIDTH: ${BOX_WIDTH}, BOX_GAP: ${BOX_GAP}`);
//   console.log(`  `);
  
  // Set initial position (below the array)
  gsap.set(element, {
    x: actualPosition,
    y: 100, // Start below
    opacity: 0,
  });
  
  // Animate to final position
  timeline.to(element, { 
    y: 0, // Move to final position above array
    opacity: 1, 
    duration: 1.5,
    ease: "back.out(1.5)"
  });

  return timeline;
};

const movePointer = (pointer: 'low' | 'mid' | 'high', position: number): gsap.core.Timeline => {
  const element = pointerRefs.current[pointer].current;
  if (!element) return gsap.timeline();

  const timeline = gsap.timeline();
  
  // Calculate position based on array index
  const actualPosition = position * (BOX_WIDTH + BOX_GAP) + (BOX_WIDTH / 2);
  
    //   console.log(`Moving ${pointer} pointer to index ${position}:`);
    //   console.log(`  Calculated position: ${actualPosition}`);
  
  timeline.to(element, {
    x: actualPosition,
    duration: 1.6,
    ease: "power1.inOut",
  });

  return timeline;
};

  const hidePointer = (pointer: 'low' | 'mid' | 'high'): gsap.core.Timeline => {
    const element = pointerRefs.current[pointer].current;
    if (!element) return gsap.timeline();

    const timeline = gsap.timeline();
    timeline.to(element, {
      y: -100,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in",
    });

    return timeline;
  };

  // Play animation
// Replace your playAnimation function with this corrected version:

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

  // Initial setup - set initial state for all elements
  mainTimeline.addLabel("step-0");
  mainTimeline.call(() => {
    currentStepRef.current = 0;
    // Set initial state for all elements
    arrayElementsRef.current.forEach((_, index) => {
      gsap.set(arrayElementsRef.current[index], {
        opacity: 0.8,
        y: 0,
        rotation: 0
      });
    });
  });

  let stepIndex = 1;

  // Binary search algorithm - Pre-calculate all steps
  let low = 0;
  let high = n - 1;
  const searchSteps: Array<{
    low: number;
    high: number;
    mid: number;
    comparison: 'found' | 'go_right' | 'go_left' | 'not_found';
    eliminateStart?: number;
    eliminateEnd?: number;
    eliminateDirection?: 'left' | 'right';
    newLow?: number;
    newHigh?: number;
  }> = [];

  // Pre-calculate all binary search steps
  let found = false;
  while (low <= high && !found) {
    const mid = Math.floor((low + high) / 2);
    
    if (arr[mid] === propsRef.current.searchValue) {
      searchSteps.push({
        low,
        high,
        mid,
        comparison: 'found'
      });
      found = true;
    } else if (arr[mid] < propsRef.current.searchValue) {
      // Search in the right half - eliminate left half
      searchSteps.push({
        low,
        high,
        mid,
        comparison: 'go_right',
        eliminateStart: low,
        eliminateEnd: mid,
        eliminateDirection: 'left',
        newLow: mid + 1,
        newHigh: high
      });
      low = mid + 1;
    } else {
      // Search in the left half - eliminate right half
      searchSteps.push({
        low,
        high,
        mid,
        comparison: 'go_left',
        eliminateStart: mid,
        eliminateEnd: high,
        eliminateDirection: 'right',
        newLow: low,
        newHigh: mid - 1
      });
      high = mid - 1;
    }
  }

  if (!found) {
    searchSteps.push({
      low,
      high,
      mid: -1, // Invalid mid for not found case
      comparison: 'not_found'
    });
  }

  // Show initial low and high pointers
  if (searchSteps.length > 0) {
    const firstStep = searchSteps[0];
    mainTimeline.add(animatePointerAppearance('low', firstStep.low), "step-0");
    mainTimeline.add(animatePointerAppearance('high', firstStep.high), "step-0+=0.3");
    console.log(`Initial pointers set: low=${firstStep.low}, high=${firstStep.high} mid=${firstStep.mid}`);
  }

  // Now animate each step
  searchSteps.forEach((step, stepIdx) => {
    const currentStep = stepIndex;
    
    // Add step label
    mainTimeline.addLabel(`step-${stepIndex}`, "+=0.8");
    mainTimeline.call(() => {
      currentStepRef.current = stepIndex;
      console.log(`Step ${stepIndex}: Calculating mid = ${step.mid} (between low=${step.low} and high=${step.high})`);
    });
    stepIndex++;

    if (step.comparison === 'not_found') {
      // Handle not found case
      mainTimeline.add(animateNotFound(), `step-${currentStep}+=0.5`);
      
      // Make target box red
      mainTimeline.call(() => {
        if (targetBoxRef.current) {
          gsap.to(targetBoxRef.current, {
            backgroundColor: "#f8d7da",
            borderColor: "#f5c6cb",
            scale: 1.1,
            duration: 0.8,
          });
        }
      }, [], `step-${currentStep}+=1.0`);
      return; // Skip rest of the steps
    }

    // Reset and show mid pointer at the correct position for this step
    mainTimeline.call(() => {
      // Reset mid pointer to hidden state
      if (pointerRefs.current.mid.current) {
        gsap.set(pointerRefs.current.mid.current, {
          opacity: 0,
          y: 100
        });
      }
    }, [], `step-${currentStep}`);

    // Show mid pointer at the calculated position for THIS step
    const midPointerTimeline = gsap.timeline();
    const actualPosition = step.mid * (BOX_WIDTH + BOX_GAP) + (BOX_WIDTH / 2);
    console.log(`Animating mid pointer for step ${currentStep}: Calculated position: ${actualPosition}`);
    
    const element = pointerRefs.current.mid.current;
    if (element) {
      gsap.set(element, {
        x: actualPosition,
        y: 100,
        opacity: 0,
      });
      
      midPointerTimeline.to(element, { 
        y: 0,
        opacity: 1, 
        duration: 1.5,
        ease: "back.out(1.5)"
      });
    }

    mainTimeline.add(midPointerTimeline, `step-${currentStep}+=0.2`);

    // Highlight mid element
    // mainTimeline.add(animatePointerAppearance('mid', step.mid), "step-0");
    mainTimeline.add(highlightCurrentElement(step.mid), `step-${currentStep}+=0.8`);

    // Pause for comparison
    mainTimeline.to({}, { duration: 1.0 }, `step-${currentStep}+=1.4`);

    

    if (step.comparison === 'found') {
      // Mark as found
      mainTimeline.add(animateFoundElement(step.mid), `step-${currentStep}+=2.0`);
      
      mainTimeline.call(() => {
        setFoundIndex(step.mid);
        setTargetFound(true);
        
        // Make target box green
        if (targetBoxRef.current) {
          gsap.to(targetBoxRef.current, {
            backgroundColor: "#4CAF50",
            borderColor: "#388E3C",
            scale: 1.1,
            duration: 0.6
          });
        }
      }, [], `step-${currentStep}+=2.3`);
    } else {
      // Eliminate elements and move pointers
      if (step.eliminateStart !== undefined && step.eliminateEnd !== undefined) {
        mainTimeline.add(
          eliminateElements(step.eliminateStart, step.eliminateEnd, step.eliminateDirection!), 
          `step-${currentStep}+=2.0`
        );
      }

      // Move the appropriate pointer
      if (step.comparison === 'go_right' && step.newLow !== undefined) {
        mainTimeline.add(movePointer('low', step.newLow), `step-${currentStep}+=2.6`);
      } else if (step.comparison === 'go_left' && step.newHigh !== undefined) {
        mainTimeline.add(movePointer('high', step.newHigh), `step-${currentStep}+=2.6`);
      }

      // Hide mid pointer after elimination - it will reappear fresh in next iteration
      mainTimeline.add(hidePointer('mid'), `step-${currentStep}+=3.2`);
    }
  });

  // Add restoration phase - all elements come back at the same time
  mainTimeline.add(restoreElements(), "+=1.5");

  // Hide all pointers at the end
  mainTimeline.add(hidePointer('low'), "+=0.8");
  mainTimeline.add(hidePointer('high'), "<0.3");
  mainTimeline.add(hidePointer('mid'), "<0.3");

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
      duration: 0.5
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
          opacity: 0.8,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        });
      }
    });
  }

  // Reset pointers to initial state (hidden, positioned at start)
  if (pointerRefs.current.low.current) {
    gsap.set(pointerRefs.current.low.current, { 
      opacity: 0,
      x: BOX_WIDTH / 2, // Position at first element
      y: 100
    });
  }
  if (pointerRefs.current.mid.current) {
    gsap.set(pointerRefs.current.mid.current, { 
      opacity: 0,
      x: BOX_WIDTH / 2, // Position at first element
      y: 100
    });
  }
  if (pointerRefs.current.high.current) {
    gsap.set(pointerRefs.current.high.current, { 
      opacity: 0,
      x: BOX_WIDTH / 2, // Position at first element
      y: 100
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
    // Ensure array is sorted for binary search
    const sortedArray = [...newArray].sort((a, b) => a - b);
    setArray(sortedArray);
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
          className="binary-search-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            minHeight: "500px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Current Target Display */}
          <div
            ref={foundElementRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              pointerEvents: "none",
              zIndex: 999,
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
              opacity: 0.7,
            }}
          >
            {searchValue}
          </div>

          {/* Array Elements */}
          <div
            className="array-container"
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 0,
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
                  zIndex: 0,
                  position: "relative",
                  opacity: 0.8,
                }}
              >
                {value}
              </div>
            ))}
          </div>

          {/* Pointer Indicators */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "80px",
            marginTop: "10px"
          }}>
            {/* Low Pointer */}
            <div
              ref={pointerRefs.current.low}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
                // y: 100
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "12px solid #ff6b6b",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#ff6b6b",
                  marginTop: "4px",
                }}
              >
                Low
              </span>
            </div>

            {/* Mid Pointer */}
            <div
              ref={pointerRefs.current.mid}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
                // y: 100
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "12px solid #4ecdc4",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4ecdc4",
                  marginTop: "4px",
                }}
              >
                Mid
              </span>
            </div>

            {/* High Pointer */}
            <div
              ref={pointerRefs.current.high}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: 0,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
                // y: 100
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "12px solid #45b7d1",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#45b7d1",
                  marginTop: "4px",
                }}
              >
                High
              </span>
            </div>
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

          {/* Search Buttons */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "2rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
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
                gap: "8px",
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
                e.currentTarget.style.boxShadow =
                  "0 0 0 1px hsl(240, 5.9%, 10%)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 1px 2px 0 rgb(0 0 0 / 0.05)";
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7.5C8.00003 7.77614 7.77617 8 7.50003 8C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
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
                gap: "8px",
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
                e.currentTarget.style.boxShadow =
                  "0 0 0 1px hsl(240, 5.9%, 90%)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 1px 2px 0 rgb(0 0 0 / 0.05)";
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
      <SearchingControls
        isOpen={isOpen}
        width={width}
        array={array}
        arraySize={arraySize}
        isAscending={true}
        speed={speed}
        isPlaying={isPlaying}
        onArrayChange={handleArrayChange}
        onArraySizeChange={handleArraySizeChange}
        onSortOrderChange={() => {}}
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

export default BinarySearch;
