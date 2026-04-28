export const TableName = {
  Grammar: 'grammar',
  UserScores: 'user_scores',
  UserItems: 'user_items',
  Levels: 'levels',
  Lessons: 'lessons',
  Blocks: 'blocks',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
