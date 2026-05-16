import { create } from 'zustand';

export const useTourStore = create((set) => ({
  run: false,
  startTour: () => set({ run: true }),
  stopTour: () => set({ run: false }),
}));
