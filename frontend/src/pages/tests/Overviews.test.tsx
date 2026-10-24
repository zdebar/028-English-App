import { fireEvent, render, screen } from '@testing-library/react';
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
  NavigationButton: ({ to, children, ...props }: any) => (
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
    soundsOverview: 'Sound overview',
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
    noSounds: 'No sounds',
    noTopics: 'No topics',
    noStartedVocabulary: 'No vocabulary',
    noPronunciationGroups: 'No pronunciation groups',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
  },
}));

import Overviews from '@/pages/Overviews';

const overviewKeys = ['grammar', 'topics', 'vocabulary', 'sounds'];

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

  it('keeps all empty overviews visible but disabled with explanatory tooltips', () => {
    Object.values(mocks.availability).forEach((state: any) => {
      state.hasData = false;
    });
    mocks.pronunciationGroups = [];

    render(<Overviews />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
    expect(buttons.slice(0, 2).every((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
    expect(buttons.slice(2, 5).every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    expect((buttons[5] as HTMLButtonElement).disabled).toBe(false);
    buttons.slice(2, 5).forEach((button) => fireEvent.click(button));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('keeps the pronunciation overview available while group availability is loading', () => {
    mocks.pronunciationGroups = [];
    mocks.pronunciationLoading = true;

    render(<Overviews />);

    const button = screen.getByRole('button', { name: 'Výslovnost' }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it.each([
    ['Sound overview', '/sounds'],
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
