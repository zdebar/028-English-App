import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  versions: [] as Array<{
    number: number;
    schema?: Record<string, string>;
  }>,
}));

vi.mock('dexie', () => ({
  default: class DexieMock {
    constructor(_name: string) {}

    version(number: number) {
      const definition: {
        number: number;
        schema?: Record<string, string>;
      } = { number };
      mocks.versions.push(definition);
      const versionApi = {
        stores: (schema: Record<string, string>) => {
          definition.schema = schema;
          return versionApi;
        },
        upgrade: vi.fn(() => versionApi),
      };
      return versionApi;
    }
  },
}));

import AppDB from '@/database/models/app-db';

describe('AppDB schema', () => {
  beforeEach(() => {
    mocks.versions.length = 0;
  });

  it('declares the complete schema and removes obsolete stores', () => {
    new AppDB();

    expect(mocks.versions).toHaveLength(2);
    expect(mocks.versions[0]).toMatchObject({
      number: 1,
      schema: {
        levels: 'id, sort_order',
        lessons: 'id, sort_order',
        blocks: 'id, lesson_id, grammar_chunk_id',
        notes: 'id',
        topics: 'id, sort_order',
        pronunciation_groups: 'id, sort_order',
        pronunciation_group_items:
          '[pronunciation_group_id+item_id], [pronunciation_group_id+sort_order], [pronunciation_group_id+contrast_set+sort_order], item_id',
        grammar_groups: 'id, sort_order',
        grammar_chunks: 'id, grammar_group_id, sort_order',
        grammar_chunk_examples:
          '[grammar_chunk_id+item_id], [grammar_chunk_id+sort_order], item_id',
        user_item_progress_history:
          '[user_id+date+item_id+direction], [user_id+date], [user_id+updated_at], [user_id+item_id+direction]',
        practice_sessions: 'user_id, mode, updated_at',
        audio_records: 'filename',
        audio_metadata: 'archive_name',
        metadata: '[table_name+user_id]',
      },
    });
    expect(mocks.versions[0].schema?.user_items).toContain('[user_id+topic_id]');
    expect(mocks.versions[0].schema?.user_items).toContain('[user_id+has_pronunciation_practice]');
    expect(mocks.versions[0].schema?.user_items).toContain(
      '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]',
    );
    expect(mocks.versions[0].schema?.user_items).toContain(
      '[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]',
    );
    expect(mocks.versions[1]).toMatchObject({
      number: 2,
      schema: { user_scores: null, user_items_history: null },
    });
  });
});
