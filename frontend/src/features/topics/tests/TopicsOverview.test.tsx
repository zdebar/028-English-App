import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getStartedByUserId: vi.fn(),
  userId: 'u1' as string | null,
  state: {
    data: [] as Array<{ id: number; name: string }>,
    error: null as string | null,
    loading: false,
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ key: 'default' }),
}));

vi.mock('@/routing/data-navigation', () => ({
  DataNavigationButton: ({ to, children, ...props }: any) => (
    <button data-testid="topic-button" {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));

vi.mock('@/routing/route-data', () => ({
  topicDetailDescriptor: () => ({ key: 'topic', load: vi.fn() }),
}));

vi.mock('@/database/models/topics', () => ({
  default: {
    getStartedByUserId: (...args: unknown[]) => mocks.getStartedByUserId(...args),
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/hooks/use-live-query-data', () => ({
  useLiveQueryData: (fetcher: () => Promise<unknown[]>) => {
    void fetcher();
    return {
      data: mocks.state.data,
      error: mocks.state.error,
      loading: mocks.state.loading,
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
    mocks.getStartedByUserId.mockResolvedValue([]);
    mocks.state.data = [];
    mocks.state.error = null;
    mocks.state.loading = false;
  });

  it('renders loading state', () => {
    mocks.state.loading = true;

    render(<TopicsOverview />);

    expect(mocks.getStartedByUserId).toHaveBeenCalledWith('u1');
    expect(screen.queryByText('No topics')).toBeNull();
  });

  it('renders empty state when there are no topics', () => {
    render(<TopicsOverview />);

    expect(screen.getByText('No topics')).toBeTruthy();
  });

  it('renders topic list and navigates to topic detail on click', () => {
    mocks.state.data = [
      { id: 1, name: 'Dny v tydnu' },
      { id: 2, name: 'Mesice' },
    ];

    render(<TopicsOverview />);

    const buttons = screen.getAllByTestId('topic-button');
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);
    expect(mocks.navigate).toHaveBeenCalledWith('/topics/2');
  });

  it('renders topics independently of practice blocks', () => {
    mocks.state.data = [{ id: 3, name: 'Letters' }];

    render(<TopicsOverview />);

    expect(screen.getByText('Letters')).toBeTruthy();
  });

  it('navigates to overviews on close', () => {
    render(<TopicsOverview />);

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/overviews', { replace: true });
  });

  it('renders empty state when data loading fails', () => {
    mocks.state.error = 'Load error';

    render(<TopicsOverview />);

    expect(screen.getByText('No topics')).toBeTruthy();
  });
});
