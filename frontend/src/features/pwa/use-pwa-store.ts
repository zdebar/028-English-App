import { create } from 'zustand';

interface PwaState {
  promptEvent: any;
  setPromptEvent: (event: any) => void;
  clearPromptEvent: () => void;
}

export const usePwaStore = create<PwaState>((set) => ({
	promptEvent: null,
	setPromptEvent: (event: any) => set({ promptEvent: event }),
	clearPromptEvent: () => set({ promptEvent: null }),
}));
