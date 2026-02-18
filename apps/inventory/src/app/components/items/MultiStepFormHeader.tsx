import * as React from 'react';
import { Check } from 'lucide-react';
import { useMultiStepForm } from './MultiStepFormContext';

const STEP_TITLES = [
    'Basic & Inventory',
    'Pricing & Ordering',
    'Tax & Additional',
];

export const MultiStepFormHeader = React.memo(function MultiStepFormHeader() {
    const { currentStep, totalSteps, goToStep } = useMultiStepForm();

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between">
                {Array.from({ length: totalSteps }, (_, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;
                    const isClickable = true; // Allow navigation to any step

                    return (
                        <React.Fragment key={stepNumber}>
                            <div className="flex flex-col items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => isClickable && goToStep(stepNumber)}
                                    disabled={!isClickable}
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200
                    ${isActive
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                                            : isCompleted
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }
                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        stepNumber
                                    )}
                                </button>
                                <span
                                    className={`
                    mt-2 text-xs font-medium text-center
                    ${isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : isCompleted
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }
                  `}
                                >
                                    {STEP_TITLES[index]}
                                </span>
                            </div>

                            {stepNumber < totalSteps && (
                                <div
                                    className={`
                    flex-1 h-0.5 mx-2 -mt-8
                    ${stepNumber < currentStep
                                            ? 'bg-green-600'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                        }
                  `}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
});
