import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
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
  },
}));

import Overviews from '@/pages/Overviews';

describe('Overviews', () => {
  beforeEach(() => {
    navigate.mockClear();
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

    expect(navigate).toHaveBeenCalledWith(route);
  });
});
