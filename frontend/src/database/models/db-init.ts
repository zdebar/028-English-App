import { db } from '@/database/models/db';

let isInitialized = false;

export async function initDbMappings(): Promise<void> {
  if (isInitialized) return;

  const [
    { default: UserItem },
    { default: Grammar },
    { default: Blocks },
    { default: Levels },
    { default: Lessons },
    { default: UserScore },
    { default: AudioRecord },
    { default: AudioMetadata },
    { default: Metadata },
  ] = await Promise.all([
    import('@/database/models/user-items'),
    import('@/database/models/grammar'),
    import('@/database/models/blocks'),
    import('@/database/models/levels'),
    import('@/database/models/lessons'),
    import('@/database/models/user-scores'),
    import('@/database/models/audio-records'),
    import('@/database/models/audio-metadata'),
    import('@/database/models/metadata'),
  ]);

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
