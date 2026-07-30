import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  addAvailable: vi.fn(),
  playAudio: vi.fn(),
  reload: vi.fn(),
  overviewData: [] as any[],
  detailData: null as any,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ groupId: '1' }),
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
    addAvailableItems: (...args: unknown[]) => mocks.addAvailable(...args),
  },
}));

vi.mock('@/hooks/use-array', () => ({
  useArray: () => ({
    data: mocks.overviewData,
    loading: false,
    hasData: mocks.overviewData.length > 0,
    error: null,
  }),
}));

vi.mock('@/hooks/use-fetch', () => ({
  useFetch: () => ({
    data: mocks.detailData,
    loading: false,
    error: null,
    reload: mocks.reload,
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
    pronunciationOverview: 'Přehled výslovnosti',
    noPronunciationGroups: 'No groups',
    noPronunciationGroupItems: 'No items',
    pronunciationGroupAdded: 'Přidáno',
    addPronunciationGroup: 'Přidat skupinu',
    noAudio: 'No audio',
    loadingError: 'Loading error',
    pronunciationGroupAddError: 'Add error',
    addToPronunciationHelp: 'přidat do výslovnosti',
    pronunciationStartedHelp: 'započato/celkem položek',
  },
}));

import PronunciationGroupDetail from '../PronunciationGroupDetail';
import PronunciationOverview from '../PronunciationOverview';

describe('Pronunciation overview screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.overviewData = [];
    mocks.detailData = null;
    mocks.addAvailable.mockResolvedValue(2);
    mocks.playAudio.mockResolvedValue(true);
  });

  it('lists visible groups with examples and started/total counts', () => {
    mocks.overviewData = [
      {
        id: 1,
        name: '/æ/ × /e/',
        examples: ['man', 'men'],
        started_count: 2,
        total_count: 3,
      },
    ];

    render(<PronunciationOverview />);

    expect(screen.getByText('/æ/ × /e/')).toBeTruthy();
    expect(screen.getByText('man, men')).toBeTruthy();
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByText('započato/celkem položek')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Help' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /æ/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/pronunciation/1');
  });

  it('plays group items and bulk-adds missing selections', async () => {
    mocks.detailData = {
      group: { id: 1, name: '/æ/ × /e/' },
      items: [
        { item_id: 1, czech: 'muž', english: 'man', pronunciation: 'mæn', audio: 'man.opus' },
        { item_id: 2, czech: 'muži', english: 'men', pronunciation: 'men', audio: 'men.opus' },
      ],
      selected_count: 1,
      available_count: 2,
    };

    render(<PronunciationGroupDetail />);

    fireEvent.click(screen.getByTitle('mæn'));
    await waitFor(() => expect(mocks.playAudio).toHaveBeenCalledWith('man.opus'));

    fireEvent.click(screen.getByRole('button', { name: 'Přidat skupinu' }));
    await waitFor(() => {
      expect(mocks.addAvailable).toHaveBeenCalledWith('u1', 1);
      expect(mocks.reload).toHaveBeenCalled();
    });
    expect(screen.getByText('přidat do výslovnosti')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Help' })).toBeTruthy();
  });

  it('disables bulk addition when the whole group is selected', () => {
    mocks.detailData = {
      group: { id: 1, name: '/æ/ × /e/' },
      items: [{ item_id: 1, czech: 'muž', english: 'man', audio: 'man.opus' }],
      selected_count: 1,
      available_count: 1,
    };

    render(<PronunciationGroupDetail />);

    expect((screen.getByRole('button', { name: 'Přidáno' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
