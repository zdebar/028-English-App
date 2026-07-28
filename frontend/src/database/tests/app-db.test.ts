import { beforeEach, describe, expect, it, vi } from 'vitest';

type Upgrade = (transaction: {
  table: (name: string) => {
    toCollection: () => {
      modify: (callback: (value: Record<string, unknown>) => void) => Promise<void>;
    };
  };
}) => Promise<void>;

const mocks = vi.hoisted(() => ({
  versions: [] as Array<{
    number: number;
    schema?: Record<string, string>;
    upgrade?: Upgrade;
  }>,
}));

vi.mock('dexie', () => ({
  default: class DexieMock {
    constructor(_name: string) {}

    version(number: number) {
      const definition: {
        number: number;
        schema?: Record<string, string>;
        upgrade?: Upgrade;
      } = { number };
      mocks.versions.push(definition);
      return {
        stores: (schema: Record<string, string>) => {
          definition.schema = schema;
          return {
            upgrade: (callback: Upgrade) => {
              definition.upgrade = callback;
            },
          };
        },
      };
    }
  },
}));

import AppDB from '@/database/models/app-db';

describe('AppDB migrations', () => {
  beforeEach(() => {
    mocks.versions.length = 0;
  });

  it('migrates directional items and legacy block completion together in version 2', async () => {
    new AppDB();
    const version = mocks.versions.find(({ number }) => number === 2);
    const upgrade = version?.upgrade;
    const nullDate = '9999-12-31T23:59:59+00:00';
    const items: Array<Record<string, unknown>> = [
      {
        progress: 9,
        next_at: '2026-07-02T00:00:00.000Z',
        mastered_at: '2026-07-03T00:00:00.000Z',
      },
      {
        progress: 24,
        next_at: '2026-07-04T00:00:00.000Z',
        mastered_at: '2026-07-05T00:00:00.000Z',
      },
    ];
    const blocks: Array<Record<string, unknown>> = [
      {
        started_at: nullDate,
        updated_at: '2026-07-01T00:00:00.000Z',
        progress: 0,
        next_at: '2026-07-02T00:00:00.000Z',
        mastered_at: '2026-07-03T00:00:00.000Z',
      },
      {
        started_at: nullDate,
        updated_at: '2026-07-04T00:00:00.000Z',
        progress: 1,
        next_at: nullDate,
        mastered_at: nullDate,
      },
      {
        started_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-07-05T00:00:00.000Z',
        progress: 1,
        next_at: nullDate,
        mastered_at: '2026-07-06T00:00:00.000Z',
      },
    ];
    const transaction = {
      table: vi.fn((name: string) => ({
        toCollection: () => ({
          modify: async (callback: (value: Record<string, unknown>) => void) => {
            const records = name === 'user_items' ? items : blocks;
            records.forEach(callback);
          },
        }),
      })),
    };

    expect(mocks.versions.map(({ number }) => number)).toEqual([1, 2]);
    expect(version?.schema).toHaveProperty('user_items');
    expect(upgrade).toBeTypeOf('function');
    await upgrade?.(transaction);

    expect(items).toEqual([
      expect.objectContaining({
        progress_cz_to_en: 4,
        progress_en_to_cz: 4,
        next_at_cz_to_en: '2026-07-02T00:00:00.000Z',
        next_at_en_to_cz: '2026-07-02T00:00:00.000Z',
        mastered_at_cz_to_en: nullDate,
        mastered_at_en_to_cz: nullDate,
      }),
      expect.objectContaining({
        progress_cz_to_en: 12,
        progress_en_to_cz: 12,
        mastered_at_cz_to_en: '2026-07-05T00:00:00.000Z',
        mastered_at_en_to_cz: '2026-07-05T00:00:00.000Z',
      }),
    ]);
    for (const item of items) {
      expect(item).not.toHaveProperty('progress');
      expect(item).not.toHaveProperty('next_at');
      expect(item).not.toHaveProperty('mastered_at');
    }

    expect(blocks.map(({ started_at }) => started_at)).toEqual([
      '2026-07-03T00:00:00.000Z',
      '2026-07-04T00:00:00.000Z',
      '2026-06-01T00:00:00.000Z',
    ]);
    for (const block of blocks) {
      expect(block).not.toHaveProperty('progress');
      expect(block).not.toHaveProperty('next_at');
      expect(block).not.toHaveProperty('mastered_at');
    }
    expect(transaction.table.mock.calls.map(([name]) => name)).toEqual([
      'user_items',
      'user_blocks',
    ]);
  });
});
