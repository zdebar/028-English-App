import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  unlockNextGrammarBlock: vi.fn(),
  getFirstUnlockedGrammarBlock: vi.fn(),
  getReadyGrammarPracticeState: vi.fn(),
  getReadyVocabularyPracticeState: vi.fn(),
  reportError: vi.fn(),
  liveQueryRerun: null as null | (() => Promise<void>),
  liveQueryUnsubscribe: vi.fn(),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    vocabularyPracticeButton: 'Vocabulary',
    newGrammarPracticeButton: 'New grammar',
    grammarPracticeButton: 'Grammar',
  },
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    unlockNextGrammarBlock: (...args: unknown[]) => mocks.unlockNextGrammarBlock(...args),
    getFirstUnlockedGrammarBlock: (...args: unknown[]) =>
      mocks.getFirstUnlockedGrammarBlock(...args),
    getReadyGrammarPracticeState: (...args: unknown[]) =>
      mocks.getReadyGrammarPracticeState(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getReadyVocabularyPracticeState: (...args: unknown[]) =>
      mocks.getReadyVocabularyPracticeState(...args),
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {},
    user_blocks: {},
    transaction: async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    },
  },
}));

vi.mock('dexie', () => ({
  liveQuery: (query: () => Promise<unknown>) => ({
    subscribe: (observer: { next: (value: any) => void; error: (error: unknown) => void }) => {
      let active = true;
      mocks.liveQueryRerun = async () => {
        if (!active) return;
        try {
          observer.next(await query());
        } catch (error) {
          observer.error(error);
        }
      };
      void mocks.liveQueryRerun();
      return {
        unsubscribe: () => {
          active = false;
          mocks.liveQueryUnsubscribe();
        },
      };
    },
  }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

import HomePracticeButtons from '@/features/practice/HomePracticeButtons';

async function flushPracticeStateLoad() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('HomePracticeButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unlockNextGrammarBlock.mockResolvedValue(null);
    mocks.getFirstUnlockedGrammarBlock.mockResolvedValue(null);
    mocks.getReadyGrammarPracticeState.mockResolvedValue({ readyCount: 0, schedule: [] });
    mocks.getReadyVocabularyPracticeState.mockResolvedValue({ readyCount: 0, schedule: [] });
    mocks.liveQueryRerun = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads practice-state data when available', async () => {
    mocks.getFirstUnlockedGrammarBlock.mockResolvedValue({
      user_id: 'u1',
      block_id: 10,
      name: 'Block',
      note: '',
      lesson_id: 1,
      grammar_id: 2,
      sort_order: 1,
      progress: 0,
      is_vocabulary: false,
      started_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      next_at: '9999-12-31T23:59:59+00:00',
      mastered_at: '9999-12-31T23:59:59+00:00',
      deleted_at: '9999-12-31T23:59:59+00:00',
    });
    mocks.getReadyVocabularyPracticeState.mockResolvedValue({ readyCount: 7, schedule: [] });
    mocks.getReadyGrammarPracticeState.mockResolvedValue({ readyCount: 4, schedule: [] });

    render(<HomePracticeButtons userId="u1" />);

    await waitFor(() => {
      const vocabularyButton = screen.getByText('Vocabulary').closest('button') as HTMLButtonElement;
      const newGrammarButton = screen.getByText('New grammar').closest('button') as HTMLButtonElement;
      const grammarButton = screen.getByText('Grammar').closest('button') as HTMLButtonElement;
      expect(vocabularyButton.disabled).toBe(false);
      expect(newGrammarButton.disabled).toBe(false);
      expect(grammarButton.disabled).toBe(false);
      expect(screen.getByText('7')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy();
    });
  });

  it('disables vocabulary practice when no vocabulary is available', async () => {
    mocks.getReadyVocabularyPracticeState.mockResolvedValue({ readyCount: 0, schedule: [] });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('caps the displayed ready vocabulary badge at 99+', async () => {
    mocks.getReadyVocabularyPracticeState.mockResolvedValue({ readyCount: 100, schedule: [] });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect(screen.getByText('99+')).toBeTruthy();
    expect(screen.queryByText('100')).toBeNull();
    expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('updates practice-state data after the live query is invalidated', async () => {
    mocks.getReadyVocabularyPracticeState
      .mockResolvedValueOnce({ readyCount: 0, schedule: [] })
      .mockResolvedValueOnce({ readyCount: 5, schedule: [] });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );

    await act(async () => {
      await mocks.liveQueryRerun?.();
    });

    await waitFor(() => {
      expect(mocks.getReadyVocabularyPracticeState).toHaveBeenCalledTimes(2);
      expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
        false,
      );
      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  it('reloads all readiness inputs on a live-query emission', async () => {
    mocks.getReadyVocabularyPracticeState
      .mockResolvedValueOnce({ readyCount: 0, schedule: [] })
      .mockResolvedValueOnce({ readyCount: 6, schedule: [] });

    render(<HomePracticeButtons userId="u1" />);
    await flushPracticeStateLoad();

    await act(async () => {
      await mocks.liveQueryRerun?.();
    });

    await waitFor(() => {
      expect(mocks.getReadyVocabularyPracticeState).toHaveBeenCalledTimes(2);
      expect(mocks.getFirstUnlockedGrammarBlock).toHaveBeenCalledTimes(2);
      expect(mocks.getReadyGrammarPracticeState).toHaveBeenCalledTimes(2);
      expect(screen.getByText('6')).toBeTruthy();
    });
  });

  it('unsubscribes from readiness changes on unmount', async () => {
    const { unmount } = render(<HomePracticeButtons userId="u1" />);
    await flushPracticeStateLoad();

    unmount();

    await mocks.liveQueryRerun?.();
    expect(mocks.liveQueryUnsubscribe).toHaveBeenCalledOnce();
    expect(mocks.getReadyVocabularyPracticeState).toHaveBeenCalledTimes(1);
  });

  it('increments vocabulary badge when scheduled vocabulary items become ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.getReadyVocabularyPracticeState.mockResolvedValue({
      readyCount: 0,
      schedule: [{ date: '2026-06-24T12:00:02.000Z', count: 2 }],
    });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('2')).toBeTruthy();
    expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('increments grammar badge when scheduled grammar items become ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.getReadyGrammarPracticeState.mockResolvedValue({
      readyCount: 1,
      schedule: [{ date: '2026-06-24T12:00:02.000Z', count: 2 }],
    });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect(screen.getByText('1')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('caps the displayed ready grammar badge at 99+', async () => {
    mocks.getReadyGrammarPracticeState.mockResolvedValue({
      readyCount: 123,
      schedule: [],
    });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect(screen.getByText('99+')).toBeTruthy();
    expect(screen.queryByText('123')).toBeNull();
    expect((screen.getByText('Grammar').closest('button') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('processes all overdue schedule entries together after a delayed timer', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.getReadyGrammarPracticeState.mockResolvedValue({
      readyCount: 0,
      schedule: [
        { date: '2026-06-24T12:00:02.000Z', count: 2 },
        { date: '2026-06-24T12:00:03.000Z', count: 3 },
        { date: '2026-06-24T12:00:10.000Z', count: 4 },
      ],
    });

    render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect(mocks.getReadyGrammarPracticeState).toHaveBeenCalledWith('u1');
    expect(mocks.getReadyVocabularyPracticeState).toHaveBeenCalledWith('u1');

    await act(async () => {
      vi.setSystemTime(new Date('2026-06-24T12:00:05.000Z'));
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('5')).toBeTruthy();
  });

  it('replaces the previous schedule after practice state is loaded for a new user', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.getReadyGrammarPracticeState.mockResolvedValueOnce({
      readyCount: 0,
      schedule: [{ date: '2026-06-24T12:00:02.000Z', count: 10 }],
    });

    const { rerender } = render(<HomePracticeButtons userId="u1" />);

    await flushPracticeStateLoad();

    expect(mocks.getReadyGrammarPracticeState).toHaveBeenCalledWith('u1');

    mocks.getReadyGrammarPracticeState.mockResolvedValueOnce({
      readyCount: 1,
      schedule: [{ date: '2026-06-24T12:00:03.000Z', count: 2 }],
    });
    rerender(<HomePracticeButtons userId="u2" />);

    await flushPracticeStateLoad();

    expect(mocks.getReadyGrammarPracticeState).toHaveBeenCalledWith('u2');
    expect(screen.getByText('1')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.queryByText('11')).toBeNull();
  });

  it('reports grammar unlock failures without discarding loaded readiness', async () => {
    mocks.unlockNextGrammarBlock.mockRejectedValue(new Error('Dexie failure'));

    render(<HomePracticeButtons userId="u1" />);

    await waitFor(() => {
      expect(mocks.reportError).toHaveBeenCalledWith(
        'Failed to unlock next grammar block',
        expect.any(Error),
      );
    });

    expect((screen.getByText('New grammar').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByText('Vocabulary').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByText('Grammar').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
