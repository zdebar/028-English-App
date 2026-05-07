import { db } from '@/database/models/db';
import AudioMetadata from '@/database/models/audio-metadata';
import AudioRecord from '@/database/models/audio-records';
import Blocks from '@/database/models/blocks';
import Grammar from '@/database/models/grammar';
import Lessons from '@/database/models/lessons';
import Levels from '@/database/models/levels';
import Metadata from '@/database/models/metadata';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';

let isInitialized = false;

export async function initDbMappings(): Promise<void> {
  if (isInitialized) return;

  db.user_items.mapToClass(UserItem);
  db.grammar.mapToClass(Grammar);
  db.blocks.mapToClass(Blocks);
  db.levels.mapToClass(Levels);
  db.lessons.mapToClass(Lessons);
  db.user_scores.mapToClass(UserScore);
  db.audio_records.mapToClass(AudioRecord);
  db.audio_metadata.mapToClass(AudioMetadata);
  db.metadata.mapToClass(Metadata);

  isInitialized = true;
}
