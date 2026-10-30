import { fireEvent, render, screen } from '@testing-library/react';
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

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    overviews: 'Přehledy',
    progressOverviews: 'Pokrok',
    soundsOverview: 'Sound overview',
    grammarOverview: 'Přehled gramatiky',
    grammarOverviewTooltip: 'Grammar tooltip',
    topicsOverview: 'Přehled témat',
    topicsOverviewTooltip: 'Topics tooltip',
    vocabularyOverview: 'Přehled slovíček',
    vocabularyOverviewTooltip: 'Vocabulary tooltip',
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

const overviewKeys = ['grammar', 'topics', 'vocabulary'];

describe('Overviews', () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.availability = Object.fromEntries(
      overviewKeys.map((key) => [key, { hasData: true, loading: false, error: null }]),
    );
  });

  it('keeps all empty overviews visible but disabled with explanatory tooltips', () => {
    Object.values(mocks.availability).forEach((state: any) => {
      state.hasData = false;
    });
    render(<Overviews />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(false);
    expect(buttons.slice(1).every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    buttons.slice(1).forEach((button) => fireEvent.click(button));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['Sound overview', '/sounds'],
    ['Přehled gramatiky', '/grammar'],
    ['Přehled témat', '/topics'],
    ['Přehled slovíček', '/vocabulary'],
  ])('navigates from %s to %s', (buttonName, route) => {
    render(<Overviews />);

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(mocks.navigate).toHaveBeenCalledWith(route);
  });
});
