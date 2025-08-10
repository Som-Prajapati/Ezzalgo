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
} from "lucide-react";
import { BarChart3, Binary, GitBranch, List } from "lucide-react";

// At the top of your component or in a separate fonts file
import { Abril_Fatface } from "next/font/google";

const michroma = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "quick-start",
    label: "Quick Start",
    icon: <List className="w-4 h-4 text-blue-500" />,
  },
  {
    id: "sorting-algorithms",
    label: "Sorting Algorithms",
    icon: <BarChart3 className="w-4 h-4 text-green-500" />,
    children: [
      { id: "bubble-sort", label: "Bubble Sort" },
      { id: "selection-sort", label: "Selection Sort" },
      { id: "insertion-sort", label: "Insertion Sort" },
      { id: "merge-sort", label: "Merge Sort" },
      { id: "quick-sort", label: "Quick Sort" },
      { id: "heap-sort", label: "Heap Sort" },
    ],
  },
  {
    id: "data-structures",
    label: "Data Structures",
    icon: <Binary className="w-4 h-4 text-purple-500" />,
  },
  {
    id: "trees",
    label: "Trees",
    icon: <GitBranch className="w-4 h-4 text-orange-500" />,
    children: [{ id: "binary-tree", label: "Binary Tree" }],
  },
];

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
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("docs");
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "sorting-algorithms",
    "trees",
  ]);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Control layout specific state
  const [inputWidth, setInputWidth] = useState(256); // Default w-64 = 256px
  const [isResizingInput, setIsResizingInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Visualization data
  const arrayValues = [45, 85, 95, 60, 75, 25, 35];
  const maxValue = Math.max(...arrayValues);

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery) return menuItems;
    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          const matchesSearch = item.label
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const filteredChildren = item.children
            ? filterItems(item.children)
            : [];
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...item,
              children:
                filteredChildren.length > 0 ? filteredChildren : item.children,
            };
          }
          return null;
        })
        .filter(Boolean) as MenuItem[];
    };
    return filterItems(menuItems);
  }, [searchQuery]);

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

  const toggleExpanded = (item: string) => {
    setExpandedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Sidebar drag handlers
  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    if (!isSidebarOpen) return;

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(sidebarWidth);
    e.preventDefault();
  };

  const handleSidebarMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const newWidth = dragStartWidth + deltaX;

    // If dragging left significantly, close the sidebar
    if (newWidth < 150) {
      setIsSidebarOpen(false);
      setSidebarWidth(0);
    } else {
      // Otherwise, resize normally
      const constrainedWidth = Math.max(250, Math.min(500, newWidth));
      setSidebarWidth(constrainedWidth);
    }
  };

  const handleSidebarMouseUp = () => {
    setIsDragging(false);
  };

  // Handle opening closed sidebar
  const handleClosedSidebarClick = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setSidebarWidth(320);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(250, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

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

  // Add global mouse event listeners for sidebar dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleSidebarMouseMove);
      document.addEventListener("mouseup", handleSidebarMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleSidebarMouseMove);
      document.removeEventListener("mouseup", handleSidebarMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleSidebarMouseMove);
      document.removeEventListener("mouseup", handleSidebarMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, dragStartX, dragStartWidth]);

  // Add global mouse event listeners for resize handle
  React.useEffect(() => {
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
  }, [isResizing]);

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

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    return (
      <div key={item.id}>
        <div
          className={`flex items-center justify-between py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${
            level > 0 ? "ml-4" : ""
          }`}
          onClick={() => hasChildren && toggleExpanded(item.id)}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            {item.icon}
            <span>{item.label}</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {item.children?.map((child) => (
              <div
                key={child.id}
                className="py-2 px-3 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ml-6"
              >
                {child.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Draggable Sidebar - Full Height */}
      {isSidebarOpen ? (
        <div
          className="bg-white border-r border-gray-200 flex flex-col relative shadow-sm cursor-grab active:cursor-grabbing transition-all duration-300"
          style={{ width: `${sidebarWidth}px` }}
          onMouseDown={handleSidebarMouseDown}
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Ezzalgo</h1>
          </div>
          {/* Sidebar Tabs - Improved Design */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 h-10">
                <TabsTrigger
                  value="docs"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Docs
                </TabsTrigger>
                <TabsTrigger
                  value="learning"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Learning
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Search Bar */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter sidebar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-colors"
                />
              </div>
            </div>
            <TabsContent
              value="docs"
              className="flex-1 px-4 pb-4 mt-0 overflow-y-auto"
            >
              <nav className="space-y-1">
                {filteredMenuItems.map((item) => renderMenuItem(item))}
              </nav>
            </TabsContent>
            <TabsContent value="learning" className="flex-1 px-4 pb-4 mt-0">
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Learning Resources</h3>
                <p>
                  Interactive tutorials and explanations for algorithms and data
                  structures.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </div>
      ) : (
        // Collapsed sidebar - clickable area to reopen
        <div
          className="w-2 bg-gray-200 hover:bg-blue-500 cursor-pointer transition-all duration-300 flex items-center justify-center group"
          onClick={handleClosedSidebarClick}
        >
          <div className="w-1 h-8 bg-gray-400 group-hover:bg-white rounded-full transition-colors"></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-8 relative">
          <div className="flex items-center gap-4"></div>
          {/* Center - Selection Sort title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <span
              className={`text-xl font-extrabold text-gray-900 ${michroma.className}`}
            >
              Selection Sort
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
          {/* Array Visualization */}
          <div className="flex items-end gap-3 mb-8">
            {arrayValues.map((value, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">
                  {index}
                </span>
                <div
                  className={`w-20 flex items-end justify-center text-white font-bold rounded-t-lg transition-all duration-300 shadow-sm ${
                    index === 2 || index === 3 ? "bg-black" : "bg-gray-400"
                  }`}
                  style={{ height: `${(value / maxValue) * 200}px` }}
                >
                  <span className="pb-3 text-lg">{value}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Comparison Display */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="text-xl font-mono font-semibold text-gray-800">
              arr[2] = 95 <span className="mx-3 text-gray-500">{">"}</span>{" "}
              arr[3] = 60
            </div>
          </div>
          {/* Status Message */}
          <div className="text-gray-600 text-base font-medium bg-blue-50 px-4 py-2 rounded-lg">
            → Comparing elements at positions 2 and 3
          </div>
        </div>

        {/* Control Panel - Inline */}
        <div className="flex items-center justify-between gap-4 p-4 bg-background border-t min-w-0">
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
