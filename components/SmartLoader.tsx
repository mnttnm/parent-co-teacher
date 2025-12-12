
import React, { useState, useEffect } from 'react';

interface SmartLoaderProps {
  mode: 'analyzing' | 'generating';
}

export const SmartLoader: React.FC<SmartLoaderProps> = ({ mode }) => {
  const [step, setStep] = useState(0);

  const steps = mode === 'analyzing' 
    ? [
        "Scanning the page...",
        "Identifying the chapter...",
        "Finding questions...",
        "Almost done..."
      ]
    : [
        "Reading the story...",
        "Simplifying difficult words...",
        "Writing a script for you...",
        "Creating audio guide..."
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center animate-fade-in">
      <div className="relative w-24 h-24 mb-8">
        {/* Pulsing Rings */}
        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
        <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse"></div>
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-4xl">✨</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2 transition-all duration-500">
        {steps[step]}
      </h2>
      <p className="text-gray-500 text-sm">
        Hom-ed AI is acting as your co-teacher.
      </p>

      {/* Progress Dots */}
      <div className="flex space-x-2 mt-6">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-2 rounded-full transition-all duration-500 ${
              i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-indigo-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
