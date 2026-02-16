import * as React from 'react';

export interface MultiStepFormContextValue {
    currentStep: number;
    totalSteps: number;
    goToStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

const MultiStepFormContext = React.createContext<MultiStepFormContextValue | undefined>(undefined);

export function useMultiStepForm() {
    const context = React.useContext(MultiStepFormContext);
    if (!context) {
        throw new Error('useMultiStepForm must be used within a MultiStepFormProvider');
    }
    return context;
}

interface MultiStepFormProviderProps {
    children: React.ReactNode;
    totalSteps: number;
    initialStep?: number;
}

export function MultiStepFormProvider({ children, totalSteps, initialStep = 1 }: MultiStepFormProviderProps) {
    const [currentStep, setCurrentStep] = React.useState(initialStep);

    const goToStep = React.useCallback((step: number) => {
        if (step >= 1 && step <= totalSteps) {
            setCurrentStep(step);
        }
    }, [totalSteps]);

    const nextStep = React.useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }, [totalSteps]);

    const previousStep = React.useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    }, []);

    const value: MultiStepFormContextValue = {
        currentStep,
        totalSteps,
        goToStep,
        nextStep,
        previousStep,
        isFirstStep: currentStep === 1,
        isLastStep: currentStep === totalSteps,
    };

    return (
        <MultiStepFormContext.Provider value={value}>
            {children}
        </MultiStepFormContext.Provider>
    );
}
