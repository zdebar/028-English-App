import { create } from 'zustand';

interface LevelsStoreState {
  showMastered: boolean;
  setShowMastered: (show: boolean) => void;
  unpackedLevelId: number | null;
  hydrateUnpackedLevelId: (userId: string | null) => void;
  setUnpackedLevelId: (userId: string | null, levelId: number | null) => void;
}

const UNPACKED_LEVEL_STORAGE_KEY = 'levels_unpacked_level_id';

export function getUnpackedLevelStorageKey(userId: string): string {
  return `${UNPACKED_LEVEL_STORAGE_KEY}_${userId}`;
}

function loadUnpackedLevelId(userId: string | null): number | null {
  if (!userId) return null;

  const storedValue = localStorage.getItem(getUnpackedLevelStorageKey(userId));
  if (!storedValue) return null;

  const levelId = Number(storedValue);
  if (!Number.isInteger(levelId)) {
    localStorage.removeItem(getUnpackedLevelStorageKey(userId));
    return null;
  }

  return levelId;
}

function saveUnpackedLevelId(userId: string | null, levelId: number | null): void {
  if (!userId) return;

  const storageKey = getUnpackedLevelStorageKey(userId);
  if (levelId === null) {
    localStorage.removeItem(storageKey);
    return;
  }

  localStorage.setItem(storageKey, String(levelId));
}

export const useLevelsStore = create<LevelsStoreState>((set) => ({
  showMastered: false,
  setShowMastered: (show) => set({ showMastered: show }),
  unpackedLevelId: null,
  hydrateUnpackedLevelId: (userId) => set({ unpackedLevelId: loadUnpackedLevelId(userId) }),
  setUnpackedLevelId: (userId, levelId) => {
    saveUnpackedLevelId(userId, levelId);
    set({ unpackedLevelId: levelId });
  },
}));
