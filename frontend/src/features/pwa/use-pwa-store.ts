import { create } from 'zustand';
import type { BeforeInstallPromptEvent } from './pwa.types';

interface PwaState {
  promptEvent: BeforeInstallPromptEvent | null;
  setPromptEvent: (event: BeforeInstallPromptEvent) => void;
  clearPromptEvent: () => void;
}

export const usePwaStore = create<PwaState>((set) => ({
  promptEvent: null,
  setPromptEvent: (event) => set({ promptEvent: event }),
  clearPromptEvent: () => set({ promptEvent: null }),
}));
