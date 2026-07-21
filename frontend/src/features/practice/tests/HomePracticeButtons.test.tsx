import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getReadyPracticeState: vi.fn(),
  reportError: vi.fn(),
  liveQueryRerun: null as null | (() => Promise<void>),
  liveQueryUnsubscribe: vi.fn(),
}));

vi.mock('@/locales/cs', () => ({ TEXTS: { practiceButton: 'Practice' } }));
vi.mock('@/database/models/user-items', () => ({
  default: {
    getReadyPracticeState: (...args: unknown[]) => mocks.getReadyPracticeState(...args),
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
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));

import HomePracticeButtons from '@/features/practice/HomePracticeButtons';

describe('HomePracticeButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReadyPracticeState.mockResolvedValue({ readyCount: 0, schedule: [] });
    mocks.liveQueryRerun = null;
  });

  afterEach(() => vi.useRealTimers());

  it('shows one enabled unified practice button with a capped badge', async () => {
    mocks.getReadyPracticeState.mockResolvedValue({ readyCount: 123, schedule: [] });
    render(<HomePracticeButtons userId="u1" />);

    const button = await screen.findByRole('button', { name: /Practice/ });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText('99+')).toBeTruthy();
    expect(mocks.getReadyPracticeState).toHaveBeenCalledWith('u1');
  });

  it('disables practice when no item is ready', async () => {
    render(<HomePracticeButtons userId="u1" />);
    expect((await screen.findByRole('button', { name: 'Practice' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('navigates to the unified practice route', async () => {
    mocks.getReadyPracticeState.mockResolvedValue({ readyCount: 1, schedule: [] });
    render(<HomePracticeButtons userId="u1" />);
    fireEvent.click(await screen.findByRole('button', { name: /Practice/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/practice');
  });

  it('updates readiness after a live-query rerun', async () => {
    render(<HomePracticeButtons userId="u1" />);
    expect((await screen.findByRole('button', { name: 'Practice' }) as HTMLButtonElement).disabled).toBe(true);

    mocks.getReadyPracticeState.mockResolvedValue({ readyCount: 4, schedule: [] });
    await act(async () => mocks.liveQueryRerun?.());
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('moves scheduled items into the ready badge', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T10:00:00.000Z'));
    mocks.getReadyPracticeState.mockResolvedValue({
      readyCount: 1,
      schedule: [{ date: '2026-07-21T10:00:01.000Z', count: 2 }],
    });
    render(<HomePracticeButtons userId="u1" />);
    await act(async () => Promise.resolve());
    expect(screen.getByText('1')).toBeTruthy();
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('reports readiness failures and unsubscribes on unmount', async () => {
    const error = new Error('Dexie failure');
    mocks.getReadyPracticeState.mockRejectedValue(error);
    const { unmount } = render(<HomePracticeButtons userId="u1" />);
    await waitFor(() =>
      expect(mocks.reportError).toHaveBeenCalledWith(
        'Failed to load unified practice button state',
        error,
      ),
    );
    unmount();
    expect(mocks.liveQueryUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
