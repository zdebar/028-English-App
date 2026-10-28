import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sounds: [] as any[],
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: 'u1' }),
}));

vi.mock('@/features/logging/use-query-error-toast', () => ({
  useQueryErrorToast: vi.fn(),
}));

vi.mock('@/hooks/overview-query-store', () => ({
  getOverviewQuery: () => () => Promise.resolve(mocks.sounds),
  overviewQueryKey: () => 'sounds',
}));

vi.mock('@/hooks/use-live-query-data', () => ({
  useLiveQueryData: () => ({ data: mocks.sounds, error: null }),
}));

vi.mock('@/routing/use-route-close', () => ({
  useRouteClose: () => vi.fn(),
}));

vi.mock('@/routing/data-navigation', () => ({
  NavigationButton: ({ to, children, ...props }: any) => (
    <button data-to={to} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/StackedList', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    soundsOverview: 'Přehled hlásek',
    shortVowels: 'krátké samohlásky',
    longVowels: 'dlouhé samohlásky',
    doubleVowelSounds: 'dvojhlásky',
    voicelessConsonants: 'neznělé souhlásky',
    voicedConsonants: 'znělé souhlásky',
    otherConsonants: 'ostatní souhlásky',
  },
}));

import SoundsOverview from '../SoundsOverview';

describe('SoundsOverview', () => {
  beforeEach(() => {
    mocks.sounds = [];
  });

  it('renders the database phonemes in their database categories and order', () => {
    mocks.sounds = [
      {
        id: 10,
        type: 'sound',
        name: 'ɘ',
        note: null,
        sort_order: 26,
        updated_at: '2026-01-01',
        deleted_at: null,
        sound_class: 'vowel',
        sound_category: 'short_vowel',
        isActive: true,
      },
      {
        id: 11,
        type: 'sound',
        name: 'ɪ',
        note: null,
        sort_order: 27,
        updated_at: '2026-01-01',
        deleted_at: null,
        sound_class: 'vowel',
        sound_category: 'short_vowel',
        isActive: false,
      },
    ];

    render(<SoundsOverview />);

    const shortVowels = screen.getByText('krátké samohlásky').closest('section');
    expect(shortVowels).not.toBeNull();
    const buttons = within(shortVowels!).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['ɘ', 'ɪ']);
    expect(buttons[0]?.getAttribute('data-to')).toBe('/sounds/10');
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
    expect(within(shortVowels!).queryByRole('button', { name: 'ɛ' })).toBeNull();
  });
});
