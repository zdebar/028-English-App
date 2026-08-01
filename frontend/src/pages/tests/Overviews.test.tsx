import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  availability: {} as any,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLoaderData: () => ({}),
}));

vi.mock('@/routing/prefetch-navigation', () => ({
  PrefetchButton: ({ to, children, ...props }: any) => (
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

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    overviews: 'Přehledy',
    progressOverviews: 'Pokrok',
    pronunciationSettings: 'Výslovnost',
    practiceOverviewTitle: 'Přehled procvičování',
    levelsOverview: 'Přehled CEFR úrovní',
    levelsOverviewTooltip: 'CEFR tooltip',
    grammarOverview: 'Přehled gramatiky',
    grammarOverviewTooltip: 'Grammar tooltip',
    topicsOverview: 'Přehled témat',
    topicsOverviewTooltip: 'Topics tooltip',
    vocabularyOverview: 'Přehled slovíček',
    vocabularyOverviewTooltip: 'Vocabulary tooltip',
    pronunciationGroups: 'Skupiny výslovnosti',
    pronunciationGroupsTooltip: 'Pronunciation tooltip',
    practiceOverviewNone: 'No practice',
    noDashboardData: 'No levels',
    noGrammar: 'No grammar',
    noTopics: 'No topics',
    noStartedVocabulary: 'No vocabulary',
    noPronunciationGroups: 'No pronunciation groups',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
  },
}));

import Overviews from '@/pages/Overviews';

const overviewKeys = [
  'practice',
  'levels',
  'grammar',
  'topics',
  'vocabulary',
  'pronunciation',
];

describe('Overviews', () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.availability = Object.fromEntries(
      overviewKeys.map((key) => [key, { hasData: true, loading: false, error: null }]),
    );
  });

  it('separates progress overviews from pronunciation configuration', () => {
    render(<Overviews />);

    const progress = screen.getByRole('region', { name: 'Pokrok' });
    const pronunciation = screen.getByRole('region', { name: 'Výslovnost' });

    expect(within(progress).getAllByRole('button')).toHaveLength(5);
    expect(within(pronunciation).getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'Pokrok' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Výslovnost' })).toBeNull();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
    buttons.forEach((button) => expect(button.className).toContain('w-full'));
  });

  it('keeps all empty overviews visible but disabled with explanatory tooltips', () => {
    Object.values(mocks.availability).forEach((state: any) => {
      state.hasData = false;
    });

    render(<Overviews />);

    const expectedTitles = [
      'No practice',
      'No levels',
      'No grammar',
      'No topics',
      'No vocabulary',
      'No pronunciation groups',
    ];
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
    buttons.forEach((button, index) => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      expect(button.title).toBe(expectedTitles[index]);
      fireEvent.click(button);
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('uses loading and error tooltips while availability is unresolved', () => {
    mocks.availability.practice = { hasData: false, loading: true, error: null };
    mocks.availability.grammar = {
      hasData: false,
      loading: false,
      error: new Error('boom'),
    };

    render(<Overviews />);

    expect(screen.getByRole('button', { name: 'Přehled procvičování' }).title).toBe('Loading');
    expect(screen.getByRole('button', { name: 'Přehled gramatiky' }).title).toBe(
      'Loading error',
    );
  });

  it.each([
    ['Přehled procvičování', '/practice-overview'],
    ['Přehled CEFR úrovní', '/levels'],
    ['Přehled gramatiky', '/grammar'],
    ['Přehled témat', '/topics'],
    ['Přehled slovíček', '/vocabulary'],
    ['Skupiny výslovnosti', '/pronunciation'],
  ])('navigates from %s to %s', (buttonName, route) => {
    render(<Overviews />);

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(mocks.navigate).toHaveBeenCalledWith(route);
  });
});
