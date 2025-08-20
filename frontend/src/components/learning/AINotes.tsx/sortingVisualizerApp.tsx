"use client";
import React from "react";
import { useState, useMemo, useRef, useCallback } from "react";
import JumpSearch from "../searching/JumpSearch";
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
import SelectionSort from "../sorting/SelectionSort";
import InsertionSort from "../sorting/InsertionSort";
import HeapSort from "../sorting/HeapSort";
import RadixSort from "../sorting/RadixSort";
import LinearSearch from "../searching/LinearSearch";
import BinarySearch from "../searching/BinarySearch";
import CountSort from "../sorting/CountSort";

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
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<
    | "bubble"
    | "selection"
    | "insertion"
    | "heap"
    | "jump"
    | "linear"
    | "binary"
    | "radix"
  >("binary");

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

  const handleAlgorithmChange = (
    algorithm:
      | "bubble"
      | "selection"
      | "insertion"
      | "heap"
      | "jump"
      | "linear"
      | "binary"
      | "radix"
  ) => {
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
        {selectedAlgorithm === "bubble" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <BubbleSort isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {selectedAlgorithm === "insertion" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <InsertionSort isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
          // <div className="flex justify-center items-center flex-1 p-4">
          //   <InsertionSort
          //     isOpen={isSidebarOpen}
          //     width={sidebarWidth}
          //   />
          // </div>
        )}
        {selectedAlgorithm === "selection" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <SelectionSort isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {selectedAlgorithm === "heap" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <HeapSort isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {selectedAlgorithm === "jump" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <JumpSearch isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {selectedAlgorithm === "radix" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <RadixSort isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {selectedAlgorithm === "linear" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <LinearSearch isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {selectedAlgorithm === "binary" && (
          <div className="flex justify-center items-center flex-1 p-4">
            <CountSort isOpen={isSidebarOpen} width={sidebarWidth} />
          </div>
        )}
        {/* Control Panel - Inline */}
      </div>

      {/* Floating Draggable Pseudocode Panel */}
    </div>
  );
}
