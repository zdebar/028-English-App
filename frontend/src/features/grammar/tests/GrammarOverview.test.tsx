import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1',
  navigate: vi.fn(),
  sanitize: vi.fn(),
  resetItemsByGrammarGroupId: vi.fn(),
  showToast: vi.fn(),
  reportInfo: vi.fn(),
  reportError: vi.fn(),
  arrayState: {
    data: [] as any[],
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/database/models/grammar-groups', () => ({
  default: {
    getStarted: vi.fn(),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    resetItemsByGrammarGroupId: (...args: unknown[]) => mocks.resetItemsByGrammarGroupId(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportInfo: (...args: unknown[]) => mocks.reportInfo(...args),
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/hooks/use-live-query-data', () => ({
  useLiveQueryData: () => ({
    data: mocks.arrayState.data,
    loading: false,
    error: null,
  }),
}));

vi.mock('dompurify', () => ({
  default: {
    sanitize: (...args: unknown[]) => mocks.sanitize(...args),
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    grammarOverview: 'Grammar overview',
    noGrammar: 'No grammar',
    notAvailable: 'Not available',
    restartGrammarProgress: 'Restart grammar progress',
    resetProgressSuccessToast: 'Reset success',
    resetProgressErrorToast: 'Reset error',
  },
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/components/UI/buttons/ListButton', () => ({
  ListButton: ({ onClick, children }: any) => (
    <button data-testid="grammar-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/PropertyView', () => ({
  default: ({ label, value }: any) => (
    <div>
      {label}:{value}
    </div>
  ),
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <div data-testid="help-button" />,
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ buttonTitle, onClose, handleReset, children }: any) => (
    <div>
      <div>{buttonTitle}</div>
      <button data-testid="overview-close" onClick={onClose}>
        close
      </button>
      <button data-testid="overview-reset" onClick={() => handleReset?.()}>
        reset
      </button>
      {children}
    </div>
  ),
}));

import GrammarOverview from '@/features/grammar/GrammarOverview';

describe('GrammarOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.arrayState = {
      data: [],
    };
    mocks.sanitize.mockImplementation((value: string) => value);
    mocks.resetItemsByGrammarGroupId.mockResolvedValue(4);
  });

  it('renders list view with grammar items and opens selected grammar', () => {
    mocks.arrayState.data = [
      { id: 1, kind: 'group', name: 'Past tense', chunks: [] },
      { id: 2, kind: 'group', name: 'Conditionals', chunks: [] },
    ] as any;

    render(<GrammarOverview />);

    expect(screen.getByText('Grammar overview')).toBeTruthy();
    const buttons = screen.getAllByTestId('grammar-button');
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);
    expect(screen.getByText('Conditionals')).toBeTruthy();
  });

  it('renders empty-state message when no grammar exists', () => {
    mocks.arrayState.data = [];

    render(<GrammarOverview />);

    expect(screen.getByText('No grammar')).toBeTruthy();
  });

  it('renders grammar card view and can close', () => {
    mocks.arrayState.data = [{
      id: 3,
      kind: 'group',
      name: 'Articles',
      note: '<b>safe</b>',
      chunks: [],
    }];
    render(<GrammarOverview />);

    fireEvent.click(screen.getByTestId('grammar-button'));

    expect(screen.getByText('Articles')).toBeTruthy();

    fireEvent.click(screen.getByTestId('overview-close'));
    expect(screen.getByText('Grammar overview')).toBeTruthy();
  });

  it('renders detail card view without reset side effects', async () => {
    mocks.arrayState.data = [{
      id: 8,
      kind: 'group',
      name: 'Reported speech',
      note: null,
      chunks: [],
    }];

    render(<GrammarOverview />);
    fireEvent.click(screen.getByTestId('grammar-button'));
    expect(screen.getByText('Reported speech')).toBeTruthy();
    expect(screen.getByTestId('help-button')).toBeTruthy();
  });

  it('keeps selection by identity across live data updates and closes it when removed', () => {
    mocks.arrayState.data = [
      { id: 8, kind: 'group', name: 'Original name', note: null, chunks: [] },
    ];
    const { rerender } = render(<GrammarOverview />);
    fireEvent.click(screen.getByTestId('grammar-button'));

    mocks.arrayState.data = [
      { id: 8, kind: 'group', name: 'Updated name', note: null, chunks: [] },
    ];
    rerender(<GrammarOverview />);
    expect(screen.getByText('Updated name')).toBeTruthy();

    mocks.arrayState.data = [];
    rerender(<GrammarOverview />);
    expect(screen.getByText('Grammar overview')).toBeTruthy();
  });

  it('resets grammar progress and logs completion info', async () => {
    mocks.arrayState.data = [{
      id: 8,
      kind: 'group',
      name: 'Reported speech',
      note: null,
      chunks: [],
    }];

    render(<GrammarOverview />);
    fireEvent.click(screen.getByTestId('grammar-button'));

    fireEvent.click(screen.getByTestId('overview-reset'));

    await waitFor(() => {
      expect(mocks.resetItemsByGrammarGroupId).toHaveBeenCalledWith('u1', 8);
      expect(mocks.reportInfo).toHaveBeenCalledWith(
        'Grammar 8 reset completed: 4 items reset.',
      );
      expect(mocks.showToast).toHaveBeenCalledWith('Reset success', 'success');
    });
  });

  it('shows error toast when item reset fails', async () => {
    const error = new Error('Dexie failure');
    mocks.resetItemsByGrammarGroupId.mockRejectedValueOnce(error);
    mocks.arrayState.data = [{
      id: 8,
      kind: 'group',
      name: 'Reported speech',
      note: null,
      chunks: [],
    }];

    render(<GrammarOverview />);
    fireEvent.click(screen.getByTestId('grammar-button'));

    fireEvent.click(screen.getByTestId('overview-reset'));

    await waitFor(() => {
      expect(mocks.resetItemsByGrammarGroupId).toHaveBeenCalledWith('u1', 8);
      expect(mocks.showToast).toHaveBeenCalledWith('Reset error', 'error');
      expect(mocks.reportError).toHaveBeenCalledWith('Failed to reset grammar progress', error);
    });
    expect(mocks.reportInfo).not.toHaveBeenCalled();
  });
});
