import Dexie from 'dexie';
import { db } from '@/database/models/db';
import type { GroupRelationType } from '@/types/table.types';
import { TableName } from '@/types/table.types';
import SyncEntityModel from './sync-entity-model';

export default class GroupRelation extends SyncEntityModel implements GroupRelationType {
  id!: number;
  parent_group_id!: number;
  child_group_id!: number;
  relation_type!: GroupRelationType['relation_type'];
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.group_relations as Dexie.Table<GroupRelationType, number>;
  static override readonly syncTableName = TableName.GroupRelations;
  static override readonly syncEntityName = 'group relations';
  static override readonly syncSelect = 'id, parent_group_id, child_group_id, relation_type, sort_order, updated_at, deleted_at';
}
