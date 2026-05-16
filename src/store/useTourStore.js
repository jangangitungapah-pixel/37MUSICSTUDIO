import { create } from 'zustand';

export const useTourStore = create((set) => ({
  run: false,
  currentStep: 0,
  startTour: () => set({ run: true, currentStep: 0 }),
  stopTour: () => set({ run: false, currentStep: 0 }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  setStep: (step) => set({ currentStep: step }),
}));
