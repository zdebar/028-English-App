import { db } from '@/database/models/db';
import AudioMetadata from '@/database/models/audio-metadata';
import AudioRecord from '@/database/models/audio-records';
import Lessons from '@/database/models/lessons';
import Levels from '@/database/models/levels';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import Notes from './notes';
import UserLesson from './user-lessons';
import UserSettings from './user-settings';
import Groups from './groups';
import GroupItem from './group-items';
import GroupRelation from './group-relations';

let isInitialized = false;

export function initDbMappings(): void {
  if (isInitialized) return;

  db.user_items.mapToClass(UserItem);
  db.notes.mapToClass(Notes);
  db.levels.mapToClass(Levels);
  db.lessons.mapToClass(Lessons);
  db.audio_records.mapToClass(AudioRecord);
  db.audio_metadata.mapToClass(AudioMetadata);
  db.metadata.mapToClass(Metadata);
  db.user_lessons.mapToClass(UserLesson);
  db.users.mapToClass(UserSettings);
  db.groups.mapToClass(Groups);
  db.group_items.mapToClass(GroupItem);
  db.group_relations.mapToClass(GroupRelation);

  isInitialized = true;
}
