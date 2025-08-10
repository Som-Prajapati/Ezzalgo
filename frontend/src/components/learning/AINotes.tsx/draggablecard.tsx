"use client";
import React from "react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  Copy,
  Code,
} from "lucide-react";
import { BarChart3, Binary, GitBranch, List } from "lucide-react";

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

const selectionSortCode = `function selectionSort(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        let minIndex = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        // Swap elements
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
    return arr;
}`;

// Draggable Code Panel Component
const DraggableCodePanel = ({ showCode, currentCodeLine }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = Math.max(
        0,
        Math.min(
          e.clientX - offset.current.x,
          window.innerWidth - (cardRef.current?.offsetWidth || 400)
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          e.clientY - offset.current.y,
          window.innerHeight - (cardRef.current?.offsetHeight || 300)
        )
      );
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "default";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
    document.body.style.cursor = "grabbing";
  };

  if (!showCode) return null;

  return (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
      className="transition-transform duration-200 ease-in-out"
    >
      <Card className="w-96 shadow-xl border-2">
        <div
          className="bg-blue-50 p-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none border-b"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <GripHorizontal className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Selection Sort Code
            </span>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="bg-gray-50 p-4 border-gray-200">
            <pre className="text-sm overflow-x-auto">
              <code className="text-gray-700">
                {selectionSortCode.split("\n").map((line, index) => (
                  <div
                    key={index}
                    className={`${
                      currentCodeLine === index
                        ? "bg-blue-100 border-l-4 border-blue-500 font-semibold"
                        : ""
                    } pl-2 py-1 transition-colors`}
                  >
                    {line}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
  const [arraySize, setArraySize] = useState(10);
  const [arrayElements, setArrayElements] = useState(
    "45, 85, 95, 60, 75, 25, 35, 15, 30, 55"
  );
  const [speed, setSpeed] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showCode, setShowCode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(4);
  const [currentCodeLine, setCurrentCodeLine] = useState(3);
  const [canGoBack, setCanGoBack] = useState(true);
  const [canGoForward, setCanGoForward] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Control layout specific state
  const [inputWidth, setInputWidth] = useState(256);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Constants
  const minArraySize = 3;
  const maxArraySize = 50;

  // Refs for floating control panel
  const mediaPlayerRef = useRef<HTMLDivElement>(null);
  const floatingPanelRef = useRef<HTMLDivElement>(null);

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

  // Floating panel animation handlers
  const togglePanel = () => {
    const mediaPlayer = mediaPlayerRef.current;
    const floatingPanel = floatingPanelRef.current;

    if (!mediaPlayer || !floatingPanel) return;

    if (isPanelOpen) {
      // Close panel - slide down
      floatingPanel.style.transform = "translateY(100px)";
      mediaPlayer.style.transform = "translateY(100px)";
    } else {
      // Open panel - slide up
      floatingPanel.style.transform = "translateY(0px)";
      mediaPlayer.style.transform = "translateY(0px)";
    }

    setIsPanelOpen(!isPanelOpen);
  };

  // Initialize positions
  useEffect(() => {
    const floatingPanel = floatingPanelRef.current;
    const mediaPlayer = mediaPlayerRef.current;
    if (floatingPanel) {
      floatingPanel.style.transform = "translateY(0px)";
      floatingPanel.style.transition =
        "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    }
    if (mediaPlayer) {
      mediaPlayer.style.transform = "translateY(0px)";
      mediaPlayer.style.transition =
        "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    }
  }, []);

  // Array size handlers
  const handleArraySizeChange = useCallback(
    (newSize: number | ((prev: number) => number)) => {
      if (typeof newSize === "function") {
        setArraySize(newSize);
      } else {
        setArraySize(newSize);
      }
    },
    []
  );

  const startContinuousChange = useCallback(
    (increment: boolean) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          handleArraySizeChange((prevSize) => {
            if (increment) {
              return Math.min(maxArraySize, prevSize + 1);
            } else {
              return Math.max(minArraySize, prevSize - 1);
            }
          });
        }, 100);
      }, 300);
    },
    [handleArraySizeChange, minArraySize, maxArraySize]
  );

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
    handleArraySizeChange((prevSize) => Math.max(minArraySize, prevSize - 1));
  }, [handleArraySizeChange, minArraySize]);

  const handleArraySizeIncrease = useCallback(() => {
    handleArraySizeChange((prevSize) => Math.min(maxArraySize, prevSize + 1));
  }, [handleArraySizeChange, maxArraySize]);

  // Array elements handlers
  const generateRandomArray = useCallback(() => {
    const randomArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * 100) + 1
    );
    setArrayElements(randomArray.join(", "));
  }, [arraySize]);

  const duplicateArray = useCallback(() => {
    const currentArray = arrayElements
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    if (currentArray.length > 0) {
      const duplicatedArray = [...currentArray, ...currentArray];
      setArrayElements(duplicatedArray.join(", "));
    }
  }, [arrayElements]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const filteredValue = value.replace(/[^0-9,\s]/g, "");
      setArrayElements(filteredValue);
    },
    []
  );

  // Speed handlers
  const handleSpeedDecrease = useCallback(() => {
    setSpeed((prev) => Math.max(0.25, prev - 0.25));
  }, []);

  const handleSpeedIncrease = useCallback(() => {
    setSpeed((prev) => Math.min(4, prev + 0.25));
  }, []);

  // Animation control handlers
  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setCurrentCodeLine(0);
    setCanGoBack(true);
    setCanGoForward(true);
  }, []);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCurrentCodeLine(Math.max(0, currentCodeLine - 1));
    }
    setIsPlaying(false);
  }, [currentStep, currentCodeLine]);

  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleNextStep = useCallback(() => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
      setCurrentCodeLine(Math.min(pseudoCode.length - 1, currentCodeLine + 1));
    }
    setIsPlaying(false);
  }, [currentStep, currentCodeLine]);

  // Sort order handler
  const handleSortOrderChange = useCallback((order: "asc" | "desc") => {
    setSortOrder(order);
  }, []);

  // Code toggle handler
  const handleCodeToggle = useCallback(() => {
    setShowCode(!showCode);
  }, [showCode]);

  // Resize handlers
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
            <span className="text-xl font-extrabold text-gray-900">
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
          {/* Status Message */}
          <div className="text-gray-600 text-base font-medium bg-blue-50 px-4 py-2 rounded-lg">
            → Comparing elements at positions 2 and 3
          </div>

          {/* Media Player - Positioned below visualization */}
          <div
            ref={mediaPlayerRef}
            className="mt-20"
            style={{ transform: "translateY(-100px)" }}
          >
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-10 w-12 hover:bg-muted"
                  aria-label="Reset"
                >
                  <RotateCcw className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevStep}
                  disabled={!canGoBack}
                  className="h-10 w-12 hover:bg-muted disabled:opacity-50"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlay}
                  className="h-10 w-14 hover:bg-muted"
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
                  onClick={handleNextStep}
                  disabled={!canGoForward}
                  className="h-10 w-12 hover:bg-muted disabled:opacity-50"
                  aria-label="Next step"
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Control Panel Container - Outside sidebar, positioned relative to main content */}
      <div
        ref={floatingPanelRef}
        className="fixed bottom-5 z-40 bg-background border rounded-xl"
        style={{
          left: `${isSidebarOpen ? sidebarWidth + 20 : 20}px`,
          right: "20px",
        }}
      >
        {/* Toggle Button - Inside container at top edge */}
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={togglePanel}
            className="h-10 w-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 transition-all duration-200 hover:scale-105"
            aria-label={isPanelOpen ? "Hide controls" : "Show controls"}
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${
                isPanelOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Control Panel Content */}
        <div className="flex items-center justify-between gap-4 p-4 bg-background border-t min-w-0">
          {/* Left Section: Array Controls */}
          <div className="flex items-center gap-6">
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
                  onMouseDown={() => startContinuousChange(false)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
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
                  onMouseDown={() => startContinuousChange(true)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  className="h-8 w-10 hover:bg-muted"
                  disabled={arraySize >= maxArraySize}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Array Elements Input */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Array Elements
              </span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Input
                    value={arrayElements}
                    onChange={handleInputChange}
                    placeholder="45, 85, 95, 60, 75, 25, 35"
                    className="h-8 text-sm pr-6"
                    style={{ width: `${inputWidth}px` }}
                  />
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={duplicateArray}
                  className="h-8 w-20 px-3 text-xs bg-transparent"
                  title="Duplicate current array"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
              </div>
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

            {/* Sort Order Controls */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                Sort Order
              </span>
              <div className="flex items-center gap-3">
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
                <Button
                  variant={showCode ? "default" : "outline"}
                  size="sm"
                  onClick={handleCodeToggle}
                  className="w-20 px-4"
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Code Panel */}
      <DraggableCodePanel
        showCode={showCode}
        currentCodeLine={currentCodeLine}
      />

      {/* Original Pseudocode Panel (keeping for backward compatibility) */}
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

      {/* AI Assistant Button */}
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
