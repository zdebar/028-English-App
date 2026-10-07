import { db } from '@/database/models/db';
import type { GrammarGroupType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';
import type { GrammarChunkWithExamples } from './grammar-chunks';

export type GrammarGroupWithChunks = GrammarGroupType & {
  kind: 'group';
  chunks: GrammarChunkWithExamples[];
};

export default class GrammarGroup extends SyncEntityModel implements GrammarGroupType {
  id!: number;
  name!: string;
  note!: string | null;
  grammar_topic_id!: number;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.grammar_groups as Dexie.Table<GrammarGroupType, number>;
  static override readonly syncTableName = TableName.GrammarGroups;
  static override readonly syncEntityName = 'grammar groups';
  static override readonly syncSelect =
    'id, name, note, grammar_topic_id, sort_order, deleted_at';

}
