import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  showToast: vi.fn(),
  navigate: vi.fn(),
  setCurrentIndex: vi.fn(),
  reload: vi.fn(),
  resetGrammarItems: vi.fn(),
  sanitize: vi.fn(),
  arrayState: {
    data: [] as any[],
    currentIndex: null as number | null,
    currentItem: null as any,
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    resetGrammarItems: (...args: unknown[]) => mocks.resetGrammarItems(...args),
  },
}));

vi.mock('@/database/models/grammar', () => ({
  default: {
    getStartedGrammarListWithProgress: vi.fn(),
  },
}));

vi.mock('@/hooks/use-array', () => ({
  useArray: () => ({
    data: mocks.arrayState.data,
    currentIndex: mocks.arrayState.currentIndex,
    currentItem: mocks.arrayState.currentItem,
    reload: mocks.reload,
    setCurrentIndex: mocks.setCurrentIndex,
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
    startedCount: 'Started',
    masteredCount: 'Mastered',
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

vi.mock('@/components/UI/buttons/ButtonRectangular', () => ({
  default: ({ onClick, children }: any) => (
    <button data-testid="grammar-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/DelayedMessage', () => ({
  default: ({ text }: any) => <div>{text}</div>,
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
      <button data-testid="overview-reset" onClick={() => void handleReset?.()}>
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
      currentIndex: null,
      currentItem: null,
    };
    mocks.reload.mockResolvedValue(undefined);
    mocks.resetGrammarItems.mockResolvedValue(1);
    mocks.sanitize.mockImplementation((value: string) => value);
  });

  it('renders list view with grammar items and opens selected grammar', () => {
    mocks.arrayState.data = [
      { id: 1, name: 'Past tense' },
      { id: 2, name: 'Conditionals' },
    ] as any;

    render(<GrammarOverview />);

    expect(screen.getByText('Grammar overview')).toBeTruthy();
    const buttons = screen.getAllByTestId('grammar-button');
    expect(buttons.length).toBe(2);

    fireEvent.click(buttons[1]);
    expect(mocks.setCurrentIndex).toHaveBeenCalledWith(1);
  });

  it('renders empty-state message when no grammar exists', () => {
    mocks.arrayState.data = [];

    render(<GrammarOverview />);

    expect(screen.getByText('No grammar')).toBeTruthy();
  });

  it('renders grammar card view with sanitized note and can close', () => {
    mocks.arrayState.currentIndex = 0;
    mocks.arrayState.currentItem = {
      id: 3,
      name: 'Articles',
      startedCount: 4,
      masteredCount: 1,
      totalCount: 10,
      note: '<b>safe</b>',
    };
    mocks.sanitize.mockReturnValue('<i>sanitized</i>');

    render(<GrammarOverview />);

    expect(screen.getByText('Articles')).toBeTruthy();
    expect(screen.getByText('Started:4 / 10')).toBeTruthy();
    expect(screen.getByText('Mastered:1 / 10')).toBeTruthy();
    expect(mocks.sanitize).toHaveBeenCalledWith('<b>safe</b>');

    fireEvent.click(screen.getByTestId('overview-close'));
    expect(mocks.setCurrentIndex).toHaveBeenCalledWith(null);
  });

  it('handles reset success and error toasts from card view', async () => {
    mocks.arrayState.currentIndex = 0;
    mocks.arrayState.currentItem = {
      id: 8,
      name: 'Reported speech',
      startedCount: 1,
      masteredCount: 0,
      totalCount: 5,
      note: null,
    };

    const { rerender } = render(<GrammarOverview />);
    fireEvent.click(screen.getByTestId('overview-reset'));

    await waitFor(() => {
      expect(mocks.resetGrammarItems).toHaveBeenCalledWith('u1', 8);
      expect(mocks.reload).toHaveBeenCalled();
      expect(mocks.showToast).toHaveBeenCalledWith('Reset success', 'success');
    });

    mocks.resetGrammarItems.mockRejectedValue(new Error('fail'));
    rerender(<GrammarOverview />);
    fireEvent.click(screen.getByTestId('overview-reset'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Reset error', 'error');
    });
  });
});
