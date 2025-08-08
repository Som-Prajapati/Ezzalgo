"use client";
import TestChild from "./test";
import React, { useRef, useState, useEffect } from "react";
import SelectionSort from "./SelectionSort";
import InsertionSort from "./InsertionSort";

interface ControlsProps {
  onArrayChange?: (array: number[]) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
}


const Controls: React.FC<ControlsProps> = () => {
  // Fixed initial array to prevent hydration mismatch
  const getFixedInitialArray = () => [42, 17, 89, 31, 65, 8];

  // State to track if component has mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  const initialArray = getFixedInitialArray();

  // Convert refs to state for reactive updates
  const [array, setArray] = useState<number[]>(initialArray);
  const [arraySize, setArraySize] = useState<number>(6);
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Keep user input as ref since it's just for DOM manipulation
  const userInput = useRef<string>(initialArray.join(", "));

  // Function refs that child components can populate
  const playFunction = useRef<(() => void) | null>(null);
  const pauseFunction = useRef<(() => void) | null>(null);
  const resetFunction = useRef<(() => void) | null>(null);
  const nextStepFunction = useRef<(() => void) | null>(null);
  const previousStepFunction = useRef<(() => void) | null>(null);

  // Set mounted flag after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate random array (only runs on client after mount)
  const generateRandomArray = () => {
    hideArrayElementsWarning(); 
    const newArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * 100) + 1
    );
    updateArray(newArray);
  };

  // Utility Functions
  const updateArray = (newArray: number[]) => {
    setArray(newArray);
    setIsPlaying(false);

    userInput.current = newArray.join(", ");

    // Update the input field display (only if mounted)
    if (isMounted) {
      const inputElement = document.querySelector(
        'input[placeholder="Enter numbers separated by commas"]'
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = userInput.current;
      }
    }
  };

  // Warning Display Functions
  const showArrayLengthWarning = (message: string) => {
    if (!isMounted) return;
    const warningElement = document.querySelector(
      '[data-warning="array-length"]'
    ) as HTMLElement;
    if (warningElement) {
      warningElement.textContent = message;
      warningElement.style.display = "block";
    }
  };

  const hideArrayLengthWarning = () => {
    if (!isMounted) return;
    const warningElement = document.querySelector(
      '[data-warning="array-length"]'
    ) as HTMLElement;
    if (warningElement) {
      warningElement.style.display = "none";
    }
  };

  const showArrayElementsWarning = (message: string) => {
    if (!isMounted) return;
    const warningElement = document.querySelector(
      '[data-warning="array-elements"]'
    ) as HTMLElement;
    if (warningElement) {
      warningElement.textContent = message;
      warningElement.style.display = "block";
    }
  };

  const hideArrayElementsWarning = () => {
    if (!isMounted) return;
    const warningElement = document.querySelector(
      '[data-warning="array-elements"]'
    ) as HTMLElement;
    if (warningElement) {
      warningElement.style.display = "none";
    }
  };

  // Validation Functions
  const arrayLengthValidator = (length: number): boolean => {
    if (!Number.isInteger(length)) {
      showArrayLengthWarning("Please enter a valid integer");
      return false;
    }
    if (length < 1) {
      showArrayLengthWarning("Array length must be at least 1");
      return false;
    }
    if (length > 16) {
      showArrayLengthWarning("Array length cannot exceed 16");
      return false;
    }
    hideArrayLengthWarning();
    return true;
  };

  const userArrayValidator = (
    inputString: string
  ): { isValid: boolean; numbers?: number[] } => {
    try {
      if (!inputString.trim()) {
        showArrayElementsWarning("Please enter some numbers");
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
        showArrayElementsWarning("No valid numbers found");
        return { isValid: false };
      }

      if (numbers.length > 16) {
        showArrayElementsWarning("Array cannot have more than 16 elements");
        return { isValid: false };
      }

      hideArrayElementsWarning();
      return { isValid: true, numbers };
    } catch (error) {
      if (error instanceof Error) {
        showArrayElementsWarning(error.message);
      } else {
        showArrayElementsWarning("Invalid input format");
      }
      return { isValid: false };
    }
  };

  const generateRandomDuplicateArray = () => {
    hideArrayElementsWarning(); 
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

    updateArray(newArray);
  };

  // UI Update Functions
  const updatePlayButtonUI = () => {
    if (!isMounted) return;
    const playButton = document.querySelector(
      '[data-control="play"]'
    ) as HTMLButtonElement;
    if (playButton) {
      if (isPlaying) {
        playButton.innerHTML = `
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        `;
      } else {
        playButton.innerHTML = `
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
      }
    }
  };

  const handleAscendingSort = () => {
    setIsAscending(true);
  };

  const handleDescendingSort = () => {
    setIsAscending(false);
  };

  // Event Handlers
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

  const handleReset = () => {
    setIsPlaying(false);

    if (resetFunction.current) {
      resetFunction.current();
    }
  };

  const handleNextStep = () => {
    if (nextStepFunction.current) {
      nextStepFunction.current();
    }
  };

  const handlePreviousStep = () => {
    if (previousStepFunction.current) {
      previousStepFunction.current();
    }
  };

  const handleArraySizeChange = (newSize: number) => {
    if (!arrayLengthValidator(newSize)) return;

    setArraySize(newSize);

    if (isMounted) {
      const sizeInput = document.querySelector(
        'input[type="number"]'
      ) as HTMLInputElement;
      if (sizeInput) {
        sizeInput.value = newSize.toString();
      }
    }

    const currentArray = array;
    let newArray = [...currentArray];

    if (newArray.length > newSize) {
      newArray = newArray.slice(0, newSize);
    } else {
      while (newArray.length < newSize) {
        newArray.push(Math.floor(Math.random() * 100) + 1);
      }
    }
    updateArray(newArray);
  };

  const handleUserInputChange = (value: string) => {
    const validation = userArrayValidator(value);

    if (validation.isValid && validation.numbers) {
      setArraySize(validation.numbers.length);

      if (isMounted) {
        const sizeInput = document.querySelector(
          'input[type="number"]'
        ) as HTMLInputElement;
        if (sizeInput) {
          sizeInput.value = validation.numbers.length.toString();
        }
      }

      updateArray(validation.numbers);
    }
  };

  const handleSpeedChange = (increment: boolean) => {
    if (increment && speed < 5) {
      setSpeed(speed + 0.5);
    } else if (!increment && speed > 0.5) {
      setSpeed(speed - 0.5);
    }

    if (isMounted) {
      const speedDisplay = document.querySelector(
        "[data-speed]"
      ) as HTMLSpanElement;
      if (speedDisplay) {
        speedDisplay.textContent = `${speed}x`;
      }
    }
  };

  // Use useEffect to update UI when state changes
  useEffect(() => {
    updatePlayButtonUI();
  }, [isPlaying, isMounted]);

  useEffect(() => {
    if (isMounted) {
      const speedDisplay = document.querySelector(
        "[data-speed]"
      ) as HTMLSpanElement;
      if (speedDisplay) {
        speedDisplay.textContent = `${speed}x`;
      }
    }
  }, [speed, isMounted]);

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

  return (
    <div>
      <div className="mb-8">
        <InsertionSort
          key={`${array.join(",")}-${isAscending}`}
          array={array}
          speed={speed}
          isAscending={isAscending}
          isPlaying={isPlaying}
          registerPlayFunction={registerPlayFunction}
          registerPauseFunction={registerPauseFunction}
          registerResetFunction={registerResetFunction}
          registerNextStepFunction={registerNextStepFunction}
          registerPreviousStepFunction={registerPreviousStepFunction}
          onAnimationEnd={() => setIsPlaying(false)}
        />
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-6">
          {/* Array Size Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Array Size
            </label>
            <div
              data-warning="array-length"
              className="text-xs text-red-600 min-h-[16px]"
              style={{ display: "none" }}
            ></div>
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
                onClick={() => handleArraySizeChange(arraySize + 1)}
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
            <div
              data-warning="array-elements"
              className="text-xs text-red-600 min-h-[16px]"
              style={{ display: "none" }}
            ></div>
            <input
              type="text"
              defaultValue={array.join(", ")}
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
            onClick={handleReset}
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
            onClick={handlePreviousStep}
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
            onClick={handleNextStep}
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
            onClick={handleReset}
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
    </div>
  );
};
export default Controls;
