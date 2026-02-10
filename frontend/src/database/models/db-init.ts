import { db } from '@/database/models/db';

let isInitialized = false;

export async function initDbMappings(): Promise<void> {
  if (isInitialized) return;

  const [
    { default: UserItem },
    { default: Grammar },
    { default: UserScore },
    { default: AudioRecord },
    { default: AudioMetadata },
    { default: Metadata },
  ] = await Promise.all([
    import('@/database/models/user-items'),
    import('@/database/models/grammar'),
    import('@/database/models/user-scores'),
    import('@/database/models/audio-records'),
    import('@/database/models/audio-metadata'),
    import('@/database/models/metadata'),
  ]);

  db.user_items.mapToClass(UserItem);
  db.grammar.mapToClass(Grammar);
  db.user_scores.mapToClass(UserScore);
  db.audio_records.mapToClass(AudioRecord);
  db.audio_metadata.mapToClass(AudioMetadata);
  db.metadata.mapToClass(Metadata);

  isInitialized = true;
}
