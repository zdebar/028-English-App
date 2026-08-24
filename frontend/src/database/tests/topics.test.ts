import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  topicGet: vi.fn(),
  topicsToArray: vi.fn(),
  startedItems: [] as Array<{ topic_id: number; started_at: string }>,
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '9999-12-31T23:59:59+00:00',
      nullReplacementNumber: -1,
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    topics: {
      get: (...args: unknown[]) => mocks.topicGet(...args),
      toArray: (...args: unknown[]) => mocks.topicsToArray(...args),
    },
    user_items: {
      where: vi.fn(() => ({
        between: vi.fn(() => ({
          filter: (predicate: (item: { topic_id: number; started_at: string }) => boolean) => ({
            toArray: async () => mocks.startedItems.filter(predicate),
          }),
        })),
      })),
    },
  },
}));

import Topic from '@/database/models/topics';

describe('Topic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.startedItems = [];
    mocks.topicGet.mockResolvedValue(undefined);
    mocks.topicsToArray.mockResolvedValue([]);
  });

  it('gets topic metadata by id', async () => {
    const topic = { id: 2, name: 'Months', sort_order: 2 };
    mocks.topicGet.mockResolvedValueOnce(topic).mockResolvedValueOnce(undefined);

    await expect(Topic.getById(2)).resolves.toBe(topic);
    await expect(Topic.getById(3)).resolves.toBeNull();
  });

  it('returns only topics with started assigned items in topic order', async () => {
    mocks.startedItems = [
      { topic_id: 3, started_at: '2026-08-01T00:00:00+00:00' },
      { topic_id: -1, started_at: '2026-08-01T00:00:00+00:00' },
      { topic_id: 1, started_at: '2026-08-01T00:00:00+00:00' },
    ];
    mocks.topicsToArray.mockResolvedValue([
      { id: 1, name: 'Days', sort_order: 20 },
      { id: 2, name: 'Numbers', sort_order: 10 },
      { id: 3, name: 'Months', sort_order: 5 },
    ]);

    const result = await Topic.getStartedByUserId('u1');

    expect(result.map((topic) => topic.id)).toEqual([3, 1]);
  });
});
