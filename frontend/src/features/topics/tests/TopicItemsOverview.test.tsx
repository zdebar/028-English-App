import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  playAudio: vi.fn(),
  showToast: vi.fn(),
  reportInfo: vi.fn(),
  reportError: vi.fn(),
  audioLoading: false,
  readyAudio: new Set<string>(),
  userId: 'u1',
  blockId: '2',
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

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: mocks.playAudio,
    loading: mocks.audioLoading,
    isAudioReady: (filename?: string) => Boolean(filename && mocks.readyAudio.has(filename)),
  }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getByBlockId: vi.fn(),
    resetItemsByBlockId: vi.fn(),
  },
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    getByBlockId: vi.fn(),
    resetByBlockId: vi.fn(),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportInfo: (...args: unknown[]) => mocks.reportInfo(...args),
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'Not available',
    loadingError: 'Loading error',
    resetProgressSuccessToast: 'Reset success',
    resetProgressErrorToast: 'Reset error',
    resetTopicTitle: 'Reset topic',
    resetTopicDescription: 'Reset topic description',
    noTopicItems: 'No topic items',
    noAudio: 'No audio',
  },
  ARIA_TEXTS: {
    setVolume: 'Nastavit hlasitost',
    volumePercent: (value: number) => `Hlasitost: ${value}%`,
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
        disabled={!handleReset}
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
  ListButton: ({ onClick, children, disabled }: any) => (
    <button data-testid="item-button" onClick={onClick} disabled={disabled}>
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

import TopicItemsOverview from '@/features/topics/TopicItemsOverview';
import UserItem from '@/database/models/user-items';
import UserBlock from '@/database/models/user-blocks';

describe('TopicItemsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.blockId = '2';
    mocks.state.items = [];
    mocks.state.itemsLoading = false;
    mocks.state.block = { block_id: 2, name: 'Block 2', is_practice_block: true };
    mocks.state.blockLoading = false;
    mocks.playAudio.mockReset();
    mocks.playAudio.mockResolvedValue(true);
    mocks.audioLoading = false;
    mocks.readyAudio = new Set<string>();
    vi.mocked(UserBlock.resetByBlockId).mockResolvedValue(undefined);
  });

  it('renders not found state for invalid block id', () => {
    mocks.blockId = 'x';

    render(<TopicItemsOverview />);

    expect(mocks.navigate).toHaveBeenCalledWith('/topics');
  });

  it('renders loading state', () => {
    mocks.state.itemsLoading = true;

    render(<TopicItemsOverview />);

    expect(screen.queryByText('No topic items')).toBeNull();
  });

  it('renders empty state when topic has no items', () => {
    render(<TopicItemsOverview />);

    expect(screen.getByText('No topic items')).toBeTruthy();
  });

  it('navigates back to topics overview on close', () => {
    render(<TopicItemsOverview />);

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/topics');
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
    mocks.readyAudio = new Set(['a.opus']);

    render(<TopicItemsOverview />);

    expect(screen.getByText('pondeli')).toBeTruthy();
    expect(screen.getByText('monday')).toBeTruthy();

    expect(screen.getByTestId('help-button')).toBeTruthy();

    fireEvent.click(screen.getByTestId('item-button'));

    expect(mocks.playAudio).toHaveBeenCalledWith('a.opus');
  });

  it('disables item play button when audio is not ready', () => {
    mocks.state.items = [
      {
        item_id: 10,
        czech: 'pondeli',
        english: 'monday',
        audio: 'a.opus',
      },
    ];

    render(<TopicItemsOverview />);

    expect((screen.getByTestId('item-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows error toast when audio playback fails', async () => {
    mocks.state.items = [
      {
        item_id: 10,
        czech: 'pondeli',
        english: 'monday',
        audio: 'a.opus',
      },
    ];
    mocks.readyAudio = new Set(['a.opus']);
    mocks.playAudio.mockResolvedValue(false);

    render(<TopicItemsOverview />);

    fireEvent.click(screen.getByTestId('item-button'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('No audio', 'error');
    });
  });

  it('does not render help button when there are no items', () => {
    render(<TopicItemsOverview />);

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

    render(<TopicItemsOverview />);

    fireEvent.click(screen.getByTestId('item-button'));
    expect(mocks.playAudio).not.toHaveBeenCalled();
  });

  it('resets topic items and shows success toast', async () => {
    vi.mocked(UserItem.resetItemsByBlockId).mockResolvedValue(3);

    render(<TopicItemsOverview />);

    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(UserItem.resetItemsByBlockId).toHaveBeenCalledWith('u1', 2);
      expect(UserBlock.resetByBlockId).toHaveBeenCalledWith('u1', 2);
      expect(mocks.reportInfo).toHaveBeenCalledWith('Reset 3 items in topic block 2');
      expect(mocks.showToast).toHaveBeenCalledWith('Reset success', 'success');
    });
  });

  it('disables reset for browse-only topics', () => {
    mocks.state.block = { block_id: 2, name: 'Letters', is_practice_block: false };

    render(<TopicItemsOverview />);

    expect((screen.getByTestId('reset-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows toast and logs error when reset fails', async () => {
    vi.mocked(UserItem.resetItemsByBlockId).mockRejectedValue(new Error('boom'));

    render(<TopicItemsOverview />);

    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Reset error', 'error');
      expect(mocks.reportError).toHaveBeenCalledWith('Reset error', expect.any(Error));
    });
  });
});
