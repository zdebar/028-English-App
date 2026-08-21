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
    practiceOverviewNone: 'No practice',
    noGrammar: 'No grammar',
    noTopics: 'No topics',
    noStartedVocabulary: 'No vocabulary',
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
  });

  it('renders only the three progress overviews without levels, practice, or pronunciation', () => {
    render(<Overviews />);

    const progress = screen.getByRole('region', { name: 'Pokrok' });

    expect(within(progress).getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /CEFR/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Přehled procvičování' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Výslovnost' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Pokrok' })).toBeNull();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button.className).toContain('w-full'));
  });

  it('keeps all empty overviews visible but disabled with explanatory tooltips', () => {
    Object.values(mocks.availability).forEach((state: any) => {
      state.hasData = false;
    });

    render(<Overviews />);

    const expectedTitles = ['No grammar', 'No topics', 'No vocabulary'];
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
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

    render(<Overviews />);

    expect(screen.getByRole('button', { name: 'Přehled témat' }).title).toBe('Loading');
    expect(screen.getByRole('button', { name: 'Přehled gramatiky' }).title).toBe(
      'Loading error',
    );
  });

  it.each([
    ['Přehled gramatiky', '/grammar'],
    ['Přehled témat', '/topics'],
    ['Přehled slovíček', '/vocabulary'],
  ])('navigates from %s to %s', (buttonName, route) => {
    render(<Overviews />);

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(mocks.navigate).toHaveBeenCalledWith(route);
  });
});
