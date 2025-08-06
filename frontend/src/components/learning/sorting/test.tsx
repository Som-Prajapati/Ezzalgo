"use client";

import React, { useEffect } from "react";

interface TestChildProps {
  array: number[];
  speed: number;
  isAscending: boolean;
  isPlaying: boolean;

  // Add registration functions as props
  registerPlayFunction?: (fn: () => void) => void;
  registerPauseFunction?: (fn: () => void) => void;
  registerResetFunction?: (fn: () => void) => void;
  registerNextStepFunction?: (fn: () => void) => void;
  registerPreviousStepFunction?: (fn: () => void) => void;
}

const TestChild: React.FC<TestChildProps> = ({
  array,
  speed,
  isAscending,
  isPlaying,
  registerPlayFunction,
  registerPauseFunction,
  registerResetFunction,
  registerNextStepFunction,
  registerPreviousStepFunction,
}) => {
  // Define child's own play function
  const childPlayFunction = () => {
    console.log(
      `Child: Play function called. Array: [${array.join(
        ", "
      )}], isAscending: ${isAscending}, speed: ${speed}`
    );
    // Add child-specific play logic here
  };

  // Define child's own pause function
  const childPauseFunction = () => {
    console.log("Child: Pause function called");
    // Add child-specific pause logic here
  };

  // Define child's own reset function
  const childResetFunction = () => {
    console.log("Child: Reset function called");
    // Add child-specific reset logic here
  };

  // Define child's own next step function
  const childNextStepFunction = () => {
    console.log("Child: Next step function called");
    // Add child-specific next step logic here
  };

  // Define child's own previous step function
  const childPreviousStepFunction = () => {
    console.log("Child: Previous step function called");
    // Add child-specific previous step logic here
  };

  // Register functions with parent on mount
  useEffect(() => {
    // Simply call the registration functions passed as props
    if (registerPlayFunction) registerPlayFunction(childPlayFunction);
    if (registerPauseFunction) registerPauseFunction(childPauseFunction);
    if (registerResetFunction) registerResetFunction(childResetFunction);
    if (registerNextStepFunction)
      registerNextStepFunction(childNextStepFunction);
    if (registerPreviousStepFunction)
      registerPreviousStepFunction(childPreviousStepFunction);
  }, []);

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4 max-w-6xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        TestChild Component
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Array Display */}
        <div className="bg-white p-3 rounded-md shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Array</h4>
          <div className="text-sm text-gray-600">[{array.join(", ")}]</div>
          <div className="text-xs text-gray-500 mt-1">
            Length: {array.length}
          </div>
        </div>

        {/* Speed Display */}
        <div className="bg-white p-3 rounded-md shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Speed</h4>
          <div className="text-sm text-gray-600">{speed}x</div>
        </div>

        {/* Sort Order Display */}
        <div className="bg-white p-3 rounded-md shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sort Order</h4>
          <div className="text-sm text-gray-600">
            {isAscending ? "Ascending" : "Descending"}
          </div>
        </div>
      </div>

      {/* Playing Status */}
      <div className="mt-4 bg-white p-3 rounded-md shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
        <div
          className={`text-sm font-medium ${
            isPlaying ? "text-green-600" : "text-gray-600"
          }`}
        >
          {isPlaying ? "Playing" : "Paused"}
        </div>
      </div>

      {/* Test Buttons to verify child functions */}
      <div className="mt-4 bg-white p-3 rounded-md shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Test Child Functions
        </h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={childPlayFunction}
            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm"
          >
            Test Play
          </button>
          <button
            onClick={childPauseFunction}
            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-sm"
          >
            Test Pause
          </button>
          <button
            onClick={childResetFunction}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
          >
            Test Reset
          </button>
          <button
            onClick={childNextStepFunction}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
          >
            Test Next
          </button>
          <button
            onClick={childPreviousStepFunction}
            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-sm"
          >
            Test Previous
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestChild;
