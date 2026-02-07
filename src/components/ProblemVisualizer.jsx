import React, { useEffect, useState, useRef } from 'react';
import Canvas3D from './Canvas3D'; // Assumes default export
import StepController from './StepController'; // Assumes default export
import '../App.css'; // Make sure styles are available

export default function ProblemVisualizer({ problem }) {
  // --- State Management (Replacing useStepController) ---
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Safety check: ensure steps exist
  const steps = problem?.steps || [];
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep] || {};

  // --- Animation Loop ---
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < totalSteps - 1) {
      // Simple timer based loop
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStep, totalSteps, playbackSpeed]);

  // --- Handlers ---
  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const handleReset = () => { setIsPlaying(false); setCurrentStep(0); };

  // If no problem data is passed yet
  if (!problem) return <div className="loading">Loading Problem...</div>;

  return (
    <div className="problem-visualizer-container">
      
      {/* 1. Main 3D Canvas Area */}
      <div className="canvas-section">
        <Canvas3D
          array={currentStepData.array || problem.initialArray || []}
          activeIndices={currentStepData.activeIndices || []}
          selectedIndices={currentStepData.selectedIndices || []}
          animationProgress={animationProgress}
        />
        
        {/* Overlay: Problem Description & Current Step Info */}
        <div className="overlay-info">
          <h2 className="problem-title">{problem.name}</h2>
          <p className="problem-desc">{problem.description}</p>
          
          {currentStepData.explanation && (
            <div className="step-explanation">
              <p><strong>Step {currentStep + 1}:</strong> {currentStepData.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Controller */}
      <div className="controller-section">
        <StepController
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReset={handleReset}
          onNextStep={handleNext}
          onPrevStep={handlePrev}
          onGoToStep={setCurrentStep}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>
    </div>
  );
}