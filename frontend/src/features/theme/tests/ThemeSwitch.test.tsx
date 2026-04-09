import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  theme: 'light' as 'light' | 'dark',
  chooseTheme: vi.fn(),
  userId: 'u1' as string | null,
}));

vi.mock('@/features/theme/use-theme-store', () => ({
  useThemeStore: (
    selector: (state: {
      theme: 'light' | 'dark';
      chooseTheme: typeof mocks.chooseTheme;
    }) => unknown,
  ) => selector({ theme: mocks.theme, chooseTheme: mocks.chooseTheme }),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/locales/cs', () => ({
  ARIA_TEXTS: {
    switchToDarkTheme: 'Light mode',
    switchToLightTheme: 'Dark mode',
  },
}));

vi.mock('@/components/UI/icons/SunIcon', () => ({
  default: () => <span data-testid="sun-icon" />,
}));

vi.mock('@/components/UI/icons/MoonIcon', () => ({
  default: () => <span data-testid="moon-icon" />,
}));

import ThemeSwitch from '@/features/theme/ThemeSwitch';

describe('ThemeSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.theme = 'light';
    mocks.userId = 'u1';
  });

  it('renders light mode UI and toggles to dark on click', () => {
    render(<ThemeSwitch />);

    const button = screen.getByRole('button', { name: 'Light mode' });
    expect(screen.getByTestId('sun-icon')).toBeTruthy();

    fireEvent.click(button);

    expect(mocks.chooseTheme).toHaveBeenCalledWith('dark', 'u1');
  });

  it('renders dark mode UI and toggles to light on click', () => {
    mocks.theme = 'dark';
    render(<ThemeSwitch />);

    const button = screen.getByRole('button', { name: 'Dark mode' });
    expect(screen.getByTestId('moon-icon')).toBeTruthy();

    fireEvent.click(button);

    expect(mocks.chooseTheme).toHaveBeenCalledWith('light', 'u1');
  });

  it('passes undefined user id when user is not authenticated', () => {
    mocks.userId = null;
    render(<ThemeSwitch />);

    fireEvent.click(screen.getByRole('button', { name: 'Light mode' }));

    expect(mocks.chooseTheme).toHaveBeenCalledWith('dark', undefined);
  });
});
