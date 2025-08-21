"use client";

import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GripHorizontal, X } from "lucide-react";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number | "auto";
  height: number | "auto";
}

interface DraggableCodePanelProps {
  pseudoCode?: string[][];
  showPseudoCode?: number;
  tabTitles?: string[];
  showCode?: boolean;
  currentLine?: number;
}

const DraggableCodePanel: React.FC<DraggableCodePanelProps> = ({
  pseudoCode,
  showPseudoCode,
  tabTitles,
  showCode,
  currentLine,
}) => {
  const [position, setPosition] = useState<Position>({ x: 1000, y: 80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [size, setSize] = useState<Size>({ width: "auto", height: "auto" });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  // const OFFSET_X = Math.floor((window.innerWidth / 100) * 60);

  const cardRef = useRef<HTMLDivElement>(null);
  const offset = useRef<Position>({ x: 0, y: 0 });
  const resizeOffset = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 0, height: 0 });

  const currentCodeLine: number = 4;

  // Return null if showCode is false

  useEffect(() => {
    setActiveTab(showPseudoCode ?? 0);
  }, [showPseudoCode]);

  useEffect(() => {
    if (cardRef.current && (size.width === "auto" || size.height === "auto")) {
      const rect = cardRef.current.getBoundingClientRect();
      setSize((prevSize) => ({
        width:
          prevSize.width === "auto"
            ? Math.max(300, rect.width)
            : prevSize.width,
        height:
          prevSize.height === "auto"
            ? Math.max(200, rect.height)
            : prevSize.height,
      }));
    }
  }, [size.width, size.height]);

  useEffect(() => {
    if (!showCode) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) {
        const currentWidth = typeof size.width === "number" ? size.width : 500;
        const currentHeight =
          typeof size.height === "number" ? size.height : 400;
        const newX = Math.max(
          0,
          Math.min(
            e.clientX - offset.current.x,
            window.innerWidth - currentWidth
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            e.clientY - offset.current.y,
            window.innerHeight - currentHeight
          )
        );
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeOffset.current.x;
        const deltaY = e.clientY - resizeOffset.current.y;

        let newWidth = resizeOffset.current.width;
        let newHeight = resizeOffset.current.height;

        if (resizeDirection.includes("right")) {
          newWidth = Math.max(300, resizeOffset.current.width + deltaX);
        }
        if (resizeDirection.includes("left")) {
          newWidth = Math.max(300, resizeOffset.current.width - deltaX);
        }
        if (resizeDirection.includes("bottom")) {
          newHeight = Math.max(200, resizeOffset.current.height + deltaY);
        }
        if (resizeDirection.includes("top")) {
          newHeight = Math.max(200, resizeOffset.current.height - deltaY);
        }

        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection("");
      document.body.style.cursor = "default";
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = isDragging ? "grabbing" : "nw-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [
    isDragging,
    isResizing,
    resizeDirection,
    size.width,
    size.height,
    showCode,
  ]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
    document.body.style.cursor = "grabbing";
  };

  const handleResizeStart = (
    e: MouseEvent<HTMLDivElement>,
    direction: string
  ) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    const currentWidth = typeof size.width === "number" ? size.width : 500;
    const currentHeight = typeof size.height === "number" ? size.height : 400;
    resizeOffset.current = {
      x: e.clientX,
      y: e.clientY,
      width: currentWidth,
      height: currentHeight,
    };
    document.body.style.cursor = "nw-resize";
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;
  const currentPseudoCode =
    Array.isArray(pseudoCode) && pseudoCode[activeTab]
      ? pseudoCode[activeTab]
      : [];

  return (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: typeof size.width === "number" ? `${size.width}px` : "auto",
        height: typeof size.height === "number" ? `${size.height}px` : "auto",
        zIndex: 1000,
      }}
      className="transition-transform duration-200 ease-in-out"
    >
      <Card className="w-full h-full shadow-xl border-2 border-gray-300 rounded-xl relative py-0 gap-4">
        {/* Header with drag handle */}
        <div
          className="bg-blue-50 p-3 flex rounded-t-xl items-center justify-between cursor-grab active:cursor-grabbing select-none border-b"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <GripHorizontal className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Pseudocode Panel
            </span>
          </div>
          {/* <button
            onClick={handleClose}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button> */}
        </div>

        {/* Tab Navigation - shows when there are multiple tabs */}
        {Array.isArray(tabTitles) && tabTitles.length > 1 && (
          <div className="bg-gray-50 border-b overflow-x-auto scrollbar-none">
            <div className="flex">
              {tabTitles.map((title, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === index
                      ? "bg-white text-blue-600 border-b-2 border-blue-500"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Code Content */}
        <CardContent className="p-0 flex-1 h-[calc(100%-60px)] mb-2 ">
          <div className="bg-white overflow-y-auto rounded-b-lg rounded-t-lg scrollbar-none h-full">
            <pre className="text-sm overflow-x-auto px-4 m-0">
              <code className="text-gray-700 font-sans">
                {currentPseudoCode.map((line, index) => (
                  <div
                    key={index}
                    className={`leading-5 transition-colors py-0.5 ${
                      (currentLine !== undefined
                        ? currentLine
                        : currentCodeLine) === index
                        ? "bg-blue-100 border-l-4 border-blue-500 font-semibold pl-1"
                        : "pl-2"
                    }`}
                  >
                    <span className="text-slate-600 font-sans mr-8 select-none">
                      {index + 1}
                    </span>
                    {line}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </CardContent>

        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "right")}
        />

        {/* Bottom resize handle */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-200 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "bottom")}
        />

        {/* Bottom-right corner resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize hover:bg-blue-300 transition-colors"
          onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
        />
      </Card>
    </div>
  );
};

export default DraggableCodePanel;
