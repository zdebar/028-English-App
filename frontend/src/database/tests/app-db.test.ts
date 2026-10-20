import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  versions: [] as Array<{
    number: number;
    schema?: Record<string, string>;
    upgrade?: (transaction: unknown) => Promise<void>;
  }>,
}));

vi.mock('dexie', () => ({
  default: class DexieMock {
    constructor(_name: string) {}

    version(number: number) {
      const definition: {
        number: number;
        schema?: Record<string, string>;
        upgrade?: (transaction: unknown) => Promise<void>;
      } = { number };
      mocks.versions.push(definition);
      const versionApi = {
        stores: (schema: Record<string, string>) => {
          definition.schema = schema;
          return versionApi;
        },
        upgrade: (callback: (transaction: unknown) => Promise<void>) => {
          definition.upgrade = callback;
          return versionApi;
        },
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

    expect(mocks.versions).toHaveLength(13);
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
    expect(mocks.versions[0].schema?.user_items).not.toContain('has_pronunciation_practice');
    expect(mocks.versions[0].schema?.user_items).toContain(
      '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]',
    );
    expect(mocks.versions[1]).toMatchObject({
      number: 2,
      schema: { user_scores: null, user_items_history: null },
    });
    expect(mocks.versions[2]).toMatchObject({
      number: 3,
      schema: { user_item_progress_history: null },
    });
    expect(mocks.versions[3]).toMatchObject({
      number: 4,
      schema: { user_items: expect.any(String) },
    });
    expect(mocks.versions[4]).toMatchObject({
      number: 5,
      schema: { user_items: expect.any(String) },
    });
    expect(mocks.versions[5]).toMatchObject({
      number: 6,
      schema: {
        grammar_topics: 'id, sort_order',
        grammar_groups: 'id, grammar_topic_id, sort_order',
      },
    });
    expect(mocks.versions[6]).toMatchObject({
      number: 7,
      schema: { user_items: expect.any(String) },
    });
    expect(mocks.versions[7]).toMatchObject({
      number: 8,
      schema: { user_items: expect.any(String) },
    });
    expect(mocks.versions[7].schema?.user_items).toContain(
      '[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]',
    );
    expect(mocks.versions[8]).toMatchObject({
      number: 9,
      schema: {
        user_lessons: '[user_id+lesson_id+started_at], [user_id+started_at]',
        users: 'id, updated_at',
      },
    });
    expect(mocks.versions[9]).toMatchObject({
      number: 10,
      schema: {
        blocks: null,
        user_items: expect.not.stringContaining('[user_id+block_id]'),
      },
    });
    expect(mocks.versions[10]).toMatchObject({
      number: 11,
      schema: { practice_sessions: null },
    });
    expect(mocks.versions[11]).toMatchObject({
      number: 12,
      schema: {
        groups: 'id, type, sort_order, updated_at',
        group_items: 'id, &[group_id+item_id], group_id, item_id, [group_id+sort_order], updated_at',
        group_relations:
          'id, &[parent_group_id+child_group_id], parent_group_id, child_group_id, [parent_group_id+relation_type+sort_order], updated_at',
        lessons: 'id, sort_order, group_id',
      },
    });
    expect(mocks.versions[12]).toMatchObject({
      number: 13,
      schema: {
        topics: null,
        grammar_topics: null,
        grammar_groups: null,
        grammar_chunks: null,
        grammar_chunk_examples: null,
        pronunciation_groups: null,
        pronunciation_group_items: null,
        user_items: expect.not.stringContaining('grammar_chunk_id'),
      },
    });
  });

  it('initializes new direction fields while upgrading existing local items', async () => {
    new AppDB();
    let modifyItems: ((item: Record<string, unknown>) => void) | undefined;
    const transaction = {
      table: () => ({
        toCollection: () => ({
          modify: async (callback: (item: Record<string, unknown>) => void) => {
            modifyItems = callback;
          },
        }),
      }),
    };
    await mocks.versions[7].upgrade?.(transaction);

    const item: Record<string, unknown> = {};
    modifyItems?.(item);
    expect(item).toMatchObject({
      progress_en_to_cz: 0,
      is_cz_to_en_enabled: true,
      is_en_to_cz_enabled: true,
    });
    expect(item.next_at_en_to_cz).toBeTruthy();
    expect(item.mastered_at_en_to_cz).toBeTruthy();
  });

  it('removes block fields and adds the lesson grammar reference', async () => {
    new AppDB();
    let modifyItems: ((item: Record<string, unknown>) => void) | undefined;
    let modifyLessons: ((lesson: Record<string, unknown>) => void) | undefined;
    const transaction = {
      table: (name: string) => ({
        toCollection: () => ({
          modify: async (callback: (value: Record<string, unknown>) => void) => {
            if (name === 'lessons') {
              modifyLessons = callback;
            } else {
              modifyItems = callback;
            }
          },
        }),
      }),
    };
    await mocks.versions[9].upgrade?.(transaction);

    const item: Record<string, unknown> = { block_id: 10, lesson_id: 4 };
    modifyItems?.(item);
    expect(item).toEqual({ lesson_id: 4 });

    const lesson: Record<string, unknown> = {};
    modifyLessons?.(lesson);
    expect(lesson.grammar_chunk_id).toBeNull();
  });

  it('adds the optional generic group reference to existing lessons', async () => {
    new AppDB();
    let modifyLessons: ((lesson: Record<string, unknown>) => void) | undefined;
    const transaction = {
      table: () => ({
        toCollection: () => ({
          modify: async (callback: (lesson: Record<string, unknown>) => void) => {
            modifyLessons = callback;
          },
        }),
      }),
    };
    await mocks.versions[11].upgrade?.(transaction);
    const lesson: Record<string, unknown> = {};
    modifyLessons?.(lesson);
    expect(lesson.group_id).toBeNull();
  });

  it('removes legacy stores, metadata, and item/lesson fields during unified upgrade', async () => {
    new AppDB();
    const storeChanges: Record<string, string | null> = {};
    let modifyItems: ((item: Record<string, unknown>) => void) | undefined;
    let modifyLessons: ((lesson: Record<string, unknown>) => void) | undefined;
    let deleteLegacyMetadata: (() => Promise<void>) | undefined;
    const transaction = {
      table: (name: string) => ({
        toCollection: () => ({
          modify: async (callback: (value: Record<string, unknown>) => void) => {
            if (name === 'lessons') modifyLessons = callback;
            if (name === 'user_items') modifyItems = callback;
          },
        }),
        filter: () => ({
          delete: async () => {
            deleteLegacyMetadata = async () => undefined;
          },
        }),
      }),
    };
    const version = mocks.versions[12];
    expect(version?.schema).toBeDefined();
    Object.assign(storeChanges, version?.schema);
    await version?.upgrade?.(transaction);

    const item: Record<string, unknown> = { topic_id: 2, grammar_chunk_id: 3, item_id: 4 };
    modifyItems?.(item);
    expect(item).toEqual({ item_id: 4 });

    const lesson: Record<string, unknown> = { grammar_chunk_id: 3, group_id: 7 };
    modifyLessons?.(lesson);
    expect(lesson).toEqual({ group_id: 7 });
    expect(Object.values(storeChanges)).toContain(null);
    expect(deleteLegacyMetadata).toBeDefined();
  });
});
