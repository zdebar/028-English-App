export const TableName = {
  GrammarGroups: 'grammar_groups',
  GrammarChunks: 'grammar_chunks',
  UserScores: 'user_scores',
  UserItems: 'user_items',
  UserBlocks: 'user_blocks',
  Levels: 'levels',
  Lessons: 'lessons',
  Blocks: 'blocks',
  Notes: 'notes',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
