import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  availability: {} as any,
  pronunciationGroups: [] as unknown[],
  pronunciationLoading: false,
  pronunciationError: null as Error | null,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLoaderData: () => ({}),
}));

vi.mock('@/routing/data-navigation', () => ({
  DataNavigationButton: ({ to, children, ...props }: any) => (
    <button type="button" {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) => selector({ userId: 'u1' }),
}));

vi.mock('@/hooks/use-overview-availability', () => ({
  useOverviewAvailability: () => mocks.availability,
}));

vi.mock('@/features/pronunciation/use-pronunciation-groups-store', () => ({
  usePronunciationGroupsStore: (
    selector: (state: {
      groups: unknown[];
      loading: boolean;
      error: Error | null;
    }) => unknown,
  ) =>
    selector({
      groups: mocks.pronunciationGroups,
      loading: mocks.pronunciationLoading,
      error: mocks.pronunciationError,
    }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    overviews: 'Přehledy',
    progressOverviews: 'Pokrok',
    practiceOverviewTitle: 'Přehled procvičování',
    grammarOverview: 'Přehled gramatiky',
    grammarOverviewTooltip: 'Grammar tooltip',
    topicsOverview: 'Přehled témat',
    topicsOverviewTooltip: 'Topics tooltip',
    vocabularyOverview: 'Přehled slovíček',
    vocabularyOverviewTooltip: 'Vocabulary tooltip',
    pronunciationSettings: 'Výslovnost',
    pronunciationGroupsTooltip: 'Pronunciation tooltip',
    practiceOverviewNone: 'No practice',
    noGrammar: 'No grammar',
    noTopics: 'No topics',
    noStartedVocabulary: 'No vocabulary',
    noPronunciationGroups: 'No pronunciation groups',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
  },
}));

import Overviews from '@/pages/Overviews';

const overviewKeys = ['grammar', 'topics', 'vocabulary'];

describe('Overviews', () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.availability = Object.fromEntries(
      overviewKeys.map((key) => [key, { hasData: true, loading: false, error: null }]),
    );
    mocks.pronunciationGroups = [{}];
    mocks.pronunciationLoading = false;
    mocks.pronunciationError = null;
  });

  it('renders the four progress overviews without levels or practice', () => {
    render(<Overviews />);

    const progress = screen.getByRole('region', { name: 'Pokrok' });

    expect(within(progress).getAllByRole('button')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /CEFR/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Přehled procvičování' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Pokrok' })).toBeNull();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    buttons.forEach((button) => expect(button.className).toContain('w-full'));
  });

  it('keeps all empty overviews visible but disabled with explanatory tooltips', () => {
    Object.values(mocks.availability).forEach((state: any) => {
      state.hasData = false;
    });
    mocks.pronunciationGroups = [];

    render(<Overviews />);

    const expectedTitles = [
      'No grammar',
      'No topics',
      'No vocabulary',
      'No pronunciation groups',
    ];
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    buttons.forEach((button, index) => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      expect(button.title).toBe(expectedTitles[index]);
      fireEvent.click(button);
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('uses loading and error tooltips while availability is unresolved', () => {
    mocks.availability.topics = { hasData: false, loading: true, error: null };
    mocks.availability.grammar = {
      hasData: false,
      loading: false,
      error: new Error('boom'),
    };
    mocks.pronunciationLoading = false;
    mocks.pronunciationError = new Error('pronunciation boom');

    render(<Overviews />);

    expect(screen.getByRole('button', { name: 'Přehled témat' }).title).toBe('Loading');
    expect(screen.getByRole('button', { name: 'Přehled gramatiky' }).title).toBe(
      'Loading error',
    );
    expect(screen.getByRole('button', { name: 'Výslovnost' }).title).toBe('Loading error');
  });

  it('disables the pronunciation overview while group availability is loading', () => {
    mocks.pronunciationGroups = [];
    mocks.pronunciationLoading = true;

    render(<Overviews />);

    const button = screen.getByRole('button', { name: 'Výslovnost' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe('Loading');
  });

  it.each([
    ['Přehled gramatiky', '/grammar'],
    ['Přehled témat', '/topics'],
    ['Přehled slovíček', '/vocabulary'],
    ['Výslovnost', '/pronunciation'],
  ])('navigates from %s to %s', (buttonName, route) => {
    render(<Overviews />);

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(mocks.navigate).toHaveBeenCalledWith(route);
  });
});
