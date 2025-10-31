/**
 * Wizard Component
 * Multi-step form wizard with progress indicator
 */

'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete: (data: any) => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  onComplete,
  onStepChange,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  const goToNextStep = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onComplete({});
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const isStepCompleted = (stepIndex: number) => completedSteps.has(stepIndex);
  const isStepActive = (stepIndex: number) => stepIndex === currentStep;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Progress indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = isStepCompleted(index);
            const isActive = isStepActive(index);
            const isAccessible = index <= currentStep || isCompleted;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full">
                  {/* Line before step (except first) */}
                  {index > 0 && (
                    <div
                      className={cn(
                        'absolute right-1/2 w-full h-0.5 -z-10',
                        isStepCompleted(index - 1)
                          ? 'bg-primary-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  )}

                  {/* Step circle */}
                  <button
                    onClick={() => isAccessible && goToStep(index)}
                    disabled={!isAccessible}
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                      isActive && 'border-primary-600 bg-primary-600 text-white',
                      isCompleted && !isActive && 'border-primary-600 bg-primary-600 text-white',
                      !isActive && !isCompleted && 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                      isAccessible && 'cursor-pointer hover:border-primary-500',
                      !isAccessible && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </button>

                  {/* Line after step (except last) */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-1/2 w-full h-0.5 -z-10',
                        isCompleted
                          ? 'bg-primary-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {steps[currentStep].content}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={goToPreviousStep}
          disabled={currentStep === 0}
          className={cn(
            'px-6 py-2 rounded-md font-medium transition-colors',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-700 dark:text-gray-300',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Previous
        </button>
        <button
          onClick={goToNextStep}
          className={cn(
            'px-6 py-2 rounded-md font-medium transition-colors',
            'bg-primary-600 hover:bg-primary-700',
            'text-white'
          )}
        >
          {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Wizard;
