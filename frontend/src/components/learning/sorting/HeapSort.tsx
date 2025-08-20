"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import Controls from "./Control";
import SortingControls from "./SortingControl";

const getDynamicSizing = (arrayLength: number) => {
  if (arrayLength <= 9) {
    return {
      BOX_WIDTH: 80,
      BOX_HEIGHT: 80,
      BOX_GAP: 16,
      BOX_BORDER_RADIUS: 12,
      BOX_FONT_SIZE: 20,
      ARROW_SIZE: 8,
      ARROW_FONT_SIZE: 16,
      ECLIPSE_HEIGHT: 80,
      TOTAL_BOX_SPACING: 80 + 16,
      ARROW_Y_OFFSET_DOWN: (80 * 2.4) / 2,
      ARROW_X_OFFSET: 80 / 2,
      NODE_RADIUS: 20,
      LEVEL_HEIGHT: 60,
      ECLIPSE_HEIGHT_NODE: 60,
      LINE_WIDTH: 1,
      TOP_OFFSET: -80 * 3, // You can adjust this value as needed for your layout
      TREE_TOP:
        typeof window !== "undefined" ? window.innerHeight * 0.35 : 0.35 * 800, // Fallback for SSR, assuming 800px height
      TREE_CENTER_X:
        typeof window !== "undefined" ? 0.5 * window.innerWidth : 400, // Fallback for SSR
      HORIZONTAL_SPACING:
        typeof window !== "undefined" ? 0.7 * window.innerWidth : 0.7 * 800,
    };
  } else if (arrayLength <= 16) {
    return {
      BOX_WIDTH: 50,
      BOX_HEIGHT: 50,
      BOX_GAP: 8,
      BOX_BORDER_RADIUS: 8,
      BOX_FONT_SIZE: 14,
      ARROW_SIZE: 6,
      ARROW_FONT_SIZE: 12,
      ECLIPSE_HEIGHT: 60,
      ECLIPSE_HEIGHT_NODE: 30,

      TOTAL_BOX_SPACING: 50 + 8,
      ARROW_Y_OFFSET_DOWN: (50 * 2.4) / 2,
      ARROW_X_OFFSET: 50 / 2,
      NODE_RADIUS: 18,
      LEVEL_HEIGHT: 50,
      LINE_WIDTH: 1.5,
      TOP_OFFSET: -80 * 3,
      TREE_TOP:
        typeof window !== "undefined" ? window.innerHeight * 0.35 : 0.35 * 800, // Fallback for SSR, assuming 800px height
      TREE_CENTER_X:
        typeof window !== "undefined" ? 0.5 * window.innerWidth : 400, // Fallback for SSR
      HORIZONTAL_SPACING:
        typeof window !== "undefined" ? 0.6 * window.innerWidth : 0.6 * 800,
    };
  } else {
    return {
      BOX_WIDTH: 45,
      BOX_HEIGHT: 45,
      BOX_GAP: 6,
      BOX_BORDER_RADIUS: 6,
      BOX_FONT_SIZE: 12,
      ARROW_SIZE: 5,
      ARROW_FONT_SIZE: 10,
      ECLIPSE_HEIGHT: 50,
      TOTAL_BOX_SPACING: 45 + 6,
      ARROW_Y_OFFSET_DOWN: (45 * 2.4) / 2,
      ARROW_X_OFFSET: 45 / 2,
      NODE_RADIUS: 16,
      LEVEL_HEIGHT: 50,
      LINE_WIDTH: 1,
      TOP_OFFSET: -80,
      TREE_TOP: 50,
      TREE_CENTER_X: 250,
      HORIZONTAL_SPACING: 40,
      ECLIPSE_HEIGHT_NODE: 60,
    };
  }
};

interface SidebarProps {
  isOpen: boolean;
  width: number;
}

const HeapSort: React.FC<SidebarProps> = ({ isOpen, width }: SidebarProps) => {
  // Fixed initial array to prevent hydration mismatch
  const getFixedInitialArray = () => [
    42, 17, 89, 31, 65, 8
  ];
  const initialArray = getFixedInitialArray();

  // State management
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(6);
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const arrayElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const arrayNodeRef = useRef<(HTMLDivElement | null)[]>([]);
  // edgeRefs now uses a tuple [number, number] as the key instead of string
  const edgeRefs = useRef<Map<string, SVGLineElement>>(new Map());
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  const propsRef = useRef({ array, speed, isAscending, isPlaying });
  const svgRef = useRef<SVGSVGElement>(null);
  const heapTreeLabelRef = useRef<HTMLDivElement | null>(null);

  // Add refs for step management
  const currentStepRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(0);

  const dynamicSizing = getDynamicSizing(array.length);
  const {
    BOX_WIDTH,
    BOX_HEIGHT,
    BOX_GAP,
    BOX_BORDER_RADIUS,
    BOX_FONT_SIZE,
    ECLIPSE_HEIGHT,
    TOTAL_BOX_SPACING,
    TOP_OFFSET,
    NODE_RADIUS,
    LEVEL_HEIGHT,
    TREE_TOP,
    TREE_CENTER_X,
    HORIZONTAL_SPACING,
    ECLIPSE_HEIGHT_NODE,
  } = dynamicSizing;

  // Animation functions (imported from selection sort)
  const slideElementTo = (
    element: HTMLElement,
    toX: number | string,
    toY: number | string = 0,
    duration: number = 0.5
  ): gsap.core.Tween => {
    return gsap.to(element, {
      x: toX,
      y: toY,
      duration,
      ease: "power1.inOut",
    });
  };

  const animateSortedIndicator = (
    indices: number | number[]
  ): gsap.core.Timeline => {
    const targetIndices = Array.isArray(indices) ? indices : [indices];
    const elements = targetIndices
      .map((index) => arrayElementsRef.current[index])
      .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement);

    if (elements.length === 0) return gsap.timeline();

    const timeline = gsap.timeline();

    elements.forEach((element) => {
      timeline.to(
        element,
        {
          backgroundColor: "#d4edda",
          borderColor: "#c3e6cb",
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    });

    return timeline;
  };

  const highlightElement = (
    index: number,
    color: string
  ): gsap.core.Timeline => {
    const arrayElement = arrayElementsRef.current[index];

    const timeline = gsap.timeline();

    const colorMap = {
      red: {
        bg: "#ffebee",
        border: "#f44336",
        shadow:
          "0 0 20px rgba(244, 67, 54, 0.4), 0 2px 15px rgba(244, 67, 54, 0.2)",
      },
      blue: {
        bg: "#e3f2fd",
        border: "#2196f3",
        shadow:
          "0 0 15px rgba(33, 150, 243, 0.3), 0 2px 12px rgba(33, 150, 243, 0.2)",
      },
      green: {
        bg: "#e8f5e8",
        border: "#4caf50",
        shadow:
          "0 0 15px rgba(76, 175, 80, 0.3), 0 2px 12px rgba(76, 175, 80, 0.2)",
      },
    };

    const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;

    if (arrayElement) {
      timeline.to(
        arrayElement,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
          duration: 0.4,
          ease: "power2.out",
        },
        0
      );
    }

    return timeline;
  };

  const removeHighlight = (index: number): gsap.core.Timeline => {
    const arrayElement = arrayElementsRef.current[index];

    const timeline = gsap.timeline();

    if (arrayElement) {
      timeline.to(
        arrayElement,
        {
          backgroundColor: "#f8f9fa",
          borderColor: "#e9ecef",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          duration: 0.3,
          ease: "power2.out",
        },
        0
      );
    }

    return timeline;
  };

  // Highlights a node (heap tree node) by index, returns a GSAP timeline
  function highlightNode(index: number): GSAPTimeline {
    const timeline = gsap.timeline();
    const node = arrayNodeRef.current?.[index];
    if (node) {
      timeline.to(
        node,
        {
          backgroundColor: "#ffe082",
          borderColor: "#ffb300",
          boxShadow: "0 0 16px 2px #ffe082",
          duration: 0.3,
          ease: "power2.out",
        },
        0
      );
    }
    return timeline;
  }

  // Removes highlight from a node (heap tree node) by index, returns a GSAP timeline
  function removeHighlightNode(index: number): GSAPTimeline {
    const timeline = gsap.timeline();
    const node = arrayNodeRef.current?.[index];
    if (node) {
      timeline.to(
        node,
        {
          backgroundColor: "",
          borderColor: "",
          boxShadow: "",
          duration: 0.3,
          ease: "power2.out",
        },
        0
      );
    }
    return timeline;
  }

  const eclipseSwap = (
    elementA: HTMLElement,
    elementB: HTMLElement,
    duration: number = 1.2
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    const indexA = arrayElementsRef.current.findIndex((el) => el === elementA);
    const indexB = arrayElementsRef.current.findIndex((el) => el === elementB);

    if (indexA === -1 || indexB === -1) {
      return timeline;
    }

    timeline.call(() => {
      const currentXA = gsap.getProperty(elementA, "x") as number;
      const currentXB = gsap.getProperty(elementB, "x") as number;

      const distance = (indexB - indexA) * TOTAL_BOX_SPACING;
      const midPoint = distance / 2;

      const swapAnimation = gsap.timeline();

      swapAnimation
        .to(
          elementA,
          {
            x: currentXA + midPoint,
            y: `+=${-ECLIPSE_HEIGHT}`,
            rotation: 180,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          elementA,
          {
            x: currentXA + distance,
            y: `+=${ECLIPSE_HEIGHT}`,
            rotation: 360,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );

      swapAnimation
        .to(
          elementB,
          {
            x: currentXB - midPoint,
            y: `+=${ECLIPSE_HEIGHT}`,
            rotation: -180,
            duration: duration / 2,
            ease: "power2.out",
          },
          0
        )
        .to(
          elementB,
          {
            x: currentXB - distance,
            y: `+=${-ECLIPSE_HEIGHT}`,
            rotation: -360,
            duration: duration / 2,
            ease: "power2.in",
          },
          duration / 2
        );

      swapAnimation.call(() => {
        gsap.set([elementA, elementB], { rotation: 0 });
      });

      timeline.add(swapAnimation);
    });

    return timeline;
  };

  // New eclipseSwapNodes function: swaps by node indices instead of elements
  // Corrected eclipseSwapNodes: always animates to the correct final positions
  const eclipseSwapNodes = (
    indexA: number,
    indexB: number,
    duration: number = 1.2
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    const elementA = arrayNodeRef.current?.[indexA];
    const elementB = arrayNodeRef.current?.[indexB];

    if (!elementA || !elementB) {
      return timeline;
    }

    // Get the heap node positions (center) for each node
    const posA = getNodePosition(indexA, array.length);
    const posB = getNodePosition(indexB, array.length);

    // Calculate the difference in position between the two nodes
    const deltaX = posB.x - posA.x;
    const deltaY = posB.y - posA.y;

    // Eclipse calculations based on the triangle diagram
    const x = Math.abs(deltaX); // horizontal distance (width of eclipse base)
    const y = Math.abs(deltaY); // vertical distance (height of eclipse base)
    const h = Math.sqrt(x * x + y * y); // hypotenuse (direct distance between nodes)
    const d = (x * y) / (h || 1); // altitude to hypotenuse, avoid division by zero

    // Use ECLIPSE_HEIGHT as the desired arc height
    // Scale the eclipse proportionally if needed
    const eclipseScale = ECLIPSE_HEIGHT_NODE / (d || 1); // avoid division by zero
    const scaledX = x * eclipseScale;
    const scaledY = y * eclipseScale;

    // The midpoint for the arc (halfway between A and B)
    const midX = deltaX / 2;
    const midY = deltaY / 2;

    // Calculate perpendicular offset for the eclipse arc
    // This creates the "height" of the eclipse above/below the direct line
    const perpOffsetX =
      deltaY !== 0 ? (ECLIPSE_HEIGHT_NODE * deltaY) / (h || 1) : 0;
    const perpOffsetY =
      deltaX !== 0
        ? -(ECLIPSE_HEIGHT_NODE * deltaX) / (h || 1)
        : ECLIPSE_HEIGHT_NODE;

    const swapAnimation = gsap.timeline();

    // Use variables to store current positions that will be set in onStart
    let currentXA: number,
      currentYA: number,
      currentXB: number,
      currentYB: number;

    swapAnimation
      // A: move to midpoint above, then to B's position
      .to(
        elementA,
        {
          x: `+=${midX + perpOffsetX}`,
          y: `+=${midY + perpOffsetY}`,
          duration: duration / 2,
          ease: "power2.out",
        },
        0
      )
      .to(
        elementA,
        {
          x: `+=${midX - perpOffsetX}`,
          y: `+=${midY - perpOffsetY}`,
          duration: duration / 2,
          ease: "power2.in",
        },
        duration / 2
      )
      // B: move to midpoint below, then to A's position
      .to(
        elementB,
        {
          x: `+=${-midX - perpOffsetX}`,
          y: `+=${-midY - perpOffsetY}`,
          duration: duration / 2,
          ease: "power2.out",
        },
        0
      )
      .to(
        elementB,
        {
          x: `+=${-midX + perpOffsetX}`,
          y: `+=${-midY + perpOffsetY}`,
          duration: duration / 2,
          ease: "power2.in",
        },
        duration / 2
      );

    swapAnimation.call(() => {
      gsap.set([elementA, elementB], { rotation: 0 });
    });

    timeline.add(swapAnimation);

    return timeline;
  };
  // Function to create a single edge (SVG line) between two nodes in the heap tree
  // Remove the double animation call: only animate in createAllEdges, not in createSingleEdge

  const createSingleEdge = (
    parentIndex: number,
    childIndex: number,
    svg: SVGSVGElement
  ): SVGLineElement | null => {
    // Get node positions in page coordinates
    const parentPos = getNodePosition(parentIndex, array.length);
    const childPos = getNodePosition(childIndex, array.length);

    // Get SVG's bounding rectangle
    const svgRect = svg.getBoundingClientRect();

    // Calculate coordinates relative to SVG, going to the center of each node
    const x1 = parentPos.x - svgRect.left;
    const y1 = parentPos.y - svgRect.top;
    const x2 = childPos.x - svgRect.left;
    const y2 = childPos.y - svgRect.top;

    // Create SVG line element, initially collapsed at parent node
    const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
    edge.setAttribute("x1", `${x1}`);
    edge.setAttribute("y1", `${y1}`); // center of parent node
    edge.setAttribute("x2", `${x1}`);
    edge.setAttribute("y2", `${y1}`); // start collapsed at parent
    edge.setAttribute("stroke", "#bdbdbd");
    edge.setAttribute("stroke-width", "3");
    edge.setAttribute("fill", "none");
    edge.setAttribute("opacity", "0");
    edge.setAttribute("class", `heap-edge edge-${parentIndex}-${childIndex}`);

    // Add to SVG
    svg.appendChild(edge);

    // Do NOT animate here; animation is handled in createAllEdges

    // Store reference for later highlight/reset
    if (edgeRefs.current) {
      edgeRefs.current.set(`${parentIndex},${childIndex}`, edge);
    }

    return edge;
  };

  const createAllEdges = (
    svg: SVGSVGElement,
    n: number
  ): gsap.core.Timeline => {
    // Defensive: clear any previous edges from SVG and edgeRefs
    if (svg) {
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
    }
    if (edgeRefs.current) {
      edgeRefs.current.clear();
    }

    const timeline = gsap.timeline();

    // Collect edges by level: upper levels first, then lower levels
    // We'll use a BFS approach to collect edges by level
    const levels: number[][] = [];
    let level = 0;
    let count = 1;
    let index = 0;
    while (index < n) {
      const levelIndices: number[] = [];
      for (let i = 0; i < count && index < n; i++, index++) {
        levelIndices.push(index);
      }
      levels.push(levelIndices);
      count *= 2;
      level++;
    }

    // Animate edges: all edges in a level animate simultaneously,
    // but each level's animation starts with a stagger after the previous level
    const levelStagger = 1; // seconds between levels
    const edgeDuration = 1; // duration for each edge animation

    for (let l = 1; l < levels.length; l++) {
      const levelTimeline = gsap.timeline();
      for (const childIndex of levels[l]) {
        const parentIndex = Math.floor((childIndex - 1) / 2);
        const edge = createSingleEdge(parentIndex, childIndex, svg);
        if (edge) {
          const parentPos = getNodePosition(parentIndex, n);
          const childPos = getNodePosition(childIndex, n);
          const svgRect = svg.getBoundingClientRect();
          const x1 = parentPos.x - svgRect.left;
          const y1 = parentPos.y - svgRect.top;
          const x2 = childPos.x - svgRect.left;
          const y2 = childPos.y - svgRect.top;
          // All edges in this level animate simultaneously (position 0 in levelTimeline)
          levelTimeline.add(
            animateEdgeExtend(edge, x1, y1, x2, y2, edgeDuration),
            0
          );
        }
      }
      // Stagger each level's animation in the main timeline
      timeline.add(levelTimeline, l * levelStagger);
    }

    return timeline;
  };

  // Animate the edge "growing" from parent to child using stroke-dasharray and stroke-dashoffset
  const animateEdgeExtend = (
    edge: SVGLineElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 0.5
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Set the initial position (collapsed at parent)
    edge.setAttribute("x1", `${x1}`);
    edge.setAttribute("y1", `${y1}`);
    edge.setAttribute("x2", `${x2}`);
    edge.setAttribute("y2", `${y2}`);

    // Calculate the length of the line
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Set up stroke-dasharray and stroke-dashoffset for the "draw" effect
    edge.setAttribute("stroke-dasharray", `${length}`);
    edge.setAttribute("stroke-dashoffset", `${length}`);
    // edge.setAttribute("opacity", "1");

    // Animate the stroke-dashoffset from full length to 0 (revealing the line)
    timeline.to(edge, {
      strokeDashoffset: 0,
      duration,
      ease: "power2.out",
      onStart: () => {
        edge.setAttribute("opacity", "1");
      },
      onComplete: () => {
        // Clean up so the line is solid after animation
        edge.removeAttribute("stroke-dasharray");
        edge.removeAttribute("stroke-dashoffset");
      },
    });

    return timeline;
  };

  // Animate edge compress: animate the edge from child back to parent (collapse)
  const animateEdgeCompress = (
    edge: SVGLineElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 0.5
  ): gsap.core.Timeline => {
    const timeline = gsap.timeline();

    // Set the initial position (fully extended)
    edge.setAttribute("x1", `${x1}`);
    edge.setAttribute("y1", `${y1}`);
    edge.setAttribute("x2", `${x2}`);
    edge.setAttribute("y2", `${y2}`);

    // Animate the line's x2/y2 back to the parent node's position
    timeline.to(edge, {
      attr: { x2: x1, y2: y1 },
      duration,
      ease: "power2.in",
    });

    // timeline.set(edge, { opacity: 0 }, 0);
    return timeline;
  };

  // Function to create all edges for the heap tree

  // Helper function to get edge between parent and child
  const getEdge = (
    parentIndex: number,
    childIndex: number
  ): SVGLineElement | undefined => {
    return edgeRefs.current.get(`${parentIndex},${childIndex}`);
  };

  // Helper function to highlight a specific edge
  const highlightEdge = (
    parentIndex: number,
    childIndex: number,
    color: string = "#ff6b6b"
  ): void => {
    const edge = getEdge(parentIndex, childIndex);
    if (edge) {
      gsap.to(edge, {
        stroke: color,
        strokeWidth: 5,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  // Helper function to reset edge styling
  const resetEdge = (parentIndex: number, childIndex: number): void => {
    const edge = getEdge(parentIndex, childIndex);
    if (edge) {
      gsap.to(edge, {
        stroke: "#bdbdbd",
        strokeWidth: 3,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  // Reset animation function
  const resetAnimation = (): void => {
    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Reset all array elements
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
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            zIndex: "auto",
          });
        }
      });
    }

    // Remove all created heap tree nodes (arrayNodeRef) from DOM and clear the ref array
    if (arrayNodeRef.current) {
      arrayNodeRef.current.forEach((node, idx) => {
        if (node && node.parentNode) {
          try {
            node.parentNode.removeChild(node);
          } catch (e) {
            // Defensive: ignore if already removed
          }
        }
        arrayNodeRef.current[idx] = null;
      });
      // Instead of empty array, keep length but all nulls for safety
    }

    // Remove all edges from SVG and clear edgeRefs
    if (svgRef.current) {
      // Remove all SVG children (edges)
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
    }
    edgeRefs.current.clear();

    // Also try to remove edges from any SVG with id "heap-tree-svg" (defensive)
    const existingSvg = document.getElementById("heap-tree-svg");
    if (existingSvg) {
      while (existingSvg.firstChild) {
        existingSvg.removeChild(existingSvg.firstChild);
      }
    }

    // Reset heap tree label opacity to 0
    if (heapTreeLabelRef.current) {
      gsap.set(heapTreeLabelRef.current, { opacity: 0 });
    }

    wasPausedRef.current = false;
    currentStepRef.current = 0;
  };

  // Helper to calculate node positions in a binary heap tree
  // Recursively place each node: root is centered, left child between left and parent, right child between parent and right
  function getNodeX(
    index: number,
    total: number,
    left: number,
    right: number
  ): number {
    const level = Math.floor(Math.log2(index + 1));
    const positionInLevel = index - (Math.pow(2, level) - 1);
    const totalInLevel = Math.pow(2, level);

    const width = right - left;
    const nodeWidth = width / totalInLevel;

    return left + nodeWidth * positionInLevel + nodeWidth / 2;
  }

  const getNodePosition = (index: number, total: number) => {
    // Heap is a complete binary tree, so level = floor(log2(index+1))
    const level = Math.floor(Math.log2(index + 1));
    const levelIndex = index - (2 ** level - 1);
    const nodesInLevel = Math.min(2 ** level, total - (2 ** level - 1));

    // Calculate the total width needed for this level
    const levelWidth = (nodesInLevel - 1) * HORIZONTAL_SPACING;

    // Calculate base x position - center the level
    // Place nodes using parent-child logic for a binary heap:
    // The root (index 0) is centered. Each child is placed halfway between its parent and the left/right edge (recursively).
    let baseX = getNodeX(
      index,
      total,
      typeof window !== "undefined"
        ? (window.innerWidth - HORIZONTAL_SPACING) / 2
        : 300,
      typeof window !== "undefined"
        ? (window.innerWidth - HORIZONTAL_SPACING) / 2 + HORIZONTAL_SPACING
        : 800
    );

    // Adjust x position based on sidebar state
    if (isOpen) {
      baseX += width / 2;
    }

    // Calculate y based on the node's level and the level height
    const y = TREE_TOP + level * LEVEL_HEIGHT;

    return { x: baseX, y };
  };

  // Function to create a styled node for the heap tree
  const createHeapNode = (
    value: number,
    index: number,
    x: number,
    y: number
  ): HTMLDivElement => {
    const node = document.createElement("div");
    node.className = "heap-node";
    node.style.position = "absolute";
    node.style.left = `${x - NODE_RADIUS}px`;
    node.style.top = `${y - NODE_RADIUS}px`;
    node.style.width = `${NODE_RADIUS * 2}px`;
    node.style.height = `${NODE_RADIUS * 2}px`;
    node.style.borderRadius = "50%";
    node.style.background = "#fff";
    node.style.border = "2px solid #007bff";
    node.style.display = "flex";
    node.style.alignItems = "center";
    node.style.justifyContent = "center";
    node.style.fontWeight = "bold";
    node.style.fontSize = `${BOX_FONT_SIZE}px`;
    node.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
    node.style.transition = "all 0.3s ease";
    node.style.zIndex = "2";
    node.style.opacity = "0";
    node.textContent = value.toString();
    node.setAttribute("data-index", index.toString());
    return node;
  };

  // Main animation functions (to be implemented)

  // Helper to generate a polygon for a pie slice (from 0 to angle)
  function getPiePolygon(deg: number) {
    const steps = Math.max(3, Math.ceil(deg / 10));
    const points = [`50% 50%`, `50% 0%`];
    for (let i = 0; i <= steps; i++) {
      const angle = (deg * i) / steps - 90;
      const rad = (angle * Math.PI) / 180;
      const x = 50 + 50 * Math.cos(rad);
      const y = 50 + 50 * Math.sin(rad);
      points.push(`${x}% ${y}%`);
    }
    return `polygon(${points.join(",")})`;
  }

  // Animation function for revealing a node with a rotational clipPath effect
  function rotationRevealAnimation(node: HTMLDivElement) {
    const timeline = gsap.timeline();

    // Step 1: Set initial state (opacity 0, nothing revealed)
    gsap.set(node, { opacity: 0, scale: 0.5, rotation: 0 });
    node.style.clipPath = getPiePolygon(0);
    (
      node.style as CSSStyleDeclaration & { webkitClipPath?: string }
    ).webkitClipPath = node.style.clipPath; // For Safari

    // Step 2: Reveal 90deg arc
    // Animate revealing the node from 0 to 90 degrees (pie slice reveal)
    timeline.to(
      node,
      {
        opacity: 0.5,
        scale: 0.7,
        rotation: 0,
        duration: 0.18,
        transformOrigin: "50% 50%",
        ease: "power1.inOut",
        onUpdate: function () {
          // Reveal from 0 to 90 degrees
          const progress = this.progress();
          const deg = 0 + 90 * progress;
          node.style.clipPath = getPiePolygon(deg);
          (
            node.style as CSSStyleDeclaration & { webkitClipPath?: string }
          ).webkitClipPath = node.style.clipPath; // For Safari
        },
        onStart: function () {
          node.style.clipPath = getPiePolygon(0);
          (
            node.style as CSSStyleDeclaration & { webkitClipPath?: string }
          ).webkitClipPath = node.style.clipPath; // For Safari
        },
        onComplete: function () {
          node.style.clipPath = getPiePolygon(90);
          (
            node.style as CSSStyleDeclaration & { webkitClipPath?: string }
          ).webkitClipPath = node.style.clipPath; // For Safari
        },
      },
      "+=0.05"
    );

    // Step 3: Reveal 180deg arc
    timeline.to(node, {
      opacity: 0.7,
      scale: 0.85,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 90 + 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath; // For Safari
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(90);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath; // For Safari
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(180);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath; // For Safari
      },
    });

    // Step 4: Reveal 270deg arc
    timeline.to(node, {
      opacity: 0.85,
      scale: 1,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 180 + 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath; // For Safari
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(180);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath; // For Safari
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(270);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath; // For Safari
      },
    });

    // Step 5: Reveal 360deg (full circle)
    timeline.to(node, {
      opacity: 1,
      scale: 1,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "back.out(2)",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 270 + 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(270);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(360);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
    });
    return timeline;
  }

  // Like rotationRevealAnimation, but hides the node with a rotational "wipe" effect
  function rotationHideAnimation(node: HTMLDivElement) {
    const timeline = gsap.timeline();

    // Step 1: Set initial state (fully visible, full circle)
    // gsap.set(node, { opacity: 1, scale: 1, rotation: 0 });
    node.style.clipPath = getPiePolygon(360);
    (
      node.style as CSSStyleDeclaration & { webkitClipPath?: string }
    ).webkitClipPath = node.style.clipPath; // For Safari

    // Step 2: Hide 270-360deg arc
    timeline.to(node, {
      opacity: 0.85,
      scale: 1,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 360 - 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(360);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(270);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
    });

    // Step 3: Hide 180-270deg arc
    timeline.to(node, {
      opacity: 0.7,
      scale: 0.85,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 270 - 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(270);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(180);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
    });

    // Step 4: Hide 90-180deg arc
    timeline.to(node, {
      opacity: 0.5,
      scale: 0.7,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "power1.inOut",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 180 - 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(180);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(90);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
    });

    // Step 5: Hide 0-90deg arc (fully hidden)
    timeline.to(node, {
      opacity: 0,
      scale: 0.5,
      duration: 0.18,
      transformOrigin: "50% 50%",
      ease: "back.in(2)",
      onUpdate: function () {
        const progress = this.progress();
        const deg = 90 - 90 * progress;
        node.style.clipPath = getPiePolygon(deg);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onStart: function () {
        node.style.clipPath = getPiePolygon(90);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
      onComplete: function () {
        node.style.clipPath = getPiePolygon(0);
        (
          node.style as CSSStyleDeclaration & { webkitClipPath?: string }
        ).webkitClipPath = node.style.clipPath;
      },
    });

    // timeline.set(node, { opacity: 0 });

    return timeline;
  }

  // Function to set all nodes except the given ones to grey fill
  // Greys out all nodes except those at the given indices, returns a GSAP timeline
  function greyOutOtherNodes(indicesToKeep: number[]): GSAPTimeline {
    const timeline = gsap.timeline();
    if (!arrayNodeRef.current) return timeline;
    arrayNodeRef.current.forEach((node, idx) => {
      if (!indicesToKeep.includes(idx)) {
        timeline.to(
          node,
          {
            backgroundColor: "#e0e0e0",
            color: "#888",
            duration: 0.2,
            overwrite: "auto",
          },
          0
        );
      }
    });
    return timeline;
  }

  // Restores all nodes except those at the given indices to their original color, returns a GSAP timeline
  // Restores only the nodes at the given indices to their original color, greys out the rest
  function restoreOnlyNodes(indicesToKeep: number[]): GSAPTimeline {
    const timeline = gsap.timeline();
    arrayNodeRef.current.forEach((node, idx) => {
      if (!indicesToKeep.includes(idx)) {
        timeline.to(
          node,
          {
            backgroundColor: "#fff",
            border: "2px solid #007bff",
            duration: 0.2,
            overwrite: "auto",
          },
          0
        );
      }
    });
    return timeline;
  }

  // Heapify function: heapifies subtree rooted at i in array arr of size n, returns a GSAP timeline of the swaps
  function heapify(
    arr: number[],
    n: number,
    i: number,
    isMaxHeap: boolean = propsRef.current.isAscending
  ): GSAPTimeline {
    const timeline = gsap.timeline();

    let target = i; // Use 'target' instead of 'target' for clarity
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    // Grey out all nodes from index i to the end (for heapify subtree)
    if (arrayNodeRef.current) {
      // Collect all indices in the subtree rooted at i
      const indicesToGrey: number[] = [];
      const collectSubtreeIndices = (root: number) => {
        if (root >= n) return;
        indicesToGrey.push(root);
        collectSubtreeIndices(2 * root + 1);
        collectSubtreeIndices(2 * root + 2);
      };
      collectSubtreeIndices(i);
      timeline.add(greyOutOtherNodes(indicesToGrey));
    }

    // Highlight current node
    if (arrayNodeRef.current) {
      timeline.add(highlightNode(target));
    }
    timeline.add(highlightElement(i, "blue"));

    if (arrayNodeRef.current && left < n && arrayNodeRef.current[left]) {
      timeline.add(highlightNode(left));
      timeline.to(arrayNodeRef.current[left], {
        duration: 0.3,
      });
      timeline.add(removeHighlightNode(left));
      // Highlight the array box at index 'left'
      timeline.add(highlightElement(left, "blue"));
      timeline.to(arrayElementsRef.current[left], {
        duration: 0.3,
      });
      timeline.add(removeHighlight(left));
    }
    if (left < n) {
      if (isMaxHeap && arr[left] > arr[target]) {
        target = left;
      } else if (!isMaxHeap && arr[left] < arr[target]) {
        target = left;
      }
    }
    if (arrayNodeRef.current && right < n && arrayNodeRef.current[right]) {
      timeline.add(highlightNode(right));
      timeline.to(arrayNodeRef.current[right], {
        duration: 0.3,
      });
      timeline.add(removeHighlightNode(right));
      // Highlight the array box at index 'right'
      timeline.add(highlightElement(right, "blue"));
      timeline.to(arrayElementsRef.current[right], {
        duration: 0.3,
      });
      timeline.add(removeHighlight(right));
    }
    if (right < n) {
      if (isMaxHeap && arr[right] > arr[target]) {
        target = right;
      } else if (!isMaxHeap && arr[right] < arr[target]) {
        target = right;
      }
    }

    if (target !== i) {
      // Animate swap

      if (
        arrayNodeRef.current &&
        arrayNodeRef.current[i] &&
        arrayNodeRef.current[target]
      ) {
        // Use eclipseSwapNodes animation for the swap
        timeline.add(eclipseSwapNodes(i, target));
        // Swap the array boxes (arrayElementsRef) visually using eclipseSwap
        if (
          arrayElementsRef.current &&
          arrayElementsRef.current[i] &&
          arrayElementsRef.current[target]
        ) {
          timeline.add(
            eclipseSwap(
              arrayElementsRef.current[i],
              arrayElementsRef.current[target] as HTMLElement
            )
          );
          // Swap the refs so the visual order matches the logical order
          const tempRef = arrayElementsRef.current[i];
          arrayElementsRef.current[i] = arrayElementsRef.current[target];
          arrayElementsRef.current[target] = tempRef;

          // Swap the text content of the array boxes so the numbers visually swap

          timeline.call(() => {});
          // Print the x and y GSAP positions for the swapped elements
        }
        if (
          arrayNodeRef.current &&
          arrayNodeRef.current[i] &&
          arrayNodeRef.current[target]
        ) {
          [arrayNodeRef.current[i], arrayNodeRef.current[target]] = [
            arrayNodeRef.current[target],
            arrayNodeRef.current[i],
          ];
        }
      }

      // Swap values in array
      [arr[i], arr[target]] = [arr[target], arr[i]];

      // Also swap the arrayNodeRef nodes so the tree visualization matches the array swap

      timeline.add(heapify(arr, n, target));
    } else {
      // If no swap, restore only the nodes in the subtree rooted at i
      timeline.add(restoreOnlyNodes([i]));
      // Remove highlight from i
      timeline.add(removeHighlightNode(i));
      timeline.add(removeHighlight(i));
    }

    return timeline;
  }

  // Build heap function: builds a max heap from array arr, returns a GSAP timeline of the process

  // Function to update node positions when sidebar state changes

  const playAnimation = (): void => {
    if (wasPausedRef.current && timelineRef.current) {
      timelineRef.current.play();
      wasPausedRef.current = false;
      return;
    }
    resetAnimation();
    // Clear all children of the SVG element

    const arr = [...array];
    const n = arr.length;
    const mainTimeline = gsap.timeline();
    mainTimeline.timeScale(propsRef.current.speed);
    currentStepRef.current = 0;
    const isMaxHeap = propsRef.current.isAscending;

    mainTimeline.addLabel("step-0");
    mainTimeline.call(() => {
      currentStepRef.current = 0;
    });
    let stepIndex = 1;

    if (arrayElementsRef.current) {
      const elements = arrayElementsRef.current.filter(Boolean);
      mainTimeline.add(
        gsap.to(elements, {
          y: TOP_OFFSET,
          duration: 1,
          ease: "power1.inOut",
          stagger: 0.1,
        })
      );
    }
    // Make the heap tree label visible with a fade-in animation
    if (heapTreeLabelRef.current) {
      gsap.set(heapTreeLabelRef.current, { opacity: 0, y: 0 });
      mainTimeline.add(
        gsap.to(heapTreeLabelRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        })
      );
    }

    // Remove any previous nodes from DOM (defensive, should be handled in reset)
    if (arrayNodeRef.current) {
      arrayNodeRef.current.forEach((node) => {
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
      arrayNodeRef.current = [];
    }

    // Use the svgRef to get the SVG container
    const svg = svgRef.current;
    if (!svg) {
      console.error("SVG element not found");
      return;
    }

    // Clear previous children
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Store node elements for later reference
    arrayNodeRef.current = [];

    // Add a label for this step using stepIndex, then increment stepIndex

    // Create all nodes for the heap tree
    for (let i = 0; i < n; i++) {
      const { x, y } = getNodePosition(i, n);
      const node = createHeapNode(arr[i], i, x, y);

      if (containerRef.current) {
        containerRef.current.appendChild(node);
        arrayNodeRef.current.push(node);

        // Add the animation to mainTimeline with stagger
        mainTimeline.add(rotationRevealAnimation(node), `-=${1.6 - i * 0.1}`);
      }
    }

    mainTimeline.add(createAllEdges(svg, n), "-=1.2");

    // Build heap: call heapify for all non-leaf nodes from bottom up
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      const thisStep = stepIndex;
      mainTimeline.addLabel(`step-${thisStep}`);
      mainTimeline.call(() => {
        currentStepRef.current = thisStep;
      });
      stepIndex++;

      mainTimeline.add(heapify(arr, n, i));
    }

    // Update the heap tree label to "Max heap tree" and add to mainTimeline
    if (heapTreeLabelRef.current) {
      mainTimeline.add(() => {
        if (heapTreeLabelRef.current) {
          heapTreeLabelRef.current.textContent = isMaxHeap
            ? "Max heap tree"
            : "Min heap tree";
        }
      });
      mainTimeline.to(
        heapTreeLabelRef.current,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    }

    for (let i = n - 1; i > 0; i--) {
      {
        const thisStep = stepIndex;
        mainTimeline.addLabel(`step-${thisStep}`);
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
        stepIndex++;
      }
      // Animate swap of max element (root, index 0) with last element (index i) in the heap tree nodes
      // Highlight both the max (root, index 0) and last element node (index i)
      if (arrayNodeRef.current) {
        mainTimeline.add(highlightNode(0));
        mainTimeline.add(highlightNode(i));
      }
      // Update the array to reflect the swap of the root (index 0) and last element (index i)
      [arr[0], arr[i]] = [arr[i], arr[0]];

      // Highlight the array boxes of the max (root, index 0) and last element (index i)
      mainTimeline.add(highlightElement(0, "blue"));
      mainTimeline.add(highlightElement(i, "blue"));

      if (
        arrayNodeRef.current &&
        arrayNodeRef.current[0] &&
        arrayNodeRef.current[i]
      ) {
        // Use eclipseSwapNodes animation for the heap tree nodes
        mainTimeline.add(eclipseSwapNodes(0, i));
        // After animation, swap the refs so the visual order matches the logical order
        mainTimeline.call(() => {});
        [arrayNodeRef.current[0], arrayNodeRef.current[i]] = [
          arrayNodeRef.current[i],
          arrayNodeRef.current[0],
        ];
      }
      // Use eclipseSwap to animate the swap of the array boxes (arrayElements) at index 0 and i
      if (
        arrayElementsRef.current &&
        arrayElementsRef.current[0] &&
        arrayElementsRef.current[i]
      ) {
        mainTimeline.add(
          eclipseSwap(
            arrayElementsRef.current[0] as HTMLElement,
            arrayElementsRef.current[i] as HTMLElement
          )
        );
        // After animation, swap the refs so the visual order matches the logical order
        mainTimeline.call(() => {});
        const temp = arrayElementsRef.current[0];
        arrayElementsRef.current[0] = arrayElementsRef.current[i];
        arrayElementsRef.current[i] = temp;
      }
      // // Remove highlight from both nodes after swap
      if (arrayNodeRef.current) {
        mainTimeline.add(removeHighlightNode(0));
        mainTimeline.add(removeHighlightNode(i));
      }
      mainTimeline.add(removeHighlight(0));
      mainTimeline.add(removeHighlight(i));

      // 2. Animate the sorted indicator for the element now at position i
      mainTimeline.add(animateSortedIndicator(i));

      // Print the current order of arrayElementsRef and arrayNodeRef after swap
      // Hide the node with animation
      if (arrayNodeRef.current && arrayNodeRef.current[i]) {
        if (arrayNodeRef.current[i]) {
          mainTimeline.add(
            rotationHideAnimation(arrayNodeRef.current[i] as HTMLDivElement)
          );
        }
      }

      // Then update references in a separate call
      mainTimeline.call(() => {
        // Remove the node from arrayNodeRef after hiding
        if (arrayNodeRef.current && arrayNodeRef.current[i]) {
          arrayNodeRef.current[i] = null; // Don't splice, just nullify
        }
      });

      // Add heapify outside the call

      // Hide the edge connecting the last node (i) and its parent in the heap tree
      // This may not be working because Map.get([parentIndex, i]) will not match unless the exact same array reference is used as the key.
      // In JavaScript, [1,2] !== [1,2] (different references), so .get([parentIndex, i]) will always return undefined unless the same array object was used as the key.
      // Instead, use a string key or another unique identifier for the edge.
      // For example, if you store edges with a string key like `${parentIndex},${i}`:

      if (i > 0 && svgRef.current && edgeRefs.current) {
        const parentIndex = Math.floor((i - 1) / 2);

        // Use a string key for the edge map
        const edgeKey = `${parentIndex},${i}`;
        const edge = edgeRefs.current.get(edgeKey);
        if (edge) {
          const parentPos = getNodePosition(parentIndex, arr.length);
          const childPos = getNodePosition(i, arr.length);
          const svgRect = svgRef.current.getBoundingClientRect();
          const x1 = parentPos.x - svgRect.left;
          const y1 = parentPos.y - svgRect.top;
          const x2 = childPos.x - svgRect.left;
          const y2 = childPos.y - svgRect.top;
          mainTimeline.add(animateEdgeCompress(edge, x1, y1, x2, y2, 0.5));
        }
      }
      {
        const thisStep = stepIndex;
        mainTimeline.addLabel(`step-${thisStep}`);
        mainTimeline.call(() => {
          currentStepRef.current = thisStep;
        });
        stepIndex++;
      }
      // Remove the node from arrayNodeRef and the edge from edgeRefs after hiding
      mainTimeline.add(heapify(arr, i, 0));
    }

    // Animate the sorted indicator for the first element (index 0)
    mainTimeline.add(animateSortedIndicator(0));
    {
      const thisStep = stepIndex;
      mainTimeline.addLabel(`step-${thisStep}`);
      mainTimeline.call(() => {
        currentStepRef.current = thisStep;
      });
      stepIndex++;
    }

    // Animate hiding the first node (index 0) using rotationHideAnimation
    if (arrayNodeRef.current && arrayNodeRef.current[0]) {
      mainTimeline.add(
        rotationHideAnimation(arrayNodeRef.current[0] as HTMLDivElement)
      );
    }
    if (heapTreeLabelRef.current) {
      mainTimeline.add(
        gsap.to(heapTreeLabelRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        })
      );
    }

    if (arrayElementsRef.current) {
      const elements = arrayElementsRef.current.filter(Boolean);
      mainTimeline.add(
        gsap.to(elements, {
          // x: 0,
          y: 0,
          duration: 1,
          ease: "power1.inOut",
          stagger: 0.1,
        })
      );
    }

    totalStepsRef.current = stepIndex;
    currentStepRef.current = 0;
    mainTimeline.addLabel("end");

    timelineRef.current = mainTimeline;
    // ... (rest of animation logic for edges and other nodes)
  };
  const nextStep = (): void => {
    console.log("Current step:", currentStepRef.current);
    console.log("Total steps:", totalStepsRef.current);
    if (!timelineRef.current) {
      playAnimation();
      if (timelineRef.current) {
        (timelineRef.current as gsap.core.Timeline).pause();
        currentStepRef.current = 0;
        (timelineRef.current as gsap.core.Timeline).play(`step-${0}`);
        currentStepRef.current = 1;
        (timelineRef.current as gsap.core.Timeline).addPause(`step-${1}`);
        wasPausedRef.current = true;
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
          // Reset speed back to original and resume playing using setTimeout
          // to break out of the current call stack
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

      // Increase the animation speed by increasing the timeScale of the timeline
      timelineRef.current.reverse();
      // timelineRef.current.seek(prevLabel);
      timelineRef.current.pause(prevLabel);
      if (timelineRef.current) {
        timelineRef.current.timeScale(temp);
      }
      wasPausedRef.current = true;
    }
  };

  // Control handlers
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
    setArray(newArray);
    setIsPlaying(false);
    resetAnimation();
  };

  const handleArraySizeChange = (newSize: number): void => {
    setArraySize(newSize);
  };

  const handleSortOrderChange = (ascending: boolean): void => {
    setIsAscending(ascending);
    setIsPlaying(false);
    resetAnimation();
  };

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
  };

  // Effects
  useEffect(() => {
    propsRef.current = { array, speed, isAscending, isPlaying };
    if (timelineRef.current) {
      timelineRef.current.timeScale(speed);
    }
  }, [array, speed, isAscending, isPlaying]);

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

  // Handle sidebar toggle changes with slide animation
  useEffect(() => {
    const svg = document.getElementById(
      "heap-tree-svg"
    ) as SVGSVGElement | null;
    const label = document.getElementById(
      "heap-tree-label"
    ) as HTMLDivElement | null;

    if (svg) {
      const fromLeft = svg.style.left || "50%";
      const toLeft = isOpen ? `calc(50% + ${width / 2}px)` : "50%";
      gsap.fromTo(
        svg,
        { left: fromLeft },
        {
          left: toLeft,
          duration: 0.3,
          ease: "power1.inOut",
        }
      );
    }

    if (label) {
      const fromLeft = label.style.left || "50%";
      const toLeft = isOpen ? `calc(50% + ${width / 2}px)` : "50%";
      gsap.fromTo(
        label,
        { left: fromLeft },
        {
          left: toLeft,
          duration: 0.3,
          ease: "power1.inOut",
        }
      );
    }

    // Update node positions when sidebar state changes
    if (arrayNodeRef.current.length) {
      arrayNodeRef.current.forEach((node, index) => {
        if (node && node.parentNode) {
          const { x, y } = getNodePosition(index, array.length); // This already accounts for sidebar state

          gsap.to(node, {
            left: `${x - NODE_RADIUS}px`, // Just use the calculated position with radius offset
            top: `${y - NODE_RADIUS}px`, // Also update top if needed
            duration: 0,
            ease: "power1.inOut",
          });
        }
      });
    }
  }, [isOpen, width]);

  return (
    <div>
      {/* Animation Container */}
      <div className="mb-8">
        <div
          ref={containerRef}
          className="heapsort-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
            minHeight: array.length > 9 ? "400px" : "200px",
            zIndex: 0,
          }}
        >
          {/* Array Elements (Centered) */}
          <div
            className="array-container"
            style={{
              display: "flex",
              gap: `${BOX_GAP}px`,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {array.map((value, index) => (
              <div
                key={`array-${index}-${value}`}
                ref={(el) => {
                  arrayElementsRef.current[index] = el;
                }}
                className={`array-element array-element-${index}`}
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
                  zIndex: 2,
                }}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heap Tree Label */}
      <div
        ref={heapTreeLabelRef}
        style={{
          position: "absolute",
          left: isOpen ? `calc(50% + ${width / 2}px)` : "50%",
          top: "22%",
          transform: "translateX(-50%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "18px",
          fontWeight: "600",
          color: "#000000",
          opacity: 0,
          zIndex: 1001,
        }}
      >
        Heap Tree
      </div>

      {/* Heap Tree SVG */}
      <svg
        ref={svgRef}
        // id="heap-tree-svg"
        style={{
          position: "absolute",
          left: isOpen ? `calc(50% + ${width / 2}px)` : "50%",
          top: "200px",
          transform: "translateX(-50%)",
          width: "70%",
          height: array.length > 9 ? "60%" : "50%",
          border: "2px solid #e9ecef",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          pointerEvents: "none",
          opacity: 1,
        }}
      >
        {/* SVG content will be dynamically added here */}
      </svg>

      {/* Controls */}
      <SortingControls
        isOpen={isOpen}
        width={width}
        array={array}
        arraySize={arraySize}
        isAscending={isAscending}
        speed={speed}
        isPlaying={isPlaying}
        onArrayChange={handleArrayChange}
        onArraySizeChange={handleArraySizeChange}
        onSortOrderChange={handleSortOrderChange}
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

export default HeapSort;
