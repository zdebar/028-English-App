import type { GroupType } from '@/types/table.types';
import type { GrammarChunkWithExamples } from './grammar-chunks';

export type GrammarGroupWithChunks = GroupType & {
  kind: 'group';
  chunks: GrammarChunkWithExamples[];
};
