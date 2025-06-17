
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  completedSteps
}) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                  completedSteps.includes(index)
                    ? "bg-green-500 border-green-500 text-white"
                    : currentStep === index
                    ? "border-primary text-primary bg-primary/10"
                    : "border-gray-300 text-gray-300"
                )}
              >
                {completedSteps.includes(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-20",
                  currentStep === index
                    ? "text-primary"
                    : completedSteps.includes(index)
                    ? "text-green-600"
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
