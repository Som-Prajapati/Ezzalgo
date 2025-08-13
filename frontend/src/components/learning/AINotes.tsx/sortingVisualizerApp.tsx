"use client";
import React from "react";
import { useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ChevronRight,
  ChevronDown,
  User,
  X,
  GripHorizontal,
  RotateCcw,
  ChevronLeft,
  Play,
  Pause,
  Minus,
  Plus,
  GripVertical,
  Menu,
} from "lucide-react";
import { BarChart3, Binary, GitBranch, List } from "lucide-react";
import SideContent from "./SideContent";

// At the top of your component or in a separate fonts file
import { Abril_Fatface } from "next/font/google";
import BubbleSort from "../sorting/BubbleSort";

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
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'bubble' | 'selection' | 'insertion'>('selection');

  // Control layout specific state
  const [inputWidth, setInputWidth] = useState(256);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Pseudocode panel state
  const [showPseudocode, setShowPseudocode] = useState(false);
  const [pseudocodePosition, setPseudocodePosition] = useState({
    x: 100,
    y: 100,
  });
  const [isDraggingPseudo, setIsDraggingPseudo] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Control panel state
  const [arraySize, setArraySize] = useState(15);
  const [arrayElements, setArrayElements] = useState(
    "45, 85, 95, 60, 75, 25, 35"
  );
  const [speed, setSpeed] = useState(0.5);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showCode, setShowCode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(4); // Current line in pseudocode
  const [currentCodeLine, setCurrentCodeLine] = useState(3); // 0-indexed, line 4 highlighted



  // Visualization data
  const arrayValues = [45, 85, 95, 60, 75, 25, 35];
  const maxValue = Math.max(...arrayValues);

  // Sidebar handlers
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAlgorithmChange = (algorithm: 'bubble' | 'selection' | 'insertion') => {
    setSelectedAlgorithm(algorithm);
  };

  // Control handlers
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

  const handleSortOrderChange = (order: "asc" | "desc") => {
    setSortOrder(order);
  };

  const handleCodeToggle = () => {
    setShowCode(!showCode);
    setShowPseudocode(!showPseudocode);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setCurrentCodeLine(0);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCurrentCodeLine(Math.max(0, currentCodeLine - 1));
    }
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextStep = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
      setCurrentCodeLine(Math.min(pseudoCode.length - 1, currentCodeLine + 1));
    }
  };

  const handleArraySizeChange = (size: number | ((prev: number) => number)) => {
    if (typeof size === "function") {
      setArraySize(size);
    } else {
      setArraySize(size);
    }
  };

  const handleArrayElementsChange = (elements: string) => {
    setArrayElements(elements);
  };

  // Control layout specific handlers
  const startContinuousChange = useCallback((increment: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setArraySize((prevSize) => {
          if (increment) {
            return Math.min(50, prevSize + 1);
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

  const handleArraySizeDecrease = useCallback(() => {
    setArraySize((prevSize) => Math.max(3, prevSize - 1));
  }, []);

  const handleArraySizeIncrease = useCallback(() => {
    setArraySize((prevSize) => Math.min(50, prevSize + 1));
  }, []);

  const generateRandomArray = useCallback(() => {
    const randomArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * 100) + 1
    );
    setArrayElements(randomArray.join(", "));
  }, [arraySize]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const filteredValue = value.replace(/[^0-9,\s]/g, "");
      setArrayElements(filteredValue);
    },
    []
  );

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
        150,
        Math.min(400, startWidthRef.current + deltaX)
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


  // // Add global mouse event listeners for resize handle
  // React.useEffect(() => {
  //   if (isResizing) {
  //     document.addEventListener("mousemove", handleMouseMove);
  //     document.addEventListener("mouseup", handleMouseUp);
  //     document.body.style.cursor = "ew-resize";
  //     document.body.style.userSelect = "none";
  //   } else {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //     document.removeEventListener("mouseup", handleMouseUp);
  //     document.body.style.cursor = "";
  //     document.body.style.userSelect = "";
  //   }
  //   return () => {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //     document.removeEventListener("mouseup", handleMouseUp);
  //     document.body.style.cursor = "";
  //     document.body.style.userSelect = "";
  //   };
  // }, [isResizing]);

  // Pseudocode dragging listeners
  React.useEffect(() => {
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
  React.useEffect(() => {
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

  // const renderMenuItem = (item: MenuItem, level = 0) => {
  //   const isExpanded = expandedItems.includes(item.id);
  //   const hasChildren = item.children && item.children.length > 0;
  //   return (handleSidebarMouseMove
  //     <div key={item.id}>
  //       <div
  //         className={`flex items-center justify-between py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${
  //           level > 0 ? "ml-4" : ""
  //         }`}
  //         onClick={() => hasChildren && toggleExpanded(item.id)}
  //       >
  //         <div className="flex items-center gap-3">
  //           {hasChildren ? (
  //             isExpanded ? (
  //               <ChevronDown className="h-4 w-4 text-gray-500" />
  //             ) : (
  //               <ChevronRight className="h-4 w-4 text-gray-500" />
  //             )
  //           ) : (
  //             <div className="w-4 h-4" />
  //           )}
  //           {item.icon}
  //           <span>{item.label}</span>
  //         </div>
  //       </div>
  //       {hasChildren && isExpanded && (
  //         <div className="ml-4 space-y-1">
  //           {item.children?.map((child) => (
  //             <div
  //               key={child.id}
  //               className="py-2 px-3 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ml-6"
  //             >
  //               {child.label}
  //             </div>
  //           ))}
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Draggable Sidebar - Full Height */}
      <SideContent
        isOpen={isSidebarOpen}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        onToggle={handleToggleSidebar}
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={handleAlgorithmChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        

        {/* Visualization Area */}
        <div>
          <BubbleSort/>
        </div>

        {/* Control Panel - Inline */}
        <div className="fixed bottom-0 flex items-center justify-between gap-4 p-4 bg-background border-t min-w-0">
          {/* Left Section: Array Controls - Fixed Width */}
          <div className="flex items-center gap-6">
            {/* Press Button Array Size Controls */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Array Size
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArraySizeDecrease}
                  onMouseDown={() => startContinuousChange(false)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={arraySize <= 3}
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
                  onMouseDown={() => startContinuousChange(true)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={arraySize >= 50}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Array Elements Input with Resizable Width - Constrained */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Array Elements
              </span>
              <div className="flex items-center gap-2" ref={resizeRef}>
                <div className="relative flex items-center">
                  <Input
                    value={arrayElements}
                    onChange={handleInputChange}
                    placeholder="45, 85, 95, 60, 75, 25, 35"
                    className="h-8 text-sm pr-6"
                    style={{ width: `${inputWidth}px` }}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateRandomArray}
                  className="h-8 w-20 px-3 text-xs bg-transparent"
                >
                  Random
                </Button>
              </div>
            </div>
          </div>

          {/* Center Section: Animation Controls - Positioned Relatively */}
          <div className="flex items-center justify-center flex-1 px-8">
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-10 w-12 hover:bg-muted"
                aria-label="Reset"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevStep}
                disabled={currentStep <= 0}
                className="h-10 w-12 hover:bg-muted disabled:opacity-50"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlay}
                className="h-10 w-16 hover:bg-muted"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextStep}
                disabled={currentStep >= 10}
                className="h-10 w-12 hover:bg-muted disabled:opacity-50"
                aria-label="Next step"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Right Section: Speed and Sort Controls */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {/* Speed Controls */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Speed
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeedDecrease}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={speed <= 0.25}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center font-medium">
                  {speed}x
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeedIncrease}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={speed >= 4}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Sort Order Controls - Wider Tabs + Independent Code Button */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Sort Order
              </span>
              <div className="flex items-center gap-3">
                {/* Shadcn Tabs for Asc/Desc - Increased Width */}
                <Tabs
                  value={sortOrder}
                  onValueChange={(value) =>
                    handleSortOrderChange(value as "asc" | "desc")
                  }
                >
                  <TabsList className="grid w-32 grid-cols-2">
                    <TabsTrigger value="asc">Asc</TabsTrigger>
                    <TabsTrigger value="desc">Desc</TabsTrigger>
                  </TabsList>
                </Tabs>
                {/* Independent Code Button */}
                <Button
                  variant={showCode ? "default" : "outline"}
                  size="sm"
                  onClick={handleCodeToggle}
                  className="w-20 px-4"
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
                {selectedAlgorithm === 'selection' && 'Selection Sort'}
                {selectedAlgorithm === 'bubble' && 'Bubble Sort'}
                {selectedAlgorithm === 'insertion' && 'Insertion Sort'}
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

      
    </div>
  );
}
