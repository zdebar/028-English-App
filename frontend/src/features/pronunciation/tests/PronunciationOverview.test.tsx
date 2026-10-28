import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  playAudio: vi.fn(),
  stopAudio: vi.fn(),
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
  NavigationButton: ({ to, children, ...props }: any) => (
    <button {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
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
    stopAudio: mocks.stopAudio,
    isAudioReady: () => true,
    loading: false,
  }),
}));

vi.mock('@/features/audio/VolumeSlider', () => ({
  default: () => <div data-testid="volume" />,
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

vi.mock('../use-pronunciation-groups-store-sync', () => ({
  usePronunciationGroupsStoreSync: vi.fn(),
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
    pronunciationSettings: 'Porovnání hlásek',
    pronunciationConsonants: 'Souhlásky',
    pronunciationVowels: 'Samohlásky',
    noAudio: 'No audio',
    loadingError: 'Loading error',
    playAllRandomly: 'Play all randomly',
    playSelectedRandomly: 'Play selected randomly',
    selectAllPronunciationWords: 'Select all words',
    selectPronunciationWord: 'Select word',
    clickToRevealRandomWord: 'Reveal word',
    playNextRandomWordTooltip: 'Play next random word',
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
        contrast_class: 'vowel',
        isActive: true,
        examples: ['man', 'men'],
        unlocked_count: 2,
        total_count: 3,
      },
    ];

    render(<PronunciationOverview />);

    fireEvent.click(screen.getByTestId('close'));
    expect(mocks.navigate).toHaveBeenCalledWith('/overviews', { replace: true });

    fireEvent.click(screen.getByRole('button', { name: /æ/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/pronunciation/1');
  });

  it('places comparison groups using their database-derived class', () => {
    mocks.overviewData = [
      {
        id: 1,
        name: '/p/ | /t/',
        contrast_class: 'vowel',
        isActive: true,
        examples: [],
        unlocked_count: 0,
        total_count: 0,
      },
      {
        id: 2,
        name: '/ɪ/ | /ɛ/',
        contrast_class: 'consonant',
        isActive: true,
        examples: [],
        unlocked_count: 0,
        total_count: 0,
      },
    ];

    render(<PronunciationOverview />);

    const vowelSection = screen.getByText('Samohlásky').closest('section');
    const consonantSection = screen.getByText('Souhlásky').closest('section');
    expect(vowelSection).not.toBeNull();
    expect(consonantSection).not.toBeNull();
    expect(within(vowelSection!).getByRole('button', { name: '/p/ | /t/' })).toBeTruthy();
    expect(within(consonantSection!).getByRole('button', { name: '/ɪ/ | /ɛ/' })).toBeTruthy();
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
