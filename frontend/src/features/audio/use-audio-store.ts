import { create } from 'zustand';

interface AudioStore {
  userId: string | null;
  volume: number;

  init: (userId: string | null) => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  userId: null,
  volume: 1,

  init: (userId) => {
    let volume = 1;

    if (userId) {
      const saved = localStorage.getItem(`volume-${userId}`);

      if (saved !== null) {
        const parsed = Number(saved);

        if (!Number.isNaN(parsed)) {
          volume = Math.max(0, Math.min(1, parsed));
        }
      }
    }

    set({
      userId,
      volume,
    });
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));

    const userId = get().userId;

    if (userId) {
      localStorage.setItem(`volume-${userId}`, String(clamped));
    }

    set({ volume: clamped });
  },
}));
