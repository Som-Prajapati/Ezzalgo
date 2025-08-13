"use client";
import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import {
  ChevronRight,
  RotateCcw,
  ChevronLeft,
  Play,
  Pause,
  Minus,
  Plus,
  GripVertical,
  Copy,
  Code,
} from "lucide-react";

interface SortingControls {
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
}

const SortingControls: React.FC<SortingControls> = ({
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
}) => {
  // Sidebar state
  // const [sidebarWidth, setSidebarWidth] = useState(260);
  // const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  console.log("Panel is open:", isOpen,width);
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
  const maxArraySize = 18;

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

      // Trim the existing array instead of generating new random array
      const newArray = array.slice(0, newSize);
      onArrayChange(newArray);
    }
  };

  const handleArraySizeIncrease = () => {
    if (arraySize < maxArraySize) {
      const newSize = arraySize + 1;
      onArraySizeChange(newSize);

      // Add one new random element to existing array
      const newArray = [...array, Math.floor(Math.random() * 100) + 1];
      onArrayChange(newArray);
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
    if (speed > 0.5) {
      const newSpeed = Math.max(0.5, speed - 0.5);
      currentSpeedRef.current = newSpeed;
      onSpeedChange(newSpeed);
    }
  };

  const handleSpeedIncrease = () => {
    if (speed < 10) {
      const newSpeed = Math.min(10, speed + 0.5);
      currentSpeedRef.current = newSpeed;
      onSpeedChange(newSpeed);
    }
  };

  // Continuous speed change handlers
  const startContinuousSpeedDecrease = () => {
    speedIntervalRef.current = setInterval(() => {
      if (currentSpeedRef.current > 0.5) {
        const newSpeed = Math.max(0.5, currentSpeedRef.current - 0.5);
        currentSpeedRef.current = newSpeed;
        onSpeedChange(newSpeed);
      } else {
        stopContinuousSpeed();
      }
    }, 200);
  };

  const startContinuousSpeedIncrease = () => {
    speedIntervalRef.current = setInterval(() => {
      if (currentSpeedRef.current < 10) {
        const newSpeed = Math.min(10, currentSpeedRef.current + 0.5);
        currentSpeedRef.current = newSpeed;
        onSpeedChange(newSpeed);
      } else {
        stopContinuousSpeed();
      }
    }, 200);
  };

  const stopContinuousSpeed = () => {
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
  };

  // Sort order change handler
  const handleSortOrderChange = (value: string) => {
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
    const newArrayString = newArray.join(", ");
    setInputValue(newArrayString);
    onArrayChange(newArray);
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

    const newArrayString = newArray.join(", ");
    setInputValue(newArrayString);
    onArrayChange(newArray);
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

  return (
    <div className="h-screen flex bg-gray-50">
      <div
        ref={mediaPlayerRef}
        className="fixed left-1/2 bottom-6 -translate-x-1/2 -translate-y-1 z-100 w-auto inline-flex"
        style={{
          left: isOpen ? `calc(${width / 2}px + 50%)` : "50%",
          zIndex: 1000,
        }}
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-0 p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all duration-300">
            <Button
              onClick={togglePanel}
              size="icon"
              className="h-10 w-11 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 hover:scale-105"
              aria-label={isPanelOpen ? "Close settings" : "Open settings"}
            >
              <Settings
                className={`h-5 w-5 transition-transform duration-300 ${
                  isPanelOpen ? "rotate-90" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousStep}
              className="h-10 w-11   hover:bg-muted disabled:opacity-50"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? onPause : onPlay}
              className="h-10 w-11 hover:bg-muted"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextStep}
              className="h-10 w-11 hover:bg-muted disabled:opacity-50"
              aria-label="Next step"
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 w-10 hover:bg-muted"
              aria-label="Reset"
            >
              <RotateCcw className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Control Panel Container - Outside sidebar, positioned relative to main content */}
      <div
        ref={floatingPanelRef}
        className="fixed bottom-5 z-40 bg-background border rounded-xl"
        style={{
          left: `${isOpen ? width + 20 : 20}px`,
          right: "20px",
        }}
      >
        {/* Control Panel Content */}
        <div className="flex items-center justify-between gap-4 p-4 bg-background border-t min-w-0">
          {/* Left Section: Array Controls */}
          <div className="flex items-center gap-2">
            {/* Array Size Controls */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Array Size
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArraySizeDecrease}
                  onMouseDown={startContinuousDecrease}
                  onMouseUp={stopContinuous}
                  onMouseLeave={stopContinuous}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={arraySize <= minArraySize}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center font-bold text-xl">
                  {arraySize}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArraySizeIncrease}
                  onMouseDown={startContinuousIncrease}
                  onMouseUp={stopContinuous}
                  onMouseLeave={stopContinuous}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={arraySize >= maxArraySize}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Array Elements Input */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Array Elements
                </span>
                {inputError && (
                  <span className="text-xs text-red-500 font-medium">
                    {inputError}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Input
                    value={inputValue}
                    onChange={handleArrayInputChange}
                    onKeyDown={handleArrayInputKeyDown}
                    onBlur={handleArrayInputBlur}
                    placeholder="45, 85, 95, 60, 75, 25, 35"
                    className={`h-8 text-sm pr-8 ${
                      inputError ? "border-red-300 focus:border-red-500" : ""
                    }`}
                    style={{ width: `${inputWidth}px` }}
                  />
                  <div
                    className="absolute right-0 top-0 h-full w-8 cursor-ew-resize hover:bg-blue-100 bg-transparent rounded-r flex items-center justify-center z-20 border-l border-gray-200"
                    title="Drag to resize input width"
                    onMouseDown={handleResizeMouseDown}
                    style={{ pointerEvents: "all" }}
                  >
                    <GripVertical className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-20 px-3 text-xs bg-transparent"
                  onClick={generateRandomArray}
                >
                  Random
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-20 px-3 text-xs bg-transparent"
                  title="Duplicate current array"
                  onClick={generateRandomDuplicateArray}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section: Speed and Sort Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Speed Controls - Placeholder for now */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Speed
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 hover:bg-muted"
                  disabled={speed <= 0.5}
                  onClick={handleSpeedDecrease}
                  onMouseDown={startContinuousSpeedDecrease}
                  onMouseUp={stopContinuousSpeed}
                  onMouseLeave={stopContinuousSpeed}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center font-medium">
                  {speed}x
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-6 hover:bg-muted"
                  disabled={speed >= 10}
                  onClick={handleSpeedIncrease}
                  onMouseDown={startContinuousSpeedIncrease}
                  onMouseUp={stopContinuousSpeed}
                  onMouseLeave={stopContinuousSpeed}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sort Order Controls - Placeholder for now */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Sort Order
              </span>
              <div className="flex items-center gap-2">
                <Tabs
                  value={isAscending ? "asc" : "desc"}
                  onValueChange={handleSortOrderChange}
                >
                  <TabsList className="grid w-30 grid-cols-2">
                    <TabsTrigger value="asc" className="text-xs">
                      Asc
                    </TabsTrigger>
                    <TabsTrigger value="desc" className="text-xs">
                      Desc
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" className="w-18 px-4">
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortingControls;
