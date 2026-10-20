export const TableName = {
  Groups: 'groups',
  GroupItems: 'group_items',
  GroupRelations: 'group_relations',
  UserItems: 'user_items',
  UserLessons: 'user_lessons',
  Levels: 'levels',
  Lessons: 'lessons',
  Notes: 'notes',
} as const;

export interface SyncEntityType {
  id: number;
  name: string;
  note: string | null;
  sort_order: number;
  deleted_at: string | null;
}

export type GroupTypeName = 'topic' | 'grammar' | 'sound' | 'pronunciation';

export interface GroupType extends SyncEntityType {
  type: GroupTypeName;
  updated_at: string;
}

export interface GroupItemType {
  id: number;
  group_id: number;
  item_id: number;
  sort_order: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface GroupRelationType {
  id: number;
  parent_group_id: number;
  child_group_id: number;
  relation_type: 'hierarchy' | 'detail' | 'contrast';
  sort_order: number;
  updated_at: string;
  deleted_at: string | null;
}

export type TableName = (typeof TableName)[keyof typeof TableName];
