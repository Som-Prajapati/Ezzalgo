"use client"
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  ChevronLeft,
  Play,
  Pause,
  Minus,
  Plus,
  GripVertical,
  ChevronRight,
  GripHorizontal,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, User } from "lucide-react";

// At the top of your component or in a separate fonts file
import { Abril_Fatface } from "next/font/google";
import SideBar from "./SideBar";

// Import sorting algorithm components
import BubbleSort from "../sorting/BubbleSort";
import SelectionSort from "../sorting/SelectionSort";
import InsertionSort from "../sorting/InsertionSort";

const michroma = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const pseudoCode = [
  "function selectionSort(arr)",
  "for i = 0 to arr.length - 1",
  "minIndex = i",
  "for j = i + 1 to arr.length",
  "if arr[j] < arr[minIndex]",
  "minIndex = j",
  "swap arr[i] and arr[minIndex]",
  "return arr",
];

export default function SortingVisualizerApp() {
  // Algorithm selection state
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'bubble' | 'selection' | 'insertion'>('selection');

  // Pseudocode panel state
  const [showPseudocode, setShowPseudocode] = useState(false);
  const [pseudocodePosition, setPseudocodePosition] = useState({
    x: 100,
    y: 100,
  });
  const [isDraggingPseudo, setIsDraggingPseudo] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Control panel state - updated to match Control.tsx interface
  const [array, setArray] = useState([45, 85, 95, 60, 75, 25, 35]);
  const [arraySize, setArraySize] = useState(7);
  const [arrayElements, setArrayElements] = useState(
    "45, 85, 95, 60, 75, 25, 35"
  );
  const [speed, setSpeed] = useState(0.5);
  const [isAscending, setIsAscending] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(4); // Current line in pseudocode
  const [currentCodeLine, setCurrentCodeLine] = useState(3); // 0-indexed, line 4 highlighted

  // Function refs that child components can populate
  const playFunction = useRef<(() => void) | null>(null);
  const pauseFunction = useRef<(() => void) | null>(null);
  const resetFunction = useRef<(() => void) | null>(null);
  const nextStepFunction = useRef<(() => void) | null>(null);
  const previousStepFunction = useRef<(() => void) | null>(null);

  // Control layout specific state
  const [inputWidth, setInputWidth] = useState(220); // Responsive default width
  const [isResizingInput, setIsResizingInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Visualization data
  const maxValue = Math.max(...array);

  // Registration Functions for child components
  const registerPlayFunction = (fn: () => void) => {
    playFunction.current = fn;
  };

  const registerPauseFunction = (fn: () => void) => {
    pauseFunction.current = fn;
  };

  const registerResetFunction = (fn: () => void) => {
    resetFunction.current = fn;
  };

  const registerNextStepFunction = (fn: () => void) => {
    nextStepFunction.current = fn;
  };

  const registerPreviousStepFunction = (fn: () => void) => {
    previousStepFunction.current = fn;
  };

  // Algorithm selection handler
  const handleAlgorithmChange = (algorithm: 'bubble' | 'selection' | 'insertion') => {
    setSelectedAlgorithm(algorithm);
    setIsPlaying(false);
    
    // Reset any ongoing animations before clearing functions
    if (resetFunction.current) {
      resetFunction.current();
    }
    
    // Clear all registered functions after resetting
    playFunction.current = null;
    pauseFunction.current = null;
    resetFunction.current = null;
    nextStepFunction.current = null;
    previousStepFunction.current = null;
  };

  // Control handlers - updated to work with sorting components
  const handleArrayChange = (newArray: number[]) => {
    setArray(newArray);
    setArrayElements(newArray.join(", "));
    setArraySize(newArray.length);
    setIsPlaying(false);
  };

  const generateRandomDuplicateArray = () => {
    const length = arraySize;
    const uniqueCount = Math.max(2, Math.floor(length * 0.6));
    const duplicateCount = length - uniqueCount;

    const uniqueNumbers = Array.from(
      { length: uniqueCount },
      () => Math.floor(Math.random() * 50) + 1
    );

    const duplicates = Array.from(
      { length: duplicateCount },
      () => uniqueNumbers[Math.floor(Math.random() * uniqueNumbers.length)]
    );

    const newArray = [...uniqueNumbers, ...duplicates].sort(
      () => Math.random() - 0.5
    );

    handleArrayChange(newArray);
  };

  const handleArraySizeChange = (newSize: number) => {
    if (newSize < 3) newSize = 3;
    if (newSize > 16) newSize = 16;
    
    let newArray = [...array];
    if (newArray.length > newSize) {
      newArray = newArray.slice(0, newSize);
    } else {
      while (newArray.length < newSize) {
        newArray.push(Math.floor(Math.random() * 100) + 1);
      }
    }
    
    setArraySize(newSize);
    handleArrayChange(newArray);
  };

  const handleSortOrderChange = (ascending: boolean) => {
    setIsAscending(ascending);
  };

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (playFunction.current) {
        playFunction.current();
      }
    } else {
      handlePause();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (pauseFunction.current) {
      pauseFunction.current();
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleSpeedDecrease = () => {
    if (speed > 0.25) {
      const newSpeed = speed === 1 ? 0.5 : speed === 0.5 ? 0.25 : speed - 0.5;
      setSpeed(newSpeed);
    }
  };

  const handleSpeedIncrease = () => {
    if (speed < 4) {
      const newSpeed = speed === 0.25 ? 0.5 : speed === 0.5 ? 1 : speed + 0.5;
      setSpeed(newSpeed);
    }
  };

  const handleArrayElementsChange = (elements: string) => {
    setArrayElements(elements);
    // Parse the elements and update array
    try {
      const numbers = elements
        .split(",")
        .map((str) => parseInt(str.trim()))
        .filter((num) => !isNaN(num) && num >= 1 && num <= 100);
      
      if (numbers.length > 0) {
        handleArrayChange(numbers);
      }
    } catch (error) {
      // Handle parsing error
      console.error("Error parsing array elements:", error);
    }
  };

  // Control handlers
  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setCurrentCodeLine(0);
    if (resetFunction.current) {
      resetFunction.current();
    }
  };

  const handlePrevStep = () => {
    if (previousStepFunction.current) {
      previousStepFunction.current();
    }
  };

  const handleNextStep = () => {
    if (nextStepFunction.current) {
      nextStepFunction.current();
    }
  };

  const handleCodeToggle = () => {
    setShowCode(!showCode);
    setShowPseudocode(!showPseudocode);
  };

  // Control layout specific handlers
  const startContinuousChange = useCallback((increment: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setArraySize((prevSize) => {
          if (increment) {
            return Math.min(16, prevSize + 1);
          } else {
            return Math.max(3, prevSize - 1);
          }
        });
      }, 100);
    }, 300);
  }, []);

  const stopContinuousChange = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleInputMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsResizingInput(true);
      startXRef.current = e.clientX;
      startWidthRef.current = inputWidth;
      e.preventDefault();
    },
    [inputWidth]
  );

  const handleInputMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizingInput) return;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(
        180,
        Math.min(300, startWidthRef.current + deltaX)
      );
      setInputWidth(newWidth);
    },
    [isResizingInput]
  );

  const handleInputMouseUp = useCallback(() => {
    setIsResizingInput(false);
  }, []);

  // Pseudocode dragging handlers
  const handlePseudoMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPseudo(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePseudoMouseMove = (e: MouseEvent) => {
    if (!isDraggingPseudo) return;
    setPseudocodePosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handlePseudoMouseUp = () => {
    setIsDraggingPseudo(false);
  };

  // Pseudocode dragging listeners
  useEffect(() => {
    if (isDraggingPseudo) {
      document.addEventListener("mousemove", handlePseudoMouseMove);
      document.addEventListener("mouseup", handlePseudoMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handlePseudoMouseMove);
      document.removeEventListener("mouseup", handlePseudoMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handlePseudoMouseMove);
      document.removeEventListener("mouseup", handlePseudoMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingPseudo, dragOffset]);

  // Input resize listeners
  useEffect(() => {
    if (isResizingInput) {
      document.addEventListener("mousemove", handleInputMouseMove);
      document.addEventListener("mouseup", handleInputMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleInputMouseMove);
      document.removeEventListener("mouseup", handleInputMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleInputMouseMove);
      document.removeEventListener("mouseup", handleInputMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingInput, handleInputMouseMove, handleInputMouseUp]);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar Component */}
      <SideBar
        isOpen={isSidebarOpen}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        onToggle={handleSidebarToggle}
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={handleAlgorithmChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-8 relative">
          <div className="flex items-center gap-4"></div>
          {/* Center - Dynamic Algorithm title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <span
              className={`text-xl font-extrabold text-gray-900 ${michroma.className}`}
            >
              {selectedAlgorithm === 'selection' && 'Selection Sort'}
              {selectedAlgorithm === 'bubble' && 'Bubble Sort'}
              {selectedAlgorithm === 'insertion' && 'Insertion Sort'}
            </span>
          </div>
          {/* Right side - buttons and user avatar */}
          <div className="flex items-center gap-4">
            <button className="relative inline-flex h-9 w-28 rounded-lg overflow-hidden p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8B5CF6_0%,#F59E0B_50%,#EF4444_75%,#8B5CF6_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer rounded-lg items-center justify-center bg-white px-3 py-1 text-sm font-medium text-black backdrop-blur-3xl hover:bg-zinc-100">
                Beast Mode
              </span>
            </button>
            <div className="underline flex justify-end items-center gap-1">
              <span>Arjun</span>
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Visualization Area */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          {/* Dynamic Sorting Component */}
          <div className="flex-1 w-full flex items-center justify-center">
            {selectedAlgorithm === 'selection' && (
              <SelectionSort
                array={array}
                speed={speed}
                isAscending={isAscending}
                isPlaying={isPlaying}
                registerPlayFunction={registerPlayFunction}
                registerPauseFunction={registerPauseFunction}
                registerResetFunction={registerResetFunction}
                registerNextStepFunction={registerNextStepFunction}
                registerPreviousStepFunction={registerPreviousStepFunction}
              />
            )}
            {selectedAlgorithm === 'bubble' && (
              <BubbleSort
                array={array}
                speed={speed}
                isAscending={isAscending}
                isPlaying={isPlaying}
                registerPlayFunction={registerPlayFunction}
                registerPauseFunction={registerPauseFunction}
                registerResetFunction={registerResetFunction}
                registerNextStepFunction={registerNextStepFunction}
                registerPreviousStepFunction={registerPreviousStepFunction}
              />
            )}
            {selectedAlgorithm === 'insertion' && (
              <InsertionSort
                array={array}
                speed={speed}
                isAscending={isAscending}
                isPlaying={isPlaying}
                registerPlayFunction={registerPlayFunction}
                registerPauseFunction={registerPauseFunction}
                registerResetFunction={registerResetFunction}
                registerNextStepFunction={registerNextStepFunction}
                registerPreviousStepFunction={registerPreviousStepFunction}
              />
            )}
          </div>
        </div>

        {/* Control Panel - Responsive */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 p-4 bg-background border-t min-w-0 overflow-x-auto">
          {/* Left Section: Array Controls - Responsive */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 min-w-0 flex-shrink-0">
            {/* Array Size Controls */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Array Size
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArraySizeChange(arraySize - 1)}
                  onMouseDown={() => startContinuousChange(false)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  className="h-8 w-8 hover:bg-muted"
                  disabled={arraySize <= 3}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center font-bold text-lg">
                  {arraySize}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArraySizeChange(arraySize + 1)}
                  onMouseDown={() => startContinuousChange(true)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  className="h-8 w-8 hover:bg-muted"
                  disabled={arraySize >= 16}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Array Elements Input - Flexible Width */}
            <div className="flex flex-col items-start gap-1 min-w-0">
              <span className="text-xs text-muted-foreground font-medium">
                Array Elements
              </span>
              <div className="flex items-center gap-2" ref={resizeRef}>
                <div className="relative flex items-center min-w-0">
                  <Input
                    value={arrayElements}
                    onChange={(e) => handleArrayElementsChange(e.target.value)}
                    placeholder="45, 85, 95, 60, 75, 25, 35"
                    className="h-8 text-sm pr-6 min-w-[200px] max-w-[300px]"
                    style={{ width: `${Math.min(inputWidth, 300)}px` }}
                  />
                  {/* Resize Handle */}
                  <div
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 cursor-ew-resize hover:bg-muted rounded p-1 transition-colors"
                    onMouseDown={handleInputMouseDown}
                    title="Drag to resize input width"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Generate Buttons - Compact */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newArray = Array.from(
                        { length: arraySize },
                        () => Math.floor(Math.random() * 100) + 1
                      );
                      handleArrayChange(newArray);
                    }}
                    className="h-8 px-2 text-xs bg-transparent"
                    title="Generate random array"
                  >
                    Random
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateRandomDuplicateArray}
                    className="h-8 px-2 text-xs bg-transparent"
                    title="Generate array with duplicates"
                  >
                    Dup
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section: Animation Controls - Compact */}
          <div className="flex items-center justify-center flex-shrink-0 px-4">
            <div className="flex items-center gap-1 p-2 border rounded-lg bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 w-8 hover:bg-muted"
                aria-label="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevStep}
                disabled={currentStep <= 0}
                className="h-8 w-8 hover:bg-muted disabled:opacity-50"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlay}
                className="h-8 w-12 hover:bg-muted"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextStep}
                disabled={currentStep >= 10}
                className="h-8 w-8 hover:bg-muted disabled:opacity-50"
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Section: Speed and Sort Controls - Compact */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Speed Controls */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Speed
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeedDecrease}
                  className="h-8 w-8 hover:bg-muted"
                  disabled={speed <= 0.25}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-[2.5rem] text-center font-medium text-sm">
                  {speed}x
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeedIncrease}
                  className="h-8 w-8 hover:bg-muted"
                  disabled={speed >= 4}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Sort Order Controls - Compact */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Sort Order
              </span>
              <div className="flex items-center gap-2">
                {/* Compact Tabs for Asc/Desc */}
                <Tabs
                  value={isAscending ? "asc" : "desc"}
                  onValueChange={(value) =>
                    handleSortOrderChange(value === "asc")
                  }
                >
                  <TabsList className="grid w-20 grid-cols-2 h-8">
                    <TabsTrigger value="asc" className="text-xs px-1">Asc</TabsTrigger>
                    <TabsTrigger value="desc" className="text-xs px-1">Desc</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Code Button */}
                <Button
                  variant={showCode ? "default" : "outline"}
                  size="sm"
                  onClick={handleCodeToggle}
                  className="h-8 w-16 px-2 text-xs"
                >
                  Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Draggable Pseudocode Panel */}
      {showPseudocode && (
        <div
          className="fixed bg-white border border-gray-300 rounded-xl shadow-2xl z-50 min-w-[400px]"
          style={{
            left: `${pseudocodePosition.x}px`,
            top: `${pseudocodePosition.y}px`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing bg-orange-50 rounded-t-xl"
            onMouseDown={handlePseudoMouseDown}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                <GripHorizontal className="h-3 w-3 text-white" />
              </div>
              <span className="font-semibold text-gray-800">
                Selection Sort
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowPseudocode(false);
                setShowCode(false);
              }}
              className="h-6 w-6 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Pseudocode Content */}
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-3 font-medium">
              Pseudocode
            </div>
            <div className="space-y-1 font-mono text-sm">
              {pseudoCode.map((line, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 py-1 px-2 rounded transition-colors ${
                    index === currentCodeLine
                      ? "bg-orange-100 border-l-4 border-orange-500 text-orange-800 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-gray-400 w-4 text-right">
                    {index + 1}
                  </span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40">
        <button className="relative inline-flex h-28 w-10 rounded-sm overflow-hidden p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8B5CF6_0%,#F59E0B_50%,#EF4444_75%,#8B5CF6_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center bg-zinc-900 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            AI
          </span>
        </button>
      </div>
    </div>
  );
}
