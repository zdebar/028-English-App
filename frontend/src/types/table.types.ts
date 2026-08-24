export const TableName = {
  GrammarGroups: 'grammar_groups',
  GrammarChunks: 'grammar_chunks',
  GrammarChunkExamples: 'grammar_chunk_examples',
  UserScores: 'user_scores',
  UserItems: 'user_items',
  UserBlocks: 'user_blocks',
  Levels: 'levels',
  Lessons: 'lessons',
  Blocks: 'blocks',
  Topics: 'topics',
  Notes: 'notes',
  PronunciationGroups: 'pronunciation_groups',
  PronunciationGroupItems: 'pronunciation_group_items',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
