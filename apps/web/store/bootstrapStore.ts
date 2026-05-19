import { create } from "zustand";

interface BootstrapState {
  featureFlags: any[];
  whatsappNumbers: any[];
  isLoaded: boolean;
  setBootstrapData: (flags: any[], numbers: any[]) => void;
}

export const useBootstrapStore = create<BootstrapState>((set) => ({
  featureFlags: [],
  whatsappNumbers: [],
  isLoaded: false,
  setBootstrapData: (flags, numbers) => set({ featureFlags: flags, whatsappNumbers: numbers, isLoaded: true }),
}));
