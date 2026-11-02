import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
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
  NavigationButton: ({ to, children, ...props }: any) => (
    <button data-testid="topic-button" {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/database/state/data-store', () => ({
  useDataManager: (selector: (state: any) => unknown) => selector({ userId: mocks.userId, status: 'ready' }),
}));

vi.mock('@/database/state/data-selectors', () => ({
  selectTopicOverview: () => mocks.state.data,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingMessage: 'Loading',
    topicsOverview: 'Topics overview',
    noTopics: 'No topics',
  },
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ message }: any) => <div>{message}</div>,
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
    mocks.state.data = [];
    mocks.state.error = null;
    mocks.state.loading = false;
  });

  it('renders topic list and navigates to topic detail on click', () => {
    mocks.state.data = [
      { id: 1, name: 'Dny v tydnu' },
      { id: 2, name: 'Mesice' },
    ];

    render(<TopicsOverview />);

    const buttons = screen.getAllByTestId('topic-button');
    fireEvent.click(buttons[1]);
    expect(mocks.navigate).toHaveBeenCalledWith('/topics/2');
  });

  it('navigates to overviews on close', () => {
    render(<TopicsOverview />);

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/overviews', { replace: true });
  });

});
