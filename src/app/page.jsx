'use client';

import { ProblemVisualizer } from '@/components/ProblemVisualizer';

const twoSumSteps = [
  {
    array: [2, 7, 11, 15],
    activeIndices: [],
    selectedIndices: [],
    explanation: 'Initial array: [2, 7, 11, 15]. Target: 9',
    complexity: 'slow',
  },
  {
    array: [2, 7, 11, 15],
    activeIndices: [0],
    selectedIndices: [],
    explanation: 'Pointer 1 at index 0 (value: 2)',
    complexity: 'normal',
  },
  {
    array: [2, 7, 11, 15],
    activeIndices: [0, 3],
    selectedIndices: [],
    explanation: 'Pointer 2 at index 3 (value: 15). Sum: 2 + 15 = 17 > 9',
    complexity: 'normal',
  },
  {
    array: [2, 7, 11, 15],
    activeIndices: [0, 2],
    selectedIndices: [],
    explanation: 'Move right pointer left. Sum: 2 + 11 = 13 > 9',
    complexity: 'normal',
  },
  {
    array: [2, 7, 11, 15],
    activeIndices: [0, 1],
    selectedIndices: [],
    explanation: 'Move right pointer left. Sum: 2 + 7 = 9 ✓',
    complexity: 'normal',
  },
  {
    array: [2, 7, 11, 15],
    activeIndices: [],
    selectedIndices: [0, 1],
    explanation: 'Found! Indices: 0 and 1. Values: 2 and 7',
    complexity: 'slow',
  },
];

const twoSumProblem = {
  name: 'Two Sum Problem',
  description: 'Find two numbers in an array that add up to a target value using the two-pointer technique.',
  initialArray: [2, 7, 11, 15],
  target: 9,
  steps: twoSumSteps,
};

export default function Home() {
  return (
    <main className="w-full h-screen">
      <ProblemVisualizer problem={twoSumProblem} />
    </main>
  );
}
