"use client";
import React, { useRef, useState, useEffect } from "react";

interface ControlsProps {
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

const Controls: React.FC<ControlsProps> = ({
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
  // State to track if component has mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);
  // Add state for warning messages
  const [arrayLengthWarning, setArrayLengthWarning] = useState("");
  const [arrayElementsWarning, setArrayElementsWarning] = useState("");
  
  // Use state for input value instead of ref for better control
  const [inputValue, setInputValue] = useState(array.join(", "));

  // Set mounted flag after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update input value when array changes
  useEffect(() => {
    setInputValue(array.join(", "));
  }, [array]);

  // Generate random array (only runs on client after mount)
  const generateRandomArray = () => {
    setArrayElementsWarning(""); // Clear warning
    const newArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * 100) + 1
    );
    onArrayChange(newArray);
    // Input value will be updated by the useEffect above
  };

  // Validation Functions
  const arrayLengthValidator = (length: number): boolean => {
    if (!Number.isInteger(length)) {
      setArrayLengthWarning("Please enter a valid integer");
      return false;
    }
    if (length < 1) {
      setArrayLengthWarning("Array length must be at least 1");
      return false;
    }
    if (length > 16) {
      setArrayLengthWarning("Cannot exceed 16 size");
      return false;
    }
    setArrayLengthWarning(""); // Clear warning
    return true;
  };

  const userArrayValidator = (
    inputString: string
  ): { isValid: boolean; numbers?: number[] } => {
    try {
      if (!inputString.trim()) {
        setArrayElementsWarning("Please enter some numbers");
        return { isValid: false };
      }

      const numbers = inputString
        .split(",")
        .map((str) => {
          const num = parseInt(str.trim());
          if (isNaN(num)) {
            throw new Error("Invalid number format");
          }
          if (num < 1 || num > 100) {
            throw new Error("Numbers must be between 1-100");
          }
          return num;
        })
        .filter((num) => !isNaN(num));

      if (numbers.length === 0) {
        setArrayElementsWarning("No valid numbers found");
        return { isValid: false };
      }

      if (numbers.length > 16) {
        setArrayElementsWarning("Cannot exceed 16 size");
        return { isValid: false };
      }

      setArrayElementsWarning(""); // Clear warning
      return { isValid: true, numbers };
    } catch (error) {
      if (error instanceof Error) {
        setArrayElementsWarning(error.message);
      } else {
        setArrayElementsWarning("Invalid input format");
      }
      return { isValid: false };
    }
  };

  const generateRandomDuplicateArray = () => {
    setArrayElementsWarning(""); // Clear warning
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

    onArrayChange(newArray);
  };

  const handleAscendingSort = () => {
    onSortOrderChange(true);
  };

  const handleDescendingSort = () => {
    onSortOrderChange(false);
  };

  // Event Handlers
  const handlePlay = () => {
    if (!isPlaying) {
      onPlay();
    } else {
      onPause();
    }
  };

  const handleArraySizeChange = (newSize: number) => {
    // Enforce the limit before validation
    if (newSize > 16) {
      setArrayLengthWarning("Cannot exceed 16 size");
      return;
    }
    
    if (!arrayLengthValidator(newSize)) return;
    setArrayElementsWarning("");

    onArraySizeChange(newSize);

    const currentArray = array;
    let newArray = [...currentArray];

    if (newArray.length > newSize) {
      newArray = newArray.slice(0, newSize);
    } else {
      while (newArray.length < newSize) {
        newArray.push(Math.floor(Math.random() * 100) + 1);
      }
    }
    onArrayChange(newArray);
  };

  const handleUserInputChange = (value: string) => {
    setInputValue(value); // Update input value immediately for user feedback
    
    const validation = userArrayValidator(value);

    if (validation.isValid && validation.numbers) {
      // Check the limit before updating
      if (validation.numbers.length > 16) {
        setArrayElementsWarning("Cannot exceed 16 size");
        return;
      }
      

      onArraySizeChange(validation.numbers.length);
      onArrayChange(validation.numbers);
    }
  };

  const handleSpeedChange = (increment: boolean) => {
    let newSpeed = speed;
    if (increment && speed < 10) {
      newSpeed = speed + 0.5;
    } else if (!increment && speed > 0.5) {
      newSpeed = speed - 0.5;
    }
    onSpeedChange(newSpeed);
  };

  // Prevent + button from exceeding 16
  const handleIncrementArraySize = () => {
    if (arraySize >= 16) {
      setArrayLengthWarning("Cannot exceed 16 size");
      return;
    }
    handleArraySizeChange(arraySize + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-6">
        {/* Array Size Section */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Array Size
          </label>
          {arrayLengthWarning && (
            <div className="text-xs text-red-600 ">
              {arrayLengthWarning}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleArraySizeChange(arraySize - 1)}
              className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium transition-colors"
            >
              −
            </button>
            <input
              type="number"
              value={arraySize}
              onChange={(e) =>
                handleArraySizeChange(parseInt(e.target.value) || 1)
              }
              min="1"
              max="16"
              className="w-16 h-8 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <button
              onClick={handleIncrementArraySize}
              className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium transition-colors"
            >
              +
            </button>
          </div>
          
        </div>

        {/* Array Elements Section */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-medium text-gray-700">
            Array Elements
          </label>
          {arrayElementsWarning && (
            <div className="text-xs text-red-600 mt-1">
              {arrayElementsWarning}
            </div>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleUserInputChange(e.target.value)}
            placeholder="Enter numbers separated by commas"
            className="h-8 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
         
        </div>

        {/* Generate Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Generate
          </label>
          <div className="flex gap-2">
            <button
              onClick={generateRandomArray}
              className="h-8 px-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Random
            </button>
            <button
              onClick={generateRandomDuplicateArray}
              className="h-8 px-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
            >
              Duplicate
            </button>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSpeedChange(false)}
            className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium transition-colors"
          >
            −
          </button>
          <span
            className="text-sm font-medium text-gray-700 min-w-[30px] text-center"
            data-speed
          >
            {speed}x
          </span>
          <button
            onClick={() => handleSpeedChange(true)}
            className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium transition-colors"
          >
            +
          </button>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Controls
          </label>
          <div className="flex gap-2">
            <button
              data-sort="asc"
              onClick={handleAscendingSort}
              className={`h-8 px-3 rounded-md text-sm font-medium transition-colors ${
                isAscending
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Asc
            </button>
            <button
              data-sort="desc"
              onClick={handleDescendingSort}
              className={`h-8 px-3 rounded-md text-sm font-medium transition-colors ${
                !isAscending
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Desc
            </button>
            <button className="h-8 px-3 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white transition-colors">
              Code
            </button>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={onReset}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <button
          onClick={onPreviousStep}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          data-control="play"
          onClick={handlePlay}
          className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center text-white transition-colors"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNextStep}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <button
          onClick={onReset}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Controls;