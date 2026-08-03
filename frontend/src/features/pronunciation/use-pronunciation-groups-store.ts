import type { PronunciationGroupOverviewType } from '@/types/pronunciation.types';
import { create } from 'zustand';

type PronunciationGroupsState = {
  groups: PronunciationGroupOverviewType[];
  loading: boolean;
  error: Error | null;
  clear: () => void;
};

const emptyGroups: PronunciationGroupOverviewType[] = [];

/** Shared pronunciation-group snapshot populated by the active Dexie subscription. */
export const usePronunciationGroupsStore = create<PronunciationGroupsState>((set) => ({
  groups: emptyGroups,
  loading: true,
  error: null,
  clear: () => set({ groups: emptyGroups, loading: false, error: null }),
}));
