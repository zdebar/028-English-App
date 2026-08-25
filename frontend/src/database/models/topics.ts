import { db } from '@/database/models/db';
import SyncEntityModel from '@/database/models/sync-entity-model';
import type { TopicType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import config from '@/config/config';
import Dexie from 'dexie';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;

/** Shared topic metadata and user-specific started-topic queries. */
export default class Topic extends SyncEntityModel implements TopicType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.topics as Dexie.Table<TopicType, number>;
  static override readonly syncTableName = TableName.Topics;
  static override readonly syncEntityName = 'topics';
  static override readonly syncSelect = 'id, name, note, sort_order, updated_at, deleted_at';

  static async getById(topicId: number): Promise<TopicType | null> {
    return (await db.topics.get(topicId)) ?? null;
  }

  static async getStartedByUserId(userId: string): Promise<TopicType[]> {
    assertNonEmptyString(userId, 'userId');

    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => item.topic_id !== NULL_NUMBER)
      .toArray();
    const startedTopicIds = new Set(startedItems.map((item) => item.topic_id));
    const topics = await db.topics.toArray();

    return topics
      .filter((topic) => startedTopicIds.has(topic.id))
      .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  }
}
