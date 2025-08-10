"use client";
import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Paperclip,
  Plus,
  Sparkles,
  Copy,
  RotateCcw,
  ArrowUp,
  Database,
  GitBranch,
  Layers,
  Network,
  Zap,
  Palette,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

type Theme =
  | "default"
  | "nature"
  | "sunset"
  | "midnight"
  | "ocean"
  | "rose"
  | "forest"
  | "galaxy"
  | "azure"
  | "emerald"
  | "coral"
  | "arctic"
  | "volcano"
  | "neon"
  | "holographic"
  | "vintage";

const themes = {
  default: {
    name: "Default",
    primary: "from-indigo-500 to-purple-600",
    primaryHover: "from-indigo-600 to-purple-700",
    accent: "indigo",
    background: "bg-white",
    text: "text-black",
    border: "border-gray-200",
    hover: "hover:border-indigo-300",
    pill: "hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300",
    iconColor: "text-indigo-600",
  },
  nature: {
    name: "Nature",
    primary: "from-emerald-500 to-teal-600",
    primaryHover: "from-emerald-600 to-teal-700",
    accent: "emerald",
    background: "bg-white",
    text: "text-black",
    border: "border-gray-200",
    hover: "hover:border-emerald-300",
    pill: "hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300",
    iconColor: "text-emerald-600",
  },
  sunset: {
    name: "Sunset",
    primary: "from-orange-500 to-red-500",
    primaryHover: "from-orange-600 to-red-600",
    accent: "orange",
    background: "bg-white",
    text: "text-black",
    border: "border-gray-200",
    hover: "hover:border-orange-300",
    pill: "hover:from-orange-50 hover:to-red-50 hover:border-orange-300",
    iconColor: "text-orange-600",
  },
  midnight: {
    name: "Midnight",
    primary: "from-cyan-400 to-blue-500",
    primaryHover: "from-cyan-500 to-blue-600",
    accent: "cyan",
    background: "bg-slate-900",
    text: "text-white",
    border: "border-slate-700",
    hover: "hover:border-cyan-400",
    pill: "hover:from-cyan-950 hover:to-blue-950 hover:border-cyan-400",
    iconColor: "text-cyan-400",
  },
  ocean: {
    name: "Ocean",
    primary: "from-blue-500 to-teal-500",
    primaryHover: "from-blue-600 to-teal-600",
    accent: "blue",
    background: "bg-white",
    text: "text-black",
    border: "border-gray-200",
    hover: "hover:border-blue-300",
    pill: "hover:from-blue-50 hover:to-teal-50 hover:border-blue-300",
    iconColor: "text-blue-600",
  },
  rose: {
    name: "Rose",
    primary: "from-pink-500 to-rose-500",
    primaryHover: "from-pink-600 to-rose-600",
    accent: "pink",
    background: "bg-white",
    text: "text-black",
    border: "border-gray-200",
    hover: "hover:border-pink-300",
    pill: "hover:from-pink-50 hover:to-rose-50 hover:border-pink-300",
    iconColor: "text-pink-600",
  },
  forest: {
    name: "Forest",
    primary: "from-green-500 to-lime-500",
    primaryHover: "from-green-600 to-lime-600",
    accent: "green",
    background: "bg-white",
    text: "text-black",
    border: "border-gray-200",
    hover: "hover:border-green-300",
    pill: "hover:from-green-50 hover:to-lime-50 hover:border-green-300",
    iconColor: "text-green-600",
  },
  galaxy: {
    name: "Galaxy",
    primary: "from-purple-400 to-pink-400",
    primaryHover: "from-purple-500 to-pink-500",
    accent: "purple",
    background: "bg-gray-900",
    text: "text-white",
    border: "border-gray-700",
    hover: "hover:border-purple-400",
    pill: "hover:from-purple-950 hover:to-pink-950 hover:border-purple-400",
    iconColor: "text-purple-400",
  },
  azure: {
    name: "Azure",
    primary: "from-blue-500 to-blue-700",
    primaryHover: "from-blue-600 to-blue-800",
    accent: "blue",
    background: "bg-white",
    text: "text-black",
    border: "border-blue-200",
    hover: "hover:border-blue-400",
    pill: "hover:from-blue-50 hover:to-blue-50 hover:border-blue-400",
    iconColor: "text-blue-600",
  },
  emerald: {
    name: "Emerald",
    primary: "from-green-500 to-green-700",
    primaryHover: "from-green-600 to-green-800",
    accent: "green",
    background: "bg-white",
    text: "text-black",
    border: "border-green-200",
    hover: "hover:border-green-400",
    pill: "hover:from-green-50 hover:to-green-50 hover:border-green-400",
    iconColor: "text-green-600",
  },
  coral: {
    name: "Coral",
    primary: "from-orange-500 to-pink-500",
    primaryHover: "from-orange-600 to-pink-600",
    accent: "orange",
    background: "bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50",
    text: "text-gray-800",
    border: "border-orange-200",
    hover: "hover:border-orange-400",
    pill: "hover:from-orange-50 hover:to-pink-50 hover:border-orange-400",
    iconColor: "text-orange-600",
  },
  arctic: {
    name: "Arctic",
    primary: "from-slate-400 to-blue-300",
    primaryHover: "from-slate-500 to-blue-400",
    accent: "slate",
    background: "bg-gradient-to-br from-slate-50 via-blue-50 to-white",
    text: "text-slate-800",
    border: "border-slate-300",
    hover: "hover:border-slate-400",
    pill: "hover:from-slate-50 hover:to-blue-50 hover:border-slate-400",
    iconColor: "text-slate-600",
  },
  volcano: {
    name: "Volcano",
    primary: "from-red-600 to-yellow-500",
    primaryHover: "from-red-700 to-yellow-600",
    accent: "red",
    background: "bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50",
    text: "text-red-900",
    border: "border-red-300",
    hover: "hover:border-red-400",
    pill: "hover:from-red-50 hover:to-yellow-50 hover:border-red-400",
    iconColor: "text-red-600",
  },
  neon: {
    name: "Neon",
    primary: "from-lime-400 to-cyan-400",
    primaryHover: "from-lime-500 to-cyan-500",
    accent: "lime",
    background: "bg-black",
    text: "text-lime-400",
    border: "border-lime-500",
    hover: "hover:border-lime-400",
    pill: "hover:from-lime-950 hover:to-cyan-950 hover:border-lime-400",
    iconColor: "text-lime-400",
  },
  // My 2 best themes
  holographic: {
    name: "Holographic",
    primary: "from-purple-500 via-pink-500 via-blue-500 to-cyan-500",
    primaryHover: "from-purple-600 via-pink-600 via-blue-600 to-cyan-600",
    accent: "purple",
    background: "bg-gradient-to-br from-purple-900 via-blue-900 to-black",
    text: "text-white",
    border: "border-purple-400",
    hover: "hover:border-pink-400",
    pill: "hover:from-purple-900 hover:to-blue-900 hover:border-purple-400",
    iconColor: "text-purple-400",
  },
  vintage: {
    name: "Vintage",
    primary: "from-amber-600 to-orange-700",
    primaryHover: "from-amber-700 to-orange-800",
    accent: "amber",
    background: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50",
    text: "text-amber-900",
    border: "border-amber-300",
    hover: "hover:border-amber-400",
    pill: "hover:from-amber-100 hover:to-orange-100 hover:border-amber-400",
    iconColor: "text-amber-700",
  },
};

export default function AINotesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>("default");
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const initialInputRef = useRef<HTMLTextAreaElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const theme = themes[currentTheme];

  useEffect(() => {
    // Initial animation for welcome screen
    if (!hasStartedChat && welcomeRef.current) {
      gsap.fromTo(
        welcomeRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [hasStartedChat]);

  // Holographic animation effect
  useEffect(() => {
    if (currentTheme === "holographic") {
      const interval = setInterval(() => {
        const holoElements = document.querySelectorAll(".holo-animate");
        holoElements.forEach((el) => {
          const element = el as HTMLElement;
          element.style.backgroundPosition = `${Math.random() * 100}% ${
            Math.random() * 100
          }%`;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentTheme]);

  const scrollToLatestMessage = useCallback(() => {
    if (chatContainerRef.current) {
      const scrollContainer = chatContainerRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        const messageElements =
          scrollContainer.querySelectorAll(".message-item");
        const lastMessage = messageElements[messageElements.length - 1];
        if (lastMessage) {
          const containerTop = scrollContainer.scrollTop;
          const messageTop = (lastMessage as HTMLElement).offsetTop;
          scrollContainer.scrollTop = messageTop - 20;
        }
      }
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      content:
        "Great choice! I'd be happy to help you create comprehensive notes on that topic. Let me break down the key concepts, provide examples, and organize the information in a way that's easy to understand and remember. What specific aspects would you like to focus on?",
      sender: "ai",
      timestamp: new Date(),
    };

    if (!hasStartedChat) {
      setHasStartedChat(true);
      if (welcomeRef.current) {
        gsap.to(welcomeRef.current, {
          y: -100,
          opacity: 0,
          duration: 0.6,
          ease: "power3.in",
        });
      }
      setTimeout(() => {
        setMessages([userMessage, aiResponse]);
        if (chatAreaRef.current) {
          gsap.fromTo(
            chatAreaRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
          );
        }
      }, 300);
    } else {
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => {
        setMessages((prev) => [...prev, aiResponse]);
      }, 800);
    }

    setMessage("");
    setTimeout(scrollToLatestMessage, 400);
  }, [message, hasStartedChat, scrollToLatestMessage]);

  const dsaTopics = [
    { icon: Database, label: "Arrays" },
    { icon: GitBranch, label: "Linked Lists" },
    { icon: Layers, label: "Trees" },
    { icon: Network, label: "Graphs" },
    { icon: Zap, label: "Dynamic Programming" },
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Theme-specific geometric icons
  const GeometricIcon = () => {
    const getGradientColors = () => {
      switch (currentTheme) {
        case "nature":
          return { start: "#10b981", middle: "#14b8a6", end: "#06b6d4" };
        case "sunset":
          return { start: "#f97316", middle: "#ef4444", end: "#dc2626" };
        case "midnight":
          return { start: "#22d3ee", middle: "#3b82f6", end: "#1d4ed8" };
        case "ocean":
          return { start: "#3b82f6", middle: "#06b6d4", end: "#14b8a6" };
        case "rose":
          return { start: "#ec4899", middle: "#f43f5e", end: "#e11d48" };
        case "forest":
          return { start: "#22c55e", middle: "#65a30d", end: "#84cc16" };
        case "galaxy":
          return { start: "#a855f7", middle: "#d946ef", end: "#f472b6" };
        case "azure":
          return { start: "#1e40af", middle: "#3b82f6", end: "#60a5fa" };
        case "emerald":
          return { start: "#059669", middle: "#10b981", end: "#34d399" };
        case "coral":
          return { start: "#fbbf24", middle: "#f97316", end: "#dc2626" };
        case "arctic":
          return { start: "#64748b", middle: "#93c5fd", end: "#e2e8f0" };
        case "volcano":
          return { start: "#dc2626", middle: "#f97316", end: "#eab308" };
        case "neon":
          return { start: "#84cc16", middle: "#22d3ee", end: "#06b6d4" };
        case "holographic":
          return { start: "#a855f7", middle: "#ec4899", end: "#06b6d4" };
        case "vintage":
          return { start: "#d97706", middle: "#ea580c", end: "#dc2626" };
        default:
          return { start: "#6366f1", middle: "#8b5cf6", end: "#a855f7" };
      }
    };

    const colors = getGradientColors();
    const gradientId = `${currentTheme}Gradient`;

    return (
      <div className="w-8 h-8 relative">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="50%" stopColor={colors.middle} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
            <radialGradient
              id={`${gradientId}Radial`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="50%" stopColor={colors.middle} />
              <stop offset="100%" stopColor={colors.end} />
            </radialGradient>
            {/* Holographic gradient */}
            <linearGradient
              id="holoGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="25%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="75%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Vintage pattern */}
            <pattern
              id="vintagePattern"
              x="0"
              y="0"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="#d97706" opacity="0.1" />
              <circle cx="2" cy="2" r="0.5" fill="#ea580c" opacity="0.3" />
            </pattern>
          </defs>

          {/* Default - Hexagon with inner hexagon */}
          {currentTheme === "default" && (
            <>
              <path
                d="M16 2 L28 10 L28 22 L16 30 L4 22 L4 10 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M16 6 L24 12 L24 20 L16 26 L8 20 L8 12 Z"
                fill="rgba(255,255,255,0.2)"
                stroke="none"
              />
            </>
          )}

          {/* Nature - Hexagon with circle */}
          {currentTheme === "nature" && (
            <>
              <path
                d="M16 2 L28 10 L28 22 L16 30 L4 22 L4 10 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <circle cx="16" cy="16" r="6" fill="rgba(255,255,255,0.3)" />
            </>
          )}

          {/* Sunset - Diamond with inner diamond */}
          {currentTheme === "sunset" && (
            <>
              <path
                d="M16 2 L30 16 L16 30 L2 16 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M16 6 L26 16 L16 26 L6 16 Z"
                fill="rgba(255,255,255,0.2)"
                stroke="none"
              />
            </>
          )}

          {/* Midnight - Rounded square with inner pattern */}
          {currentTheme === "midnight" && (
            <>
              <path
                d="M8 4 L24 4 L28 8 L28 24 L24 28 L8 28 L4 24 L4 8 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M12 8 L20 8 L24 12 L24 20 L20 24 L12 24 L8 20 L8 12 Z"
                fill="rgba(255,255,255,0.2)"
                stroke="none"
              />
            </>
          )}

          {/* Ocean - Wave pattern */}
          {currentTheme === "ocean" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M4 16 Q8 12 12 16 T20 16 T28 16"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M4 20 Q8 16 12 20 T20 20 T28 20"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M4 12 Q8 8 12 12 T20 12 T28 12"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                fill="none"
              />
            </>
          )}

          {/* Rose - Flower/petal pattern */}
          {currentTheme === "rose" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M16 6 Q20 10 16 16 Q12 10 16 6"
                fill="rgba(255,255,255,0.3)"
              />
              <path
                d="M26 16 Q22 12 16 16 Q22 20 26 16"
                fill="rgba(255,255,255,0.3)"
              />
              <path
                d="M16 26 Q12 22 16 16 Q20 22 16 26"
                fill="rgba(255,255,255,0.3)"
              />
              <path
                d="M6 16 Q10 20 16 16 Q10 12 6 16"
                fill="rgba(255,255,255,0.3)"
              />
              <circle cx="16" cy="16" r="3" fill="rgba(255,255,255,0.5)" />
            </>
          )}

          {/* Forest - Tree/triangular pattern */}
          {currentTheme === "forest" && (
            <>
              <path
                d="M16 2 L28 16 L20 16 L26 26 L6 26 L12 16 L4 16 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M16 6 L24 16 L18 16 L22 22 L10 22 L14 16 L8 16 Z"
                fill="rgba(255,255,255,0.2)"
                stroke="none"
              />
              <rect
                x="14"
                y="22"
                width="4"
                height="6"
                fill="rgba(255,255,255,0.3)"
              />
            </>
          )}

          {/* Galaxy - Star/cosmic pattern */}
          {currentTheme === "galaxy" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M16 4 L18 12 L26 10 L20 16 L28 18 L20 20 L26 22 L18 20 L16 28 L14 20 L6 22 L12 16 L4 14 L12 12 L6 10 L14 12 Z"
                fill="rgba(255,255,255,0.4)"
                stroke="none"
              />
              <circle cx="16" cy="16" r="2" fill="rgba(255,255,255,0.8)" />
              <circle cx="12" cy="8" r="1" fill="rgba(255,255,255,0.6)" />
              <circle cx="24" cy="12" r="1" fill="rgba(255,255,255,0.6)" />
              <circle cx="8" cy="24" r="1" fill="rgba(255,255,255,0.6)" />
              <circle cx="20" cy="24" r="1" fill="rgba(255,255,255,0.6)" />
            </>
          )}

          {/* Azure - Hexagon with circle */}
          {currentTheme === "azure" && (
            <>
              <path
                d="M16 4 L26 10 L26 22 L16 28 L6 22 L6 10 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.9)" />
            </>
          )}

          {/* Emerald - Leaf/nature design */}
          {currentTheme === "emerald" && (
            <>
              <path
                d="M16 4 C24 4 28 12 28 16 C28 20 24 28 16 28 C8 28 4 20 4 16 C4 12 8 4 16 4 Z"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M12 12 L16 8 L20 12 L16 20 Z"
                fill="rgba(255,255,255,0.9)"
              />
            </>
          )}

          {/* Coral - Radial gradient with diamond */}
          {currentTheme === "coral" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId}Radial)`}
                stroke="none"
              />
              <path
                d="M8 16 L16 8 L24 16 L16 24 Z"
                fill="rgba(255,255,255,0.3)"
              />
              <circle cx="16" cy="16" r="3" fill="rgba(255,255,255,0.8)" />
            </>
          )}

          {/* Arctic - Crystalline/ice pattern */}
          {currentTheme === "arctic" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M16 4 L16 28 M4 16 L28 16 M8 8 L24 24 M24 8 L8 24"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
              />
              <circle
                cx="16"
                cy="16"
                r="6"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <circle cx="16" cy="16" r="3" fill="rgba(255,255,255,0.8)" />
              <circle cx="16" cy="8" r="1.5" fill="rgba(255,255,255,0.7)" />
              <circle cx="16" cy="24" r="1.5" fill="rgba(255,255,255,0.7)" />
              <circle cx="8" cy="16" r="1.5" fill="rgba(255,255,255,0.7)" />
              <circle cx="24" cy="16" r="1.5" fill="rgba(255,255,255,0.7)" />
            </>
          )}

          {/* Volcano - Mountain/lava pattern */}
          {currentTheme === "volcano" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M4 24 L8 16 L12 20 L16 8 L20 20 L24 16 L28 24 Z"
                fill="rgba(255,255,255,0.3)"
              />
              <path
                d="M14 12 L16 8 L18 12 L16 16 Z"
                fill="rgba(255,255,255,0.5)"
              />
              <circle cx="16" cy="10" r="2" fill="rgba(255,255,255,0.8)" />
              <path
                d="M14 14 Q16 12 18 14"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M13 18 Q16 16 19 18"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
                fill="none"
              />
            </>
          )}

          {/* Neon - Circuit/tech pattern */}
          {currentTheme === "neon" && (
            <>
              <rect
                x="2"
                y="2"
                width="28"
                height="28"
                rx="4"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path
                d="M6 16 L10 16 L10 12 L14 12 L14 16 L18 16 L18 12 L22 12 L22 16 L26 16"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M6 20 L10 20 L10 24 L14 24 L14 20 L18 20 L18 24 L22 24 L22 20 L26 20"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="8" cy="16" r="2" fill="rgba(0,0,0,0.5)" />
              <circle cx="16" cy="12" r="2" fill="rgba(0,0,0,0.5)" />
              <circle cx="24" cy="16" r="2" fill="rgba(0,0,0,0.5)" />
              <circle cx="16" cy="24" r="2" fill="rgba(0,0,0,0.5)" />
              <rect x="14" y="14" width="4" height="4" fill="rgba(0,0,0,0.6)" />
            </>
          )}

          {/* Holographic - 3D prismatic design with animated effects */}
          {currentTheme === "holographic" && (
            <>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="url(#holoGradient)"
                stroke="none"
                filter="url(#glow)"
              />
              <path
                d="M16 4 L28 12 L24 16 L28 20 L16 28 L4 20 L8 16 L4 12 Z"
                fill="rgba(255,255,255,0.2)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <path
                d="M16 8 L24 14 L20 16 L24 18 L16 24 L8 18 L12 16 L8 14 Z"
                fill="rgba(255,255,255,0.3)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
              />
              <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.8)" />
              <circle cx="16" cy="16" r="2" fill="rgba(255,255,255,1)" />
            </>
          )}

          {/* Vintage - Ornate decorative design */}
          {currentTheme === "vintage" && (
            <>
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="url(#vintagePattern)"
                stroke="none"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill={`url(#${gradientId})`}
                stroke="none"
                opacity="0.8"
              />
              <path
                d="M16 4 C20 4 24 8 24 12 C28 12 28 20 24 20 C24 24 20 28 16 28 C12 28 8 24 8 20 C4 20 4 12 8 12 C8 8 12 4 16 4 Z"
                fill="rgba(255,255,255,0.3)"
                stroke="rgba(139,69,19,0.5)"
                strokeWidth="1"
              />
              <circle
                cx="16"
                cy="16"
                r="8"
                fill="none"
                stroke="rgba(139,69,19,0.4)"
                strokeWidth="1"
              />
              <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.6)" />
              <path
                d="M12 12 L20 12 L20 20 L12 20 Z"
                fill="none"
                stroke="rgba(139,69,19,0.3)"
                strokeWidth="1"
              />
              <circle cx="12" cy="12" r="1" fill="rgba(139,69,19,0.5)" />
              <circle cx="20" cy="12" r="1" fill="rgba(139,69,19,0.5)" />
              <circle cx="20" cy="20" r="1" fill="rgba(139,69,19,0.5)" />
              <circle cx="12" cy="20" r="1" fill="rgba(139,69,19,0.5)" />
            </>
          )}
        </svg>
      </div>
    );
  };

  const ThemeSelector = () => (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className={`p-3 rounded-lg shadow-lg border-2 ${
            currentTheme === "midnight" ||
            currentTheme === "galaxy" ||
            currentTheme === "neon" ||
            currentTheme === "holographic"
              ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
              : currentTheme === "vintage"
              ? "bg-amber-100 border-amber-400 hover:bg-amber-200 text-amber-900 shadow-xl"
              : "bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          } ${
            currentTheme === "holographic"
              ? "holo-animate bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white border-purple-400"
              : ""
          }`}
        >
          <Palette className="w-5 h-5" />
          <span
            className={`ml-2 text-sm font-medium ${
              currentTheme === "vintage" ? "font-serif" : ""
            }`}
          >
            Themes
          </span>
        </Button>

        {showThemeSelector && (
          <div
            className={`absolute top-14 right-0 ${
              currentTheme === "midnight" ||
              currentTheme === "galaxy" ||
              currentTheme === "neon" ||
              currentTheme === "holographic"
                ? "bg-slate-800 border-slate-600"
                : currentTheme === "vintage"
                ? "bg-amber-50 border-amber-300"
                : "bg-white border-gray-300"
            } border-2 rounded-lg shadow-xl p-3 min-w-[220px] max-h-[600px] overflow-y-auto z-50`}
          >
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(themes).map(([key, themeData]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key as Theme);
                    setShowThemeSelector(false);
                  }}
                  className={`text-left px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentTheme === key
                      ? key === "holographic"
                        ? "bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white shadow-lg"
                        : `bg-gradient-to-r ${themeData.primary} text-white shadow-md`
                      : currentTheme === "midnight" ||
                        currentTheme === "galaxy" ||
                        currentTheme === "neon" ||
                        currentTheme === "holographic"
                      ? "hover:bg-slate-700 text-white"
                      : currentTheme === "vintage"
                      ? "hover:bg-amber-100 text-amber-900"
                      : "hover:bg-gray-100 text-gray-700"
                  } ${key === "vintage" ? "font-serif" : ""}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{
                        background:
                          key === "nature"
                            ? "linear-gradient(45deg, #10b981, #14b8a6)"
                            : key === "sunset"
                            ? "linear-gradient(45deg, #f97316, #ef4444)"
                            : key === "midnight"
                            ? "linear-gradient(45deg, #22d3ee, #3b82f6)"
                            : key === "ocean"
                            ? "linear-gradient(45deg, #3b82f6, #06b6d4)"
                            : key === "rose"
                            ? "linear-gradient(45deg, #ec4899, #f43f5e)"
                            : key === "forest"
                            ? "linear-gradient(45deg, #22c55e, #65a30d)"
                            : key === "galaxy"
                            ? "linear-gradient(45deg, #a855f7, #d946ef)"
                            : key === "azure"
                            ? "linear-gradient(45deg, #1e40af, #3b82f6)"
                            : key === "emerald"
                            ? "linear-gradient(45deg, #059669, #10b981)"
                            : key === "coral"
                            ? "radial-gradient(circle, #fbbf24, #f97316)"
                            : key === "arctic"
                            ? "linear-gradient(45deg, #64748b, #93c5fd)"
                            : key === "volcano"
                            ? "linear-gradient(45deg, #dc2626, #eab308)"
                            : key === "neon"
                            ? "linear-gradient(45deg, #84cc16, #22d3ee)"
                            : key === "holographic"
                            ? "linear-gradient(45deg, #a855f7, #ec4899, #3b82f6, #06b6d4)"
                            : key === "vintage"
                            ? "linear-gradient(45deg, #d97706, #ea580c)"
                            : "linear-gradient(45deg, #6366f1, #8b5cf6)",
                      }}
                    ></div>
                    <span className="text-xs">{themeData.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const isDarkTheme =
    currentTheme === "midnight" ||
    currentTheme === "galaxy" ||
    currentTheme === "neon" ||
    currentTheme === "holographic";
  const isCoralTheme = currentTheme === "coral";
  const isSpecialBgTheme =
    currentTheme === "coral" ||
    currentTheme === "arctic" ||
    currentTheme === "volcano" ||
    currentTheme === "holographic" ||
    currentTheme === "vintage";

  return (
    <div
      className={`flex flex-col h-screen ${
        theme.background
      } transition-colors duration-300 ${
        currentTheme === "holographic" ? "relative overflow-hidden" : ""
      }`}
    >
      {/* Holographic animated background */}
      {currentTheme === "holographic" && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 via-blue-500 to-cyan-500 holo-animate"
            style={{
              backgroundSize: "400% 400%",
              animation: "gradient 8s ease infinite",
            }}
          />
        </div>
      )}

      {/* Vintage paper texture */}
      {currentTheme === "vintage" && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139,69,19,0.1) 0%, transparent 50%), 
                                radial-gradient(circle at 80% 20%, rgba(139,69,19,0.1) 0%, transparent 50%),
                                radial-gradient(circle at 40% 80%, rgba(139,69,19,0.1) 0%, transparent 50%)`,
          }}
        />
      )}

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <ThemeSelector />

      {/* Welcome Screen */}
      {!hasStartedChat && (
        <div
          ref={welcomeRef}
          className="flex-1 flex flex-col items-center justify-center px-6 relative z-10"
        >
          {/* Welcome message */}
          <div className="flex items-center mb-12">
            <div className="mr-4">
              <GeometricIcon />
            </div>
            <h1
              className={`text-3xl font-normal ${
                isCoralTheme
                  ? "bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
                  : currentTheme === "volcano"
                  ? "bg-gradient-to-r from-red-700 to-yellow-600 bg-clip-text text-transparent"
                  : currentTheme === "holographic"
                  ? "bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold"
                  : currentTheme === "vintage"
                  ? "font-serif text-amber-900 drop-shadow-sm"
                  : theme.text
              }`}
            >
              Ready to create notes?
            </h1>
          </div>

          {/* Input box */}
          <div className="w-full max-w-2xl mb-8">
            <div
              className={`relative ${
                isDarkTheme
                  ? currentTheme === "holographic"
                    ? "bg-black/50 backdrop-blur-xl border-purple-400/50"
                    : "bg-slate-800"
                  : isCoralTheme
                  ? "bg-white/80 backdrop-blur-sm"
                  : currentTheme === "arctic"
                  ? "bg-white/90 backdrop-blur-sm"
                  : currentTheme === "volcano"
                  ? "bg-white/85 backdrop-blur-sm"
                  : currentTheme === "vintage"
                  ? "bg-amber-50/90 backdrop-blur-sm border-amber-300 shadow-xl"
                  : "bg-white"
              } rounded-2xl border-2 ${theme.border} shadow-lg ${
                theme.hover
              } transition-colors ${
                currentTheme === "holographic"
                  ? "shadow-purple-500/25 shadow-2xl"
                  : ""
              } ${currentTheme === "vintage" ? "shadow-amber-200/50" : ""}`}
            >
              <textarea
                ref={initialInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Which topics notes would you like to make?"
                className={`w-full px-6 py-4 ${theme.text} ${
                  isDarkTheme ? "placeholder-gray-400" : "placeholder-gray-500"
                } bg-transparent border-none outline-none resize-none rounded-2xl min-h-[60px] max-h-[200px] ${
                  currentTheme === "vintage" ? "font-serif" : ""
                }`}
                rows={1}
                style={{ lineHeight: "1.5" }}
              />
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 rounded-lg ${
                      isDarkTheme
                        ? currentTheme === "holographic"
                          ? "hover:bg-purple-500/20"
                          : "hover:bg-slate-700"
                        : isCoralTheme
                        ? "hover:bg-orange-100"
                        : currentTheme === "arctic"
                        ? "hover:bg-slate-100"
                        : currentTheme === "volcano"
                        ? "hover:bg-red-100"
                        : currentTheme === "vintage"
                        ? "hover:bg-amber-100"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Plus
                      className={`w-4 h-4 ${
                        isDarkTheme ? "text-gray-400" : theme.iconColor
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 rounded-lg ${
                      isDarkTheme
                        ? currentTheme === "holographic"
                          ? "hover:bg-purple-500/20"
                          : "hover:bg-slate-700"
                        : isCoralTheme
                        ? "hover:bg-orange-100"
                        : currentTheme === "arctic"
                        ? "hover:bg-slate-100"
                        : currentTheme === "volcano"
                        ? "hover:bg-red-100"
                        : currentTheme === "vintage"
                        ? "hover:bg-amber-100"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Paperclip
                      className={`w-4 h-4 ${
                        isDarkTheme ? "text-gray-400" : theme.iconColor
                      }`}
                    />
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm ${
                      isDarkTheme
                        ? "text-gray-400"
                        : isCoralTheme
                        ? "text-gray-600"
                        : currentTheme === "arctic"
                        ? "text-slate-600"
                        : currentTheme === "volcano"
                        ? "text-red-700"
                        : currentTheme === "vintage"
                        ? "text-amber-700 font-serif"
                        : "text-gray-500"
                    }`}
                  >
                    using gemini
                  </span>
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className={`w-8 h-8 bg-gradient-to-r ${
                      currentTheme === "holographic"
                        ? "from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 shadow-lg shadow-purple-500/25"
                        : theme.primary + " hover:" + theme.primaryHover
                    } text-white rounded-lg p-0 disabled:bg-gray-200 disabled:text-gray-400 ${
                      isCoralTheme || currentTheme === "vintage"
                        ? "shadow-lg"
                        : ""
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* DSA Topic pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {dsaTopics.map((topic, index) => (
              <Button
                key={index}
                variant="outline"
                className={`${
                  isDarkTheme
                    ? currentTheme === "holographic"
                      ? "bg-black/30 border-purple-400/50 text-white backdrop-blur-xl hover:bg-purple-500/20"
                      : "bg-slate-800 border-slate-700 text-white"
                    : isCoralTheme
                    ? "bg-white/70 backdrop-blur-sm border-orange-200 text-gray-800 shadow-md"
                    : currentTheme === "arctic"
                    ? "bg-white/80 backdrop-blur-sm border-slate-300 text-slate-800 shadow-md"
                    : currentTheme === "volcano"
                    ? "bg-white/75 backdrop-blur-sm border-red-300 text-red-900 shadow-md"
                    : currentTheme === "vintage"
                    ? "bg-amber-50/80 backdrop-blur-sm border-amber-300 text-amber-900 shadow-lg font-serif"
                    : "bg-white border-gray-200 text-black"
                } ${
                  theme.pill
                } rounded-full px-4 py-2 h-auto transition-all duration-200`}
                onClick={() => {
                  setMessage(`Create notes on ${topic.label}`);
                }}
              >
                <topic.icon className={`w-4 h-4 mr-2 ${theme.iconColor}`} />
                {topic.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {hasStartedChat && (
        <div ref={chatAreaRef} className="flex-1 flex flex-col relative z-10">
          {/* Messages */}
          <ScrollArea className="flex-1" ref={chatContainerRef}>
            <div className="max-w-3xl mx-auto px-6 pt-4 pb-8 space-y-8">
              {messages.map((msg, index) => (
                <div key={msg.id} className="message-item">
                  {msg.sender === "user" ? (
                    // User Message
                    <div className="flex items-start space-x-4">
                      <div
                        className={`flex-shrink-0 w-8 h-8 ${
                          isDarkTheme
                            ? currentTheme === "holographic"
                              ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25"
                              : "bg-white text-black"
                            : isCoralTheme
                            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                            : currentTheme === "arctic"
                            ? "bg-gradient-to-r from-slate-400 to-blue-300 text-white shadow-lg"
                            : currentTheme === "volcano"
                            ? "bg-gradient-to-r from-red-600 to-yellow-500 text-white shadow-lg"
                            : currentTheme === "vintage"
                            ? "bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg"
                            : "bg-black text-white"
                        } rounded-full flex items-center justify-center text-sm font-medium`}
                      >
                        U
                      </div>
                      <div className="flex-1">
                        <div
                          className={`inline-block ${
                            isDarkTheme
                              ? currentTheme === "holographic"
                                ? "bg-purple-500/20 border-purple-400/50 backdrop-blur-xl"
                                : "bg-slate-700 border-slate-600"
                              : isCoralTheme
                              ? "bg-gradient-to-r from-orange-100 to-pink-100 border-orange-200 shadow-md"
                              : currentTheme === "arctic"
                              ? "bg-gradient-to-r from-slate-100 to-blue-100 border-slate-300 shadow-md"
                              : currentTheme === "volcano"
                              ? "bg-gradient-to-r from-red-100 to-yellow-100 border-red-300 shadow-md"
                              : currentTheme === "vintage"
                              ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 shadow-lg"
                              : "bg-stone-100 border-stone-200"
                          } border rounded-2xl px-4 py-2 max-w-fit`}
                        >
                          <p
                            className={`${theme.text} leading-relaxed ${
                              currentTheme === "vintage" ? "font-serif" : ""
                            }`}
                          >
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // AI Message
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        <GeometricIcon />
                      </div>
                      <div className="flex-1 space-y-4">
                        <p
                          className={`${theme.text} leading-relaxed ${
                            currentTheme === "vintage" ? "font-serif" : ""
                          }`}
                        >
                          {msg.content}
                        </p>
                        {/* Message Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`p-2 rounded-lg ${
                              isDarkTheme
                                ? currentTheme === "holographic"
                                  ? "hover:bg-purple-500/20"
                                  : "hover:bg-slate-700"
                                : isCoralTheme
                                ? "hover:bg-orange-100"
                                : currentTheme === "arctic"
                                ? "hover:bg-slate-100"
                                : currentTheme === "volcano"
                                ? "hover:bg-red-100"
                                : currentTheme === "vintage"
                                ? "hover:bg-amber-100"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <Copy
                              className={`w-4 h-4 ${
                                isDarkTheme ? "text-gray-400" : theme.iconColor
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`px-3 py-2 rounded-lg ${
                              isDarkTheme
                                ? currentTheme === "holographic"
                                  ? "hover:bg-purple-500/20 text-gray-300"
                                  : "hover:bg-slate-700 text-gray-400"
                                : isCoralTheme
                                ? "hover:bg-orange-100 text-orange-600"
                                : currentTheme === "arctic"
                                ? "hover:bg-slate-100 text-slate-600"
                                : currentTheme === "volcano"
                                ? "hover:bg-red-100 text-red-600"
                                : currentTheme === "vintage"
                                ? "hover:bg-amber-100 text-amber-700 font-serif"
                                : "hover:bg-gray-100 text-gray-500"
                            } text-sm`}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                        {/* Disclaimer */}
                        {index === messages.length - 1 &&
                          msg.sender === "ai" && (
                            <p
                              className={`text-xs mt-4 ${
                                isDarkTheme ? "text-gray-400" : "text-gray-500"
                              } ${
                                currentTheme === "vintage" ? "font-serif" : ""
                              }`}
                            >
                              Gemini can make mistakes. Please double-check
                              responses.
                            </p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom Input */}
          <div
            className={`px-6 py-4 ${
              isCoralTheme
                ? "bg-white/50 backdrop-blur-sm"
                : currentTheme === "arctic"
                ? "bg-white/60 backdrop-blur-sm"
                : currentTheme === "volcano"
                ? "bg-white/55 backdrop-blur-sm"
                : currentTheme === "holographic"
                ? "bg-black/30 backdrop-blur-xl"
                : currentTheme === "vintage"
                ? "bg-amber-50/60 backdrop-blur-sm"
                : theme.background
            } border-t ${theme.border}`}
          >
            <div className="max-w-3xl mx-auto">
              <div
                className={`relative ${
                  isDarkTheme
                    ? currentTheme === "holographic"
                      ? "bg-black/50 backdrop-blur-xl border-purple-400/50"
                      : "bg-slate-800"
                    : isCoralTheme
                    ? "bg-white/80 backdrop-blur-sm"
                    : currentTheme === "arctic"
                    ? "bg-white/90 backdrop-blur-sm"
                    : currentTheme === "volcano"
                    ? "bg-white/85 backdrop-blur-sm"
                    : currentTheme === "vintage"
                    ? "bg-amber-50/90 backdrop-blur-sm border-amber-300 shadow-xl"
                    : "bg-white"
                } rounded-2xl border-2 ${theme.border} shadow-lg ${
                  theme.hover
                } transition-colors ${
                  currentTheme === "holographic"
                    ? "shadow-purple-500/25 shadow-2xl"
                    : ""
                } ${currentTheme === "vintage" ? "shadow-amber-200/50" : ""}`}
              >
                <textarea
                  ref={messageInputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Reply to Gemini..."
                  className={`w-full px-6 py-4 ${theme.text} ${
                    isDarkTheme
                      ? "placeholder-gray-400"
                      : "placeholder-gray-500"
                  } bg-transparent border-none outline-none resize-none rounded-2xl min-h-[60px] max-h-[200px] ${
                    currentTheme === "vintage" ? "font-serif" : ""
                  }`}
                  rows={1}
                  style={{ lineHeight: "1.5" }}
                />
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 rounded-lg ${
                        isDarkTheme
                          ? currentTheme === "holographic"
                            ? "hover:bg-purple-500/20"
                            : "hover:bg-slate-700"
                          : isCoralTheme
                          ? "hover:bg-orange-100"
                          : currentTheme === "arctic"
                          ? "hover:bg-slate-100"
                          : currentTheme === "volcano"
                          ? "hover:bg-red-100"
                          : currentTheme === "vintage"
                          ? "hover:bg-amber-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Plus
                        className={`w-4 h-4 ${
                          isDarkTheme ? "text-gray-400" : theme.iconColor
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 rounded-lg ${
                        isDarkTheme
                          ? currentTheme === "holographic"
                            ? "hover:bg-purple-500/20"
                            : "hover:bg-slate-700"
                          : isCoralTheme
                          ? "hover:bg-orange-100"
                          : currentTheme === "arctic"
                          ? "hover:bg-slate-100"
                          : currentTheme === "volcano"
                          ? "hover:bg-red-100"
                          : currentTheme === "vintage"
                          ? "hover:bg-amber-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Sparkles
                        className={`w-4 h-4 ${
                          isDarkTheme ? "text-gray-400" : theme.iconColor
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-sm ${
                        isDarkTheme
                          ? "text-gray-400"
                          : isCoralTheme
                          ? "text-gray-600"
                          : currentTheme === "arctic"
                          ? "text-slate-600"
                          : currentTheme === "volcano"
                          ? "text-red-700"
                          : currentTheme === "vintage"
                          ? "text-amber-700 font-serif"
                          : "text-gray-500"
                      }`}
                    >
                      using gemini
                    </span>
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      className={`w-8 h-8 bg-gradient-to-r ${
                        currentTheme === "holographic"
                          ? "from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 shadow-lg shadow-purple-500/25"
                          : theme.primary + " hover:" + theme.primaryHover
                      } text-white rounded-lg p-0 disabled:bg-gray-200 disabled:text-gray-400 ${
                        isCoralTheme || currentTheme === "vintage"
                          ? "shadow-lg"
                          : ""
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
