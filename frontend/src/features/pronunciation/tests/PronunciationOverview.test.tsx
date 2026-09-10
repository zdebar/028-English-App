import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  playAudio: vi.fn(),
  overviewData: [] as any[],
  overviewLoading: false,
  overviewError: null as Error | null,
  detailData: null as any,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ key: 'default' }),
  useParams: () => ({ groupId: '1' }),
}));

vi.mock('@/routing/data-navigation', () => ({
  DataNavigationButton: ({ to, children, ...props }: any) => (
    <button {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
  useDataNavigation: () => ({
    loadAndNavigate: () => mocks.navigate('/pronunciation'),
  }),
}));

vi.mock('@/routing/route-data', () => ({
  pronunciationGroupDetailDescriptor: () => ({ key: 'group', load: vi.fn() }),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) => selector({ userId: 'u1' }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ showToast: vi.fn() }),
}));

vi.mock('@/database/models/pronunciation-groups', () => ({
  default: {
    getOverview: vi.fn(),
    getDetail: vi.fn(),
  },
}));

vi.mock('../use-pronunciation-groups-store', () => ({
  usePronunciationGroupsStore: (
    selector: (state: { groups: any[]; loading: boolean; error: Error | null }) => unknown,
  ) =>
    selector({
      groups: mocks.overviewData,
      loading: mocks.overviewLoading,
      error: mocks.overviewError,
    }),
}));

vi.mock('@/hooks/use-live-query-data', () => ({
  useLiveQueryData: () => ({
    data: mocks.detailData,
    loading: false,
    error: null,
  }),
}));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: mocks.playAudio,
    isAudioReady: () => true,
    loading: false,
  }),
}));

vi.mock('@/features/audio/VolumeSlider', () => ({
  default: () => <div data-testid="volume" />,
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <button type="button">Help</button>,
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ buttonTitle, onClose, children }: any) => (
    <div>
      <h1>{buttonTitle}</h1>
      <button data-testid="close" onClick={onClose}>
        close
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/components/UI/DataState', () => ({
  DataState: ({ hasData, noDataMessage, children }: any) =>
    hasData ? children : <p>{noDataMessage}</p>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    pronunciationGroups: 'Skupiny výslovnosti',
    noPronunciationGroups: 'No groups',
    noPronunciationGroupItems: 'No items',
    noAudio: 'No audio',
    loadingError: 'Loading error',
    pronunciationStartedHelp: 'odemčeno/celkem položek',
  },
}));

import PronunciationGroupDetail from '../PronunciationGroupDetail';
import PronunciationOverview from '../PronunciationOverview';

describe('Pronunciation overview screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.overviewData = [];
    mocks.overviewLoading = false;
    mocks.overviewError = null;
    mocks.detailData = null;
    mocks.playAudio.mockResolvedValue(true);
  });

  it('lists visible groups with examples and unlocked/total counts', () => {
    mocks.overviewData = [
      {
        id: 1,
        name: '/æ/ × /e/',
        examples: ['man', 'men'],
        unlocked_count: 2,
        total_count: 3,
      },
    ];

    render(<PronunciationOverview />);

    fireEvent.click(screen.getByTestId('close'));
    expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });

    fireEvent.click(screen.getByRole('button', { name: /æ/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/pronunciation/1');
  });

  it('plays group items', async () => {
    mocks.detailData = {
      group: { id: 1, name: '/æ/ × /e/' },
      items: [
        { item_id: 1, czech: 'muž', english: 'man', pronunciation: 'mæn', audio: 'man.opus' },
        { item_id: 2, czech: 'muži', english: 'men', pronunciation: 'men', audio: 'men.opus' },
      ],
    };

    render(<PronunciationGroupDetail />);

    fireEvent.click(screen.getByTestId('close'));
    expect(mocks.navigate).toHaveBeenCalledWith('/pronunciation', { replace: true });

    fireEvent.click(screen.getByTitle('mæn'));
    await waitFor(() => expect(mocks.playAudio).toHaveBeenCalledWith('man.opus'));

  });
});
