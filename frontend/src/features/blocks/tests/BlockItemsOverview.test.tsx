import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getByFilename: vi.fn(),
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

class MockAudio {
  src = '';
  currentTime = 0;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

const audioInstances: MockAudio[] = [];

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

vi.mock('@/database/models/user-items', () => ({
  default: {
    getByBlockId: vi.fn(),
  },
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    getByFilename: (...args: unknown[]) => mocks.getByFilename(...args),
  },
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    pageNotFound: 'Page not found',
    loadingMessage: 'Loading',
    blocksOverview: 'Blocks overview',
    noBlockItems: 'No block items',
    notAvailable: 'Not available',
    loadingError: 'Loading error',
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

vi.mock('@/components/UI/buttons/ListButton', () => ({
  ListButton: ({ onClick, children }: any) => (
    <button data-testid="item-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import BlockItemsOverview from '@/features/blocks/BlockItemsOverview';

describe('BlockItemsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.blockId = '2';
    mocks.state.items = [];
    mocks.state.itemsLoading = false;
    mocks.state.block = { id: 2, name: 'Block 2' };
    mocks.state.blockLoading = false;

    audioInstances.length = 0;

    class MockAudioCtor extends MockAudio {
      constructor(src?: string) {
        super();
        this.src = src ?? '';
        audioInstances.push(this);
      }
    }

    vi.stubGlobal('Audio', MockAudioCtor as any);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob://audio-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('renders not found state for invalid block id', () => {
    mocks.blockId = 'x';

    render(<BlockItemsOverview />);

    expect(mocks.navigate).toHaveBeenCalledWith('/blocks');
  });

  it('renders loading state', () => {
    mocks.state.itemsLoading = true;

    render(<BlockItemsOverview />);

    expect(screen.queryByText('No block items')).toBeNull();
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

  it('renders czech on left and english on right and plays audio on click', async () => {
    mocks.state.items = [
      {
        item_id: 10,
        czech: 'pondeli',
        english: 'monday',
        audio: 'a.opus',
      },
    ];
    mocks.getByFilename.mockResolvedValue({ audioBlob: new Blob(['audio']) });

    render(<BlockItemsOverview />);

    expect(screen.getByText('pondeli')).toBeTruthy();
    expect(screen.getByText('monday')).toBeTruthy();

    await waitFor(() => {
      expect(mocks.getByFilename).toHaveBeenCalledWith('a.opus');
    });

    fireEvent.click(screen.getByTestId('item-button'));

    await waitFor(() => {
      expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    });
  });

  it('does not try to load audio when item has no audio filename', () => {
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
    expect(mocks.getByFilename).not.toHaveBeenCalled();
  });

  it('shows toast and logs error when audio playback fails', async () => {
    mocks.state.items = [
      {
        item_id: 12,
        czech: 'brezen',
        english: 'march',
        audio: 'broken.opus',
      },
    ];
    mocks.getByFilename.mockRejectedValue(new Error('boom'));

    render(<BlockItemsOverview />);

    fireEvent.click(screen.getByTestId('item-button'));

    await waitFor(() => {
      expect(mocks.errorHandler).toHaveBeenCalledWith('Audio Manager Error', expect.any(Error));
    });
  });
});
