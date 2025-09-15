
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  errorSteps?: number[];
}

const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  errorSteps = []
}) => {
  const handleStepClick = (stepIndex: number) => {
    if (onStepClick) {
      onStepClick(stepIndex);
    }
  };

  const isStepClickable = (_stepIndex: number) => {
    // Always allow clicking; parent handler decides whether navigation is permitted
    return true;
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={`step-${index}`}>
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleStepClick(index)}
                disabled={!onStepClick || !isStepClickable(index)}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  completedSteps.includes(index)
                    ? "bg-green-500 border-green-500 text-white"
                    : currentStep === index && errorSteps.includes(index)
                    ? "border-red-500 text-red-600 bg-red-50"
                    : currentStep === index
                    ? "border-primary text-primary bg-primary/10"
                    : "border-gray-300 text-gray-300",
                  onStepClick && isStepClickable(index) && "hover:scale-110 cursor-pointer",
                  (!onStepClick || !isStepClickable(index)) && "cursor-default"
                )}
              >
                {completedSteps.includes(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-20",
                  currentStep === index && errorSteps.includes(index)
                    ? "text-red-600"
                    : currentStep === index
                    ? "text-primary"
                    : completedSteps.includes(index)
                    ? "text-green-600"
                    : errorSteps.includes(index)
                    ? "text-red-600"
                    : "text-gray-400"
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-all",
                  completedSteps.includes(index)
                    ? "bg-green-500"
                    : errorSteps.includes(index)
                    ? "bg-red-500"
                    : "bg-gray-300"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WizardProgress;
