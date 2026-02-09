import { create } from 'zustand';

export interface OnboardingData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
  bio: string;
  timezone: string;
  avatarUrl: string;
  // Organization Step
  organizationName: string;
  industry: string;
  companySize: string;
  organizationDescription: string;
  websiteUrl: string;
  logoUrl: string;
}

interface OnboardingState {
  currentStep: number;
  data: OnboardingData;
  isComplete: boolean;
  setCurrentStep: (step: number) => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  setIsComplete: (isComplete: boolean) => void;
  reset: () => void;
}

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  jobTitle: '',
  department: '',
  bio: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  avatarUrl: '',
  organizationName: '',
  industry: '',
  companySize: '',
  organizationDescription: '',
  websiteUrl: '',
  logoUrl: '',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  data: initialData,
  isComplete: false,
  setCurrentStep: (step) => set({ currentStep: step }),
  updateData: (partial) =>
    set((state) => ({
      data: { ...state.data, ...partial },
    })),
  setIsComplete: (isComplete) => set({ isComplete }),
  reset: () => set({ currentStep: 1, data: initialData, isComplete: false }),
}));
