import { db } from '@/database/models/db';
import SyncEntityModel from '@/database/models/sync-entity-model';
import type { TopicType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import Dexie from 'dexie';
import Groups from './groups';

/** Shared topic metadata and user-specific initiated-topic queries. */
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
    const group = await Groups.getById(topicId);
    if (group?.type !== 'topic') return null;
    const { type: _type, ...topic } = group;
    return topic;
  }

  /** Matches the overview's metadata join, stopping at the first available topic. */
  static async hasInitiatedByUserId(userId: string): Promise<boolean> {
    return (await Groups.getStartedByUser(userId, 'topic')).length > 0;
  }

  static async getInitiatedByUserId(userId: string): Promise<TopicType[]> {
    assertNonEmptyString(userId, 'userId');

    const groups = await Groups.getStartedByUser(userId, 'topic');
    return groups.map(({ type: _type, examples: _examples, ...topic }) => topic);
  }
}
