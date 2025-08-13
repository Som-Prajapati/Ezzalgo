"use client"
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Menu,
  Link as LinkIcon,
} from "lucide-react";
import { BarChart3, Binary, GitBranch, List } from "lucide-react";
// Import Link from Next.js for navigation
import Link from "next/link";
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

interface SidebarProps {
  isOpen: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggle: () => void;
  selectedAlgorithm?: 'bubble' | 'selection' | 'insertion';
  onAlgorithmChange?: (algorithm: 'bubble' | 'selection' | 'insertion') => void;
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

export default function Sidebar({ 
  isOpen, 
  width, 
  onWidthChange, 
  onToggle, 
  selectedAlgorithm, 
  onAlgorithmChange 
}: SidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [activeTab, setActiveTab] = useState("docs");
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "sorting-algorithms",
    "trees",
  ]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const toggleExpanded = (item: string) => {
    setExpandedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Sidebar drag handlers
  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    if (!isOpen) return;

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(width);
    e.preventDefault();
  };

  const handleSidebarMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const newWidth = dragStartWidth + deltaX;

    // If dragging left significantly, close the sidebar
    if (newWidth < 150) {
      onToggle();
      onWidthChange(0);
    } else {
      // Otherwise, resize normally
      const constrainedWidth = Math.max(260, Math.min(200, newWidth));
      onWidthChange(constrainedWidth);
    }
  };

  const handleSidebarMouseUp = () => {
    setIsDragging(false);
  };

  const handleClosedSidebarClick = () => {
    if (!isOpen) {
      onToggle();
      onWidthChange(260);
    }
  };

  // Add global mouse event listeners for sidebar dragging
  useEffect(() => {
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

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    // Check if this is a sorting algorithm item
    const isAlgorithmItem = ['bubble-sort', 'selection-sort', 'insertion-sort'].includes(item.id);
    const isSelected = isAlgorithmItem && (
      (item.id === 'bubble-sort' && selectedAlgorithm === 'bubble') ||
      (item.id === 'selection-sort' && selectedAlgorithm === 'selection') ||
      (item.id === 'insertion-sort' && selectedAlgorithm === 'insertion')
    );

    const handleItemClick = () => {
      if (hasChildren) {
        toggleExpanded(item.id);
      } else if (isAlgorithmItem && onAlgorithmChange) {
        // Map the menu item IDs to algorithm names
        const algorithmMap: Record<string, 'bubble' | 'selection' | 'insertion'> = {
          'bubble-sort': 'bubble',
          'selection-sort': 'selection',
          'insertion-sort': 'insertion'
        };
        const algorithm = algorithmMap[item.id];
        if (algorithm) {
          onAlgorithmChange(algorithm);
        }
      }
    };

    return (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer group ${
            isSelected 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={handleItemClick}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                )}
              </div>
            )}
            {!hasChildren && <div className="w-3" />}
            {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
            <span className={`text-sm truncate ${
              isSelected ? 'text-blue-700 font-medium' : 'text-slate-700'
            }`}>
              {item.label}
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navbar - always present */}
      <div className="absolute inset-0 z-0">
      <header className="h-16 flex items-center justify-between px-8 relative z-10">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle button */}
          
        </div>
        {/* Center - Dynamic Algorithm title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <span
            className={`text-xl font-extrabold text-gray-900 ${michroma.className}`}
          >
            {selectedAlgorithm === 'selection' && 'Selection Sort'}
            {selectedAlgorithm === 'bubble' && 'Bubble Sort'}
            {selectedAlgorithm === 'insertion' && 'Insertion Sort'}
            {!selectedAlgorithm && 'Ezzalgo'}
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
      </div>

      {/* Content area with sidebar */}
      <div className="flex flex-1 h-full z-1">
        {/* Sidebar */}
        {isOpen ? (
          <div
            className="flex h-full bg-white border-r border-slate-200"
            style={{ width: `${width}px` }}
          >
            <div className="flex-1 flex flex-col min-w-0">
              {/* Logo */}
              <div className="p-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Ezzalgo</h1>
              </div>
              
              <div className="flex items-center justify-between px-4 py-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="grid w-50 grid-cols-2 mx-4 mt-3">
                    <TabsTrigger value="docs" className="text-xs">
                      Docs
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="text-xs">
                      Profile
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="docs" className="flex-1 flex flex-col min-h-0 mt-3">
                    <div className="px-4 mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          placeholder="Search documentation..."
                          className="pl-10 h-8 text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 scrollbar-hide" style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}>
                      <style jsx>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      <div className="space-y-0.5">
                        {filteredMenuItems.map((item) => renderMenuItem(item))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="profile" className="flex-1 flex flex-col min-h-0 mt-3">
                    <div className="px-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">User Profile</div>
                          <div className="text-xs text-slate-500 truncate">user@example.com</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div
              className="w-1 bg-slate-200 hover:bg-slate-300 cursor-ew-resize flex-shrink-0 relative group"
              onMouseDown={handleSidebarMouseDown}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal className="w-3 h-3 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-8 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={handleClosedSidebarClick}
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        )}

      </div>
      
      {/* Fixed AI Button - Now properly using Next.js Link */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40">
        <Link href="/notes/bubble" passHref>
          <button className="relative inline-flex h-28 w-10 rounded-sm overflow-hidden p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-transform hover:scale-105">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8B5CF6_0%,#F59E0B_50%,#EF4444_75%,#8B5CF6_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center bg-zinc-900 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl hover:bg-zinc-800 transition-colors">
              <span className="transform -rotate-90 whitespace-nowrap">AI</span>
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
}