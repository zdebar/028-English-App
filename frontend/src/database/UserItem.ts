import { Entity } from "dexie";
import type AppDB from "@/database/AppDB";
import type { UserItemLocal } from "@/types/local.types";
import config from "@/config/config";
import { getNextAt } from "@/utils/practice.utils";
import { sortOddEvenByProgress } from "@/utils/practice.utils";

export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  id!: number;
  user_id!: string;
  czech!: string;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  sequence!: number;
  grammar_id!: number | null;
  progress!: number;
  started_at!: string | null;
  updated_at!: string | null;
  next_at!: string;
  learned_at!: string | null;
  mastered_at!: string;

  async getPracticeDeck(limit: number = config.deckSize) {
    const items = await this.db.user_items
      .where("user_id")
      .equals(this.user_id)
      .and((item) => item.mastered_at === config.nullReplacementDate)
      .and(
        (item) =>
          item.next_at === config.nullReplacementDate ||
          item.next_at <= new Date(Date.now()).toISOString()
      )
      .sortBy("next_at")
      .then((items) => items.sort((a, b) => a.sequence - b.sequence));

    return sortOddEvenByProgress(items.slice(0, limit));
  }

  async savePracticeDeck(items: UserItemLocal[]) {
    const currentDateTime = new Date(Date.now()).toISOString();
    const updatedItems = items.map((item) => {
      return {
        ...item,
        progress: item.progress,
        next_at: getNextAt(item.progress),
        started_at: item.started_at || currentDateTime,
        updated_at: currentDateTime,
        learned_at:
          !item.learned_at && item.progress > config.learnedAtThreshold
            ? currentDateTime
            : item.learned_at,
        mastered_at:
          item.mastered_at === config.nullReplacementDate &&
          item.progress > config.masteredAtThreshold
            ? currentDateTime
            : item.mastered_at,
      };
    });

    await this.db.user_items.bulkPut(updatedItems);
  }
}
