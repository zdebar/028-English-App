import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getStartedTopicsByUserId: vi.fn(),
  userId: 'u1' as string | null,
  state: {
    data: [] as Array<{ block_id: number; name: string; is_removed_from_practice?: boolean }>,
    error: null as string | null,
    loading: false,
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    getStartedTopicsByUserId: (...args: unknown[]) => mocks.getStartedTopicsByUserId(...args),
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/hooks/use-array', () => ({
  useArray: (fetcher: () => Promise<unknown[]>) => {
    void fetcher();
    return {
      data: mocks.state.data,
      error: mocks.state.error,
      loading: mocks.state.loading,
      hasData: mocks.state.data.length > 0,
    };
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingMessage: 'Loading',
    topicsOverview: 'Topics overview',
    noTopics: 'No topics',
  },
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/Notification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/buttons/ListButton', () => ({
  ListButton: ({ children, onClick }: any) => (
    <button data-testid="topic-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

import TopicsOverview from '@/features/topics/TopicsOverview';

describe('TopicsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.getStartedTopicsByUserId.mockResolvedValue([]);
    mocks.state.data = [];
    mocks.state.error = null;
    mocks.state.loading = false;
  });

  it('renders loading state', () => {
    mocks.state.loading = true;

    render(<TopicsOverview />);

    expect(mocks.getStartedTopicsByUserId).toHaveBeenCalledWith('u1');
    expect(screen.queryByText('No topics')).toBeNull();
  });

  it('renders empty state when there are no topics', () => {
    render(<TopicsOverview />);

    expect(screen.getByText('No topics')).toBeTruthy();
  });

  it('renders topic list and navigates to topic detail on click', () => {
    mocks.state.data = [
      { block_id: 1, name: 'Dny v tydnu' },
      { block_id: 2, name: 'Mesice' },
    ];

    render(<TopicsOverview />);

    const buttons = screen.getAllByTestId('topic-button');
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);
    expect(mocks.navigate).toHaveBeenCalledWith('/topics/2');
  });

  it('renders browse-only topics returned by topic query', () => {
    mocks.state.data = [{ block_id: 3, name: 'Letters', is_removed_from_practice: true }];

    render(<TopicsOverview />);

    expect(screen.getByText('Letters')).toBeTruthy();
  });

  it('navigates to profile on close', () => {
    render(<TopicsOverview />);

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/profile');
  });

  it('renders empty state when data loading fails', () => {
    mocks.state.error = 'Load error';

    render(<TopicsOverview />);

    expect(screen.getByText('No topics')).toBeTruthy();
  });
});
