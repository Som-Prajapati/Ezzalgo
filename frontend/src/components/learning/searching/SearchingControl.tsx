"use client";
import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import DraggableCodePanel from "@/components/ui/draggablecard";
import {
  ChevronRight,
  RotateCcw,
  ChevronLeft,
  Play,
  Pause,
  Minus,
  Plus,
  GripVertical,
  Code,
} from "lucide-react";

interface SortingControls {
  randomOnly: boolean;
  isOpen: boolean;
  width: number;
  array: number[];
  arraySize: number;
  isAscending: boolean;
  speed: number;
  isPlaying: boolean;
  onArrayChange: (array: number[]) => void;
  onArraySizeChange: (size: number) => void;
  onSortOrderChange: (isAscending: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  showCodePanel?: boolean;
  onToggleCodePanel?: () => void;
  currentLine?: number | number[];
  tabTitles?: string[];
  showPseudoCode?: number;
  pseudoCode?: string[][];
}

const SearchingControls: React.FC<SortingControls> = ({
  randomOnly = false,
  isOpen,
  width,
  array,
  arraySize,
  isAscending,
  speed,
  isPlaying,
  onArrayChange,
  onArraySizeChange,
  onSortOrderChange,
  onSpeedChange,
  onPlay,
  onPause,
  onReset,
  onNextStep,
  onPreviousStep,
  showCodePanel,
  onToggleCodePanel,
  currentLine,
  tabTitles,
  showPseudoCode,
  pseudoCode,
}) => {
  // Sidebar state
  // const [sidebarWidth, setSidebarWidth] = useState(260);
  // const [isOpen, setisOpen] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  // console.log("Panel is open:", isOpen, width);
  // Input width state for resizable array elements input
  const [inputWidth, setInputWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(256);

  // Array input state
  const [inputValue, setInputValue] = useState(array.join(", "));
  const [inputError, setInputError] = useState("");

  // Refs for floating control panel
  const mediaPlayerRef = useRef<HTMLDivElement>(null);
  const floatingPanelRef = useRef<HTMLDivElement>(null);

  // Constants for array size limits
  const minArraySize = 1;
  const maxArraySize = 16;

  // Refs for continuous increment/decrement
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentArraySizeRef = useRef(arraySize);
  const currentArrayRef = useRef(array);

  // Speed continuous change state
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSpeedRef = useRef(speed);

  // Array size handlers
  const handleArraySizeDecrease = () => {
    if (arraySize > minArraySize) {
      const newSize = arraySize - 1;
      onArraySizeChange(newSize);

      if (randomOnly) {
        // Just trim the array, no sorting
        const newArray = array.slice(0, newSize);
        onArrayChange(newArray);
      } else {
        // Sort the array according to isAscending before trimming
        const sortedArray = [...array].sort((a, b) =>
          isAscending ? a - b : b - a
        );

        // Trim the sorted array
        const newArray = sortedArray.slice(0, newSize);

        // Sort again after trimming to maintain order
        const finalArray = [...newArray].sort((a, b) =>
          isAscending ? a - b : b - a
        );

        onArrayChange(finalArray);
      }
    }
  };

  const handleArraySizeIncrease = () => {
    if (arraySize < maxArraySize) {
      const newSize = arraySize + 1;
      onArraySizeChange(newSize);

      if (randomOnly) {
        // Just add a new random element, no sorting
        const newElement = Math.floor(Math.random() * 100) + 1;
        const newArray = [...array, newElement];
        onArrayChange(newArray);
      } else {
        // Sort the array according to isAscending before adding a new element
        const sortedArray = [...array].sort((a, b) =>
          isAscending ? a - b : b - a
        );

        // Add one new random element
        const newElement = Math.floor(Math.random() * 100) + 1;
        const newArray = [...sortedArray, newElement];

        // Sort again after adding the new element
        const finalArray = [...newArray].sort((a, b) =>
          isAscending ? a - b : b - a
        );

        onArrayChange(finalArray);
      }
    }
  };

  // Continuous increment/decrement handlers
  const startContinuousDecrease = () => {
    intervalRef.current = setInterval(() => {
      if (currentArraySizeRef.current > minArraySize) {
        const newSize = currentArraySizeRef.current - 1;
        currentArraySizeRef.current = newSize;
        onArraySizeChange(newSize);

        // Trim the current array
        const newArray = currentArrayRef.current.slice(0, newSize);
        currentArrayRef.current = newArray;
        onArrayChange(newArray);
      } else {
        stopContinuous();
      }
    }, 300);
  };

  const startContinuousIncrease = () => {
    intervalRef.current = setInterval(() => {
      if (currentArraySizeRef.current < maxArraySize) {
        const newSize = currentArraySizeRef.current + 1;
        currentArraySizeRef.current = newSize;
        onArraySizeChange(newSize);

        // Add new random element to current array
        const newArray = [
          ...currentArrayRef.current,
          Math.floor(Math.random() * 100) + 1,
        ];
        currentArrayRef.current = newArray;
        onArrayChange(newArray);
      } else {
        stopContinuous();
      }
    }, 300);
  };

  const stopContinuous = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Speed change handlers
  const handleSpeedDecrease = () => {
    if (speed > 0.25) {
      const newSpeed = Math.max(0.25, speed - 0.5);
      currentSpeedRef.current = newSpeed;
      onSpeedChange(newSpeed);
    }
  };

  const handleSpeedIncrease = () => {
    if (speed < 10) {
      const newSpeed = Math.min(10, (speed==0.25) ? (speed+0.25) :  (speed+ 0.5));
      currentSpeedRef.current = newSpeed;
      onSpeedChange(newSpeed);
    }
  };

  // Continuous speed change handlers
  const startContinuousSpeedDecrease = () => {
    speedIntervalRef.current = setInterval(() => {
      if (currentSpeedRef.current > 0.25) {
        const newSpeed = Math.max(0.25, currentSpeedRef.current - 0.5);
        currentSpeedRef.current = newSpeed;
        onSpeedChange(newSpeed);
      } else {
        stopContinuousSpeed();
      }
    }, 300);
  };

  const startContinuousSpeedIncrease = () => {
    speedIntervalRef.current = setInterval(() => {
      if (currentSpeedRef.current < 10) {
        const newSpeed = Math.min(10, (currentSpeedRef.current==0.25) ? (currentSpeedRef.current+0.25) :  (currentSpeedRef.current+ 0.5));
        currentSpeedRef.current = newSpeed;
        onSpeedChange(newSpeed);
      } else {
        stopContinuousSpeed();
      }
    }, 300);
  };

  const stopContinuousSpeed = () => {
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
  };

  // Sort order change handler
  const handleSortOrderChange = (value: string) => {
    // console.log("som");
    if (value === "asc") {
      onSortOrderChange(true);
    } else if (value === "desc") {
      onSortOrderChange(false);
    }
  };

  // Floating panel animation handlers
  const togglePanel = () => {
    const mediaPlayer = mediaPlayerRef.current;
    const floatingPanel = floatingPanelRef.current;

    if (!mediaPlayer || !floatingPanel) return;

    if (isPanelOpen) {
      // Close panel - slide down
      floatingPanel.style.transform = "translateY(100px)";
    } else {
      // Open panel - slide up
      floatingPanel.style.transform = "translateY(0px)";
    }

    setIsPanelOpen(!isPanelOpen);
  };

  // Input resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(inputWidth);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(150, Math.min(500, startWidth + deltaX)); // Min 150px, Max 500px
    setInputWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Array input handlers - UPDATED VERSION
  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // Remove the array parsing and updating logic - just update the input value
    setInputError(""); // Clear any existing errors while typing
  };

  // NEW function to handle array validation and update
  const validateAndUpdateArray = (value: string) => {
    // Parse the input
    if (value.trim() === "") {
      setInputError("Array cannot be empty");
      return;
    }

    try {
      // Split by comma and clean up
      const elements = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      // Check element count
      if (elements.length < 1) {
        setInputError("Array must have at least 1 element");
        return;
      }

      if (elements.length > 18) {
        setInputError("Array cannot have more than 18 elements");
        return;
      }

      // Validate each element is a valid number
      const numbers: number[] = [];
      for (let i = 0; i < elements.length; i++) {
        const num = parseFloat(elements[i]);
        if (isNaN(num)) {
          setInputError(`"${elements[i]}" is not a valid number`);
          return;
        }
        // Convert to integer if it's a whole number
        numbers.push(Number.isInteger(num) ? parseInt(elements[i]) : num);
      }

      // If all validations pass, update the array
      setInputError("");
      onArrayChange(numbers);
      onArraySizeChange(numbers.length);
    } catch (error) {
      setInputError("Invalid input format");
    }
  };

  // NEW function to handle Enter key press
  const handleArrayInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateAndUpdateArray(inputValue);
    }
  };

  // NEW function to handle blur (focus out)
  const handleArrayInputBlur = () => {
    validateAndUpdateArray(inputValue);
  };

  // Generate random array function
  const generateRandomArray = () => {
    const newArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * 100) + 1
    );
    let finalArray: number[];
    if (randomOnly) {
      finalArray = newArray;
    } else {
      finalArray = [...newArray].sort((a, b) => (isAscending ? a - b : b - a));
    }
    const newArrayString = finalArray.join(", ");
    setInputValue(newArrayString);
    onArrayChange(finalArray);
    setInputError("");
  };

  // Generate random array with duplicates function
  const generateRandomDuplicateArray = () => {
    const length = arraySize;

    // Generate all unique numbers first
    const uniqueNumbers = Array.from(
      { length: length },
      () => Math.floor(Math.random() * 99) + 1
    );

    // Create new array with 60% probability of duplicates
    const newArray = uniqueNumbers.map((num, index) => {
      // 60% chance to replace with a duplicate from previous elements
      if (index > 0 && Math.random() < 0.2) {
        // Pick a random previous element to duplicate
        const randomIndex = Math.floor(Math.random() * index);
        return uniqueNumbers[randomIndex];
      }
      return num;
    });

    let finalArray: number[];
    if (randomOnly) {
      // If randomOnly, do not sort, just use the array with duplicates
      finalArray = newArray;
    } else {
      // Sort the array according to isAscending
      finalArray = [...newArray].sort((a, b) => (isAscending ? a - b : b - a));
    }

    const newArrayString = finalArray.join(", ");
    setInputValue(newArrayString);
    onArrayChange(finalArray);
    setInputError("");
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (speedIntervalRef.current) {
        clearTimeout(speedIntervalRef.current);
        clearInterval(speedIntervalRef.current);
      }
    };
  }, []);

  // Update refs when props change
  useEffect(() => {
    currentArraySizeRef.current = arraySize;
    currentArrayRef.current = array;
    currentSpeedRef.current = speed;
    // Update input value when array prop changes (from other controls)
    setInputValue(array.join(", "));
  }, [arraySize, array, speed]);

  // Handle resize mouse events
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, startX, startWidth, inputWidth]);

  const mediaPlayerStyles = {
    container: isOpen
      ? "flex items-center gap-0 p-1 bg-gradient-to-br from-white to-gray-50 border-3 border-gray-300 rounded-2xl hover:border-gray-700 transition-all duration-300"
      : "flex items-center gap-1 p-1 bg-gradient-to-br from-white to-gray-50 border-3 border-gray-300 rounded-2xl hover:border-gray-700 transition-all duration-300",

    button: isOpen ? "h-10 w-11" : "h-10 w-12",

    icon: {
      width: isOpen ? "18px" : "18px",
      height: isOpen ? "18px" : "18px",
    },
  };

  // Define responsive styles at the top of your component
  const controlPanelStyles = {
    container: isOpen
      ? "flex items-center justify-between gap-4 p-4 bg-background border-t min-w-0"
      : "flex items-center justify-between gap-4 p-3.5 bg-background border-t min-w-0", // Keep same padding and gap

    leftSection: isOpen ? "flex items-center gap-2" : "flex items-center gap-2", // Keep same gap

    controlGroup: isOpen
      ? "flex flex-col items-center gap-2"
      : "flex flex-col items-center gap-2", // Keep same gap

    buttonGroup: isOpen ? "flex items-center gap-3" : "flex items-center gap-3", // Keep same gap

    arraySizeButtonGroup: isOpen
      ? "flex items-center gap-1"
      : "flex items-center gap-3", // Keep same gap

    controlButton: isOpen
      ? "h-8 w-8 hover:bg-muted p-0"
      : "h-9 w-8 hover:bg-muted p-0", // Keep same button size

    plusButton: isOpen ? "h-8 w-6 hover:bg-muted" : "h-9 w-6 hover:bg-muted", // Keep same button size

    actionButton: isOpen
      ? "h-8 w-16 px-3 text-xs bg-transparent"
      : "h-9 w-20 px-3 text-xs bg-transparent", // Keep same button size

    label: isOpen
      ? "text-xs text-muted-foreground font-medium"
      : "text-xs text-muted-foreground font-medium", // Keep same text size

    input: isOpen ? "h-8 text-sm pr-8" : "h-9 text-sm pr-8", // Keep same input size

    resizeHandle: isOpen
      ? "absolute right-0 top-0 h-full w-8 cursor-ew-resize hover:bg-blue-100 bg-transparent rounded-r flex items-center justify-center z-20 border-l border-gray-200"
      : "absolute right-0 top-0 h-full w-8 cursor-ew-resize hover:bg-blue-100 bg-transparent rounded-r flex items-center justify-center z-20 border-l border-gray-200", // Keep same handle size

    icon: isOpen ? "h-4 w-4" : "h-5 w-5", // Only icons get bigger

    smallIcon: isOpen
      ? "h-3 w-3 text-gray-400 hover:text-gray-600"
      : "h-4 w-4 text-gray-400 hover:text-gray-600", // Only small icons get bigger

    // Right section styles
    rightSection: isOpen
      ? "flex items-center gap-1 min-w-0 relative"
      : "flex items-center gap-2 min-w-0 relative",

    rightControlGroup: isOpen
      ? "flex flex-col items-center gap-1 "
      : "flex flex-col items-center gap-2",

    rightButtonGroup: isOpen
      ? "flex items-center gap-4"
      : "flex items-center gap-2",

    speedButtonGroup: isOpen
      ? "flex items-center gap-3"
      : "flex items-center gap-2",

    speedSection: isOpen
      ? "flex flex-col items-center gap-2 absolute right-78" // Position from right edge
      : "flex flex-col items-center gap-2 absolute right-91",

    speedButton: isOpen ? "h-8 w-7 hover:bg-muted" : "h-9 w-14 hover:bg-muted",

    speedPlusButton: isOpen
      ? "h-8 w-5 hover:bg-muted"
      : "h-9 w-8 hover:bg-muted",

    speedDisplay: isOpen
      ? "min-w-[1.5rem] text-center font-medium text-s"
      : "min-w-[2rem] text-center font-medium text-l",

    sortButtonGroup: isOpen
      ? "flex items-center gap-3"
      : "flex items-center gap-4",

    sortOrderContainer: isOpen
      ? "flex flex-col gap-2 absolute right-2"
      : "flex flex-col gap-2 absolute right-3",

    sortLabel: isOpen
      ? "text-xs text-muted-foreground font-medium ml-5"
      : "text-xs text-muted-foreground font-medium ml-10",

    tabsList: isOpen
      ? "grid w-26 grid-cols-2 h-8 text-gray-900 "
      : "grid w-32 grid-cols-2 h-9 text-gray-900 ",

    AscDescLabel: isOpen ? "text-xs " : "text-s ",

    codeButton: isOpen
      ? "w-20 px-2 h-8 text-xs bg-transparent"
      : "w-22 h-9 px-3 text-s bg-transparent",
  };

  return (
    <div className="flex bg-gray-50">
      <div
        ref={mediaPlayerRef}
        className="fixed left-1/2 bottom-8.5 -translate-x-1/2 -translate-y-1 z-100 w-auto inline-flex"
        style={{
          left: isOpen ? `calc(${width / 2}px + 50%)` : "50%",
          zIndex: 1000,
        }}
      >
        <div className="flex items-center justify-center">
          <div className={mediaPlayerStyles.container}>
            <Button
              onClick={togglePanel}
              size="icon"
              className={`${mediaPlayerStyles.button} bg-white hover:bg-muted text-gray-700 transition-all duration-200 `}
              aria-label={isPanelOpen ? "Close settings" : "Open settings"}
            >
              <Settings
                style={mediaPlayerStyles.icon}
                className={`transition-transform duration-300 ${
                  isPanelOpen ? "rotate-90" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousStep}
              className={`${mediaPlayerStyles.button}   hover:bg-muted disabled:opacity-50`}
              aria-label="Previous step"
            >
              <ChevronLeft style={mediaPlayerStyles.icon} className="" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? onPause : onPlay}
              className={`${mediaPlayerStyles.button} hover:bg-muted`}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause style={mediaPlayerStyles.icon} />
              ) : (
                <Play style={mediaPlayerStyles.icon} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextStep}
              className={`${mediaPlayerStyles.button} hover:bg-muted disabled:opacity-50`}
              aria-label="Next step"
            >
              <ChevronRight style={mediaPlayerStyles.icon} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className={`${mediaPlayerStyles.button} hover:bg-muted`}
              aria-label="Reset"
            >
              <RotateCcw style={mediaPlayerStyles.icon} />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Control Panel Container - Outside sidebar, positioned relative to main content */}
      <div
        ref={floatingPanelRef}
        className="fixed bottom-5 z-40 bg-background border-2 rounded-m"
        style={{
          left: `${isOpen ? width + 20 : 20}px`,
          right: "20px",
        }}
      >
        {/* Control Panel Content */}
        <div className={controlPanelStyles.container}>
          {/* Left Section: Array Controls */}
          <div className={controlPanelStyles.leftSection}>
            {/* Array Size Controls */}
            <div className={controlPanelStyles.controlGroup}>
              <span className={controlPanelStyles.label}>Array Size</span>
              <div className={controlPanelStyles.arraySizeButtonGroup}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArraySizeDecrease}
                  onMouseDown={startContinuousDecrease}
                  onMouseUp={stopContinuous}
                  onMouseLeave={stopContinuous}
                  className={controlPanelStyles.plusButton}
                  style={{ padding: 0 }} // ← Add this
                  disabled={arraySize <= minArraySize}
                >
                  <Minus className={controlPanelStyles.icon} />
                </Button>
                <span className="min-w-[2rem] text-center font-medium">
                  {arraySize}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArraySizeIncrease}
                  onMouseDown={startContinuousIncrease}
                  onMouseUp={stopContinuous}
                  onMouseLeave={stopContinuous}
                  className={controlPanelStyles.plusButton}
                  style={{ padding: 0 }} // ← Add this
                  disabled={arraySize >= maxArraySize}
                >
                  <Plus className={controlPanelStyles.icon} />
                </Button>
              </div>
            </div>

            {/* Array Elements Input */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <span className={controlPanelStyles.label}>Array Elements</span>
                {inputError && (
                  <span className="text-xs text-red-500 font-medium">
                    {inputError}
                  </span>
                )}
              </div>
              <div className={controlPanelStyles.buttonGroup}>
                <div className="relative flex items-center">
                  <Input
                    value={inputValue}
                    onChange={handleArrayInputChange}
                    onKeyDown={handleArrayInputKeyDown}
                    onBlur={handleArrayInputBlur}
                    placeholder="45, 85, 95, 60, 75, 25, 35"
                    className={`${controlPanelStyles.input} ${
                      inputError ? "border-red-300 focus:border-red-500" : ""
                    }`}
                    style={{
                      width: isOpen
                        ? `${inputWidth * 0.55}px` // 80% of inputWidth when sidebar open
                        : `${inputWidth * 0.7}px`, // Full inputWidth when sidebar closed
                    }}
                  />
                  <div
                    className={controlPanelStyles.resizeHandle}
                    title="Drag to resize input width"
                    onMouseDown={handleResizeMouseDown}
                    style={{ pointerEvents: "all" }}
                  >
                    <GripVertical className={controlPanelStyles.smallIcon} />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={controlPanelStyles.actionButton}
                  onClick={generateRandomArray}
                >
                  Random
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={controlPanelStyles.actionButton}
                  title="Duplicate current array"
                  onClick={generateRandomDuplicateArray}
                >
                  Duplicate
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section: Speed and Sort Controls */}
          <div className={controlPanelStyles.rightSection}>
            {/* Speed Controls */}
            <div className={controlPanelStyles.speedSection}>
              <span className={controlPanelStyles.label}>Speed</span>
              <div className={controlPanelStyles.speedButtonGroup}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={controlPanelStyles.speedPlusButton}
                  style={{ padding: 0 }} // ← Add this
                  disabled={speed <= 0.25}
                  onClick={handleSpeedDecrease}
                  onMouseDown={startContinuousSpeedDecrease}
                  onMouseUp={stopContinuousSpeed}
                  onMouseLeave={stopContinuousSpeed}
                >
                  <Minus className={controlPanelStyles.icon} />
                </Button>
                <span className={controlPanelStyles.speedDisplay}>{speed}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={controlPanelStyles.speedPlusButton}
                  style={{ padding: 0 }} // ← Add this
                  disabled={speed >= 10}
                  onClick={handleSpeedIncrease}
                  onMouseDown={startContinuousSpeedIncrease}
                  onMouseUp={stopContinuousSpeed}
                  onMouseLeave={stopContinuousSpeed}
                >
                  <Plus className={controlPanelStyles.icon} />
                </Button>
              </div>
            </div>

            {/* Sort Order Controls */}
            <div className={controlPanelStyles.sortOrderContainer}>
              <span className={controlPanelStyles.sortLabel}>Sort Order</span>
              <div className={controlPanelStyles.sortButtonGroup}>
                <Tabs
                  value={isAscending ? "asc" : "desc"}
                  onValueChange={handleSortOrderChange}
                >
                  <TabsList className={controlPanelStyles.tabsList}>
                    <TabsTrigger
                      value="asc"
                      className={controlPanelStyles.AscDescLabel}
                      // style={{ zIndex: 100 }}
                    >
                      Asc
                    </TabsTrigger>
                    <TabsTrigger
                      value="desc"
                      className={controlPanelStyles.AscDescLabel}
                      // style={{ zIndex: 100 }}
                    >
                      Desc
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${controlPanelStyles.codeButton} text-s`}
                  onClick={onToggleCodePanel} // Add this onClick handler
                >
                  {/* <Code className={`${controlPanelStyles.icon} mr-1`} /> */}
                  Complexity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${controlPanelStyles.codeButton} text-s`}
                  onClick={onToggleCodePanel}
                >

                  <Code className={`${controlPanelStyles.icon} mr-1`} />
                  Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCodePanel && (
        <DraggableCodePanel
          pseudoCode={pseudoCode}
          showPseudoCode={showPseudoCode}
          tabTitles={tabTitles}
          showCode={showCodePanel}
          currentLine={currentLine} // You'll need to track this
        />
      )}
    </div>
  );
};

export default SearchingControls;
