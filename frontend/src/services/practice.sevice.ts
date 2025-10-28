import type { UserItem } from "../types/data.types";
import config from "../config/config";

/**
 * Gets a practice deck for the user. With max. deck size array length.
 */
export async function getPracticeDeck(userId: number): Promise<UserItem[]> {
  const validItems = await getValidUserItem(userId);
  const deck = await pickDeck(validItems, config.deckSize);
  return sortItemsEvenOdd(deck);
}

/**
 * Gets a practice item for the user from the database.
 */
async function getValidUserItem(userId: number): Promise<UserItem[]> {
  const request = indexedDB.open(config.dbName, config.dbVersion);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("user-items", "readonly");
      const store = transaction.objectStore("user-items");

      const now = new Date();
      const items: UserItem[] = [];

      const userIndex = store.index("user_id_master_at_next_at");

      const userRange = IDBKeyRange.bound(
        [userId, null, null], // Start range: user_id, mastered_at = null, next_at = null
        [userId, null, now], // End range: user_id, mastered_at = null, next_at <= now
        false,
        false
      );

      userIndex.openCursor(userRange).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value;
          items.push(item);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Picks a deck of practice items from the given list based on priority. Optimized for expected small deck sizes.
 */
async function pickDeck(
  items: UserItem[],
  deckSize: number
): Promise<UserItem[]> {
  const deck: UserItem[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < Math.min(deckSize, items.length); i++) {
    let bestIndex = -1;
    let bestItem: UserItem | null = null;

    for (let j = 0; j < items.length; j++) {
      if (usedIndices.has(j)) continue;

      const currentItem = items[j];

      if (bestItem === null) {
        bestIndex = j;
        bestItem = currentItem;
        continue;
      }

      if (isItemBetter(currentItem, bestItem)) {
        bestIndex = j;
        bestItem = currentItem;
      }
    }

    if (bestIndex !== -1 && bestItem !== null) {
      deck.push(bestItem);
      usedIndices.add(bestIndex);
    }
  }

  return deck;
}

function isItemBetter(a: UserItem, b: UserItem): boolean {
  // Both have next_at - compare by next_at (lower is better)
  if (a.next_at !== null && b.next_at !== null) {
    return new Date(a.next_at).getTime() < new Date(b.next_at).getTime();
  }

  // Only a has next_at - a is better
  if (a.next_at !== null && b.next_at === null) {
    return true;
  }

  // Only b has next_at - b is better (so a is not better)
  if (a.next_at === null && b.next_at !== null) {
    return false;
  }

  // Both don't have next_at - compare by sequence (lower is better)
  return a.sequence < b.sequence;
}

function sortItemsEvenOdd(items: UserItem[]): UserItem[] {
  try {
    // Sorts items even first, then odd items.
    return items.sort((a, b) => {
      const isEvenA = a.progress % 2 === 0;
      const isEvenB = b.progress % 2 === 0;
      if (isEvenA && !isEvenB) return -1;
      if (!isEvenA && isEvenB) return 1;
      return 0;
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error in sortItemsEvenOdd: ${message}`);
  }
}
