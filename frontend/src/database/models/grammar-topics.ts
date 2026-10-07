import { db } from '@/database/models/db';
import type { GrammarTopicType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';
import UserItem from './user-items';
import GrammarChunk from './grammar-chunks';
import type { GrammarGroupWithChunks } from './grammar-groups';

export type GrammarTopicWithGroups = GrammarTopicType & {
  groups: GrammarGroupWithChunks[];
};

export default class GrammarTopic extends SyncEntityModel implements GrammarTopicType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.grammar_topics as Dexie.Table<GrammarTopicType, number>;
  static override readonly syncTableName = TableName.GrammarTopics;
  static override readonly syncEntityName = 'grammar topics';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  static async getInitiated(userId: string): Promise<GrammarTopicWithGroups[]> {
    const chunkIds = await UserItem.getInitiatedGrammarChunkIds(userId);
    if (chunkIds.length === 0) return [];

    const chunks = await db.grammar_chunks.where('id').anyOf(chunkIds).toArray();
    const startedChunks = await GrammarChunk.addExamplesToMany(userId, chunks);
    const chunksByGroupId = new Map<number, typeof startedChunks>();

    for (const chunk of startedChunks) {
      const groupChunks = chunksByGroupId.get(chunk.grammar_group_id) ?? [];
      groupChunks.push(chunk);
      chunksByGroupId.set(chunk.grammar_group_id, groupChunks);
    }

    const groups = await db.grammar_groups
      .where('id')
      .anyOf([...chunksByGroupId.keys()])
      .sortBy('sort_order');
    const groupsByTopicId = new Map<number, GrammarGroupWithChunks[]>();

    for (const group of groups) {
      if (!group.grammar_topic_id) continue;

      const orderedChunks = [...(chunksByGroupId.get(group.id) ?? [])];
      orderedChunks.sort((left, right) => left.sort_order - right.sort_order);
      const topicGroups = groupsByTopicId.get(group.grammar_topic_id) ?? [];
      topicGroups.push({ ...group, kind: 'group', chunks: orderedChunks });
      groupsByTopicId.set(group.grammar_topic_id, topicGroups);
    }

    const topicIds = [...groupsByTopicId.keys()];
    if (topicIds.length === 0) return [];

    const topics = await db.grammar_topics
      .where('id')
      .anyOf(topicIds)
      .sortBy('sort_order');

    return topics.map((topic) => ({
      ...topic,
      groups: groupsByTopicId.get(topic.id) ?? [],
    }));
  }
}