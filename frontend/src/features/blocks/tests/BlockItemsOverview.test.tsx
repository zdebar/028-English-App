import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  playAudio: vi.fn(),
  showToast: vi.fn(),
  errorHandler: vi.fn(),
  userId: 'u1' as string | null,
  blockId: '2' as string | undefined,
  state: {
    items: [] as any[],
    itemsLoading: false,
    block: { id: 2, name: 'Block 2' } as any,
    blockLoading: false,
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ blockId: mocks.blockId }),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/hooks/use-array', () => ({
  useArray: () => ({
    data: mocks.state.items,
    loading: mocks.state.itemsLoading,
    hasData: mocks.state.items.length > 0,
  }),
}));

vi.mock('@/hooks/use-fetch', () => ({
  useFetch: () => ({
    data: mocks.state.block,
    loading: mocks.state.blockLoading,
  }),
}));

vi.mock('@/hooks/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: mocks.playAudio,
  }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getByBlockId: vi.fn(),
    resetItemsByBlockId: vi.fn(),
  },
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'Not available',
    loadingError: 'Loading error',
    resetProgressSuccessToast: 'Reset success',
    resetProgressErrorToast: 'Reset error',
    resetBlockTitle: 'Reset block',
    resetBlockDescription: 'Reset block description',
  },
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children, message }: any) => <div>{children ?? message}</div>,
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

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ children, buttonTitle, onClose, handleReset }: any) => (
    <div>
      <div>{buttonTitle}</div>
      <button data-testid="close-button" onClick={onClose}>
        close
      </button>
      <button
        data-testid="reset-button"
        onClick={() => {
          handleReset?.();
        }}
      >
        reset
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/components/UI/buttons/ListButton', () => ({
  ListButton: ({ onClick, children }: any) => (
    <button data-testid="item-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="help-button" className={className}>
      help
    </div>
  ),
}));

import BlockItemsOverview from '@/features/blocks/BlockItemsOverview';
import UserItem from '@/database/models/user-items';

describe('BlockItemsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.blockId = '2';
    mocks.state.items = [];
    mocks.state.itemsLoading = false;
    mocks.state.block = { id: 2, name: 'Block 2' };
    mocks.state.blockLoading = false;
    mocks.playAudio.mockReset();
  });

  it('renders not found state for invalid block id', () => {
    mocks.blockId = 'x';

    render(<BlockItemsOverview />);

    expect(mocks.navigate).toHaveBeenCalledWith('/blocks');
  });

  it('renders loading state', () => {
    mocks.state.itemsLoading = true;

    render(<BlockItemsOverview />);

    expect(screen.queryByText('Not available')).toBeNull();
  });

  it('renders empty state when block has no items', () => {
    render(<BlockItemsOverview />);

    expect(screen.getByText('Not available')).toBeTruthy();
  });

  it('navigates back to blocks overview on close', () => {
    render(<BlockItemsOverview />);

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/blocks');
  });

  it('renders czech and english values and plays audio on click', () => {
    mocks.state.items = [
      {
        item_id: 10,
        czech: 'pondeli',
        english: 'monday',
        audio: 'a.opus',
      },
    ];

    render(<BlockItemsOverview />);

    expect(screen.getByText('pondeli')).toBeTruthy();
    expect(screen.getByText('monday')).toBeTruthy();

    expect(screen.getByTestId('help-button')).toBeTruthy();

    fireEvent.click(screen.getByTestId('item-button'));

    expect(mocks.playAudio).toHaveBeenCalledWith('a.opus');
  });

  it('does not render help button when there are no items', () => {
    render(<BlockItemsOverview />);

    expect(screen.queryByTestId('help-button')).toBeNull();
  });

  it('does not try to play audio when item has no audio filename', () => {
    mocks.state.items = [
      {
        item_id: 11,
        czech: 'unor',
        english: 'february',
        audio: null,
      },
    ];

    render(<BlockItemsOverview />);

    fireEvent.click(screen.getByTestId('item-button'));
    expect(mocks.playAudio).not.toHaveBeenCalled();
  });

  it('resets block items and shows success toast', async () => {
    vi.mocked(UserItem.resetItemsByBlockId).mockResolvedValue(undefined as never);

    render(<BlockItemsOverview />);

    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(UserItem.resetItemsByBlockId).toHaveBeenCalledWith('u1', 2);
      expect(mocks.showToast).toHaveBeenCalledWith('Reset success', 'success');
    });
  });

  it('shows toast and logs error when reset fails', async () => {
    vi.mocked(UserItem.resetItemsByBlockId).mockRejectedValue(new Error('boom') as never);

    render(<BlockItemsOverview />);

    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Reset error', 'error');
      expect(mocks.errorHandler).toHaveBeenCalledWith('Reset error', expect.any(Error));
    });
  });
});
