import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted((): { userId: string | null } => ({
  userId: 'u1',
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/theme/ThemeSwitch', () => ({
  default: () => <div data-testid="theme-switch" />,
}));

vi.mock('@/components/UI/buttons/HeaderButton', () => ({
  default: ({ title, disabled }: { title?: string; disabled?: boolean }) => (
    <button type="button" title={title} disabled={Boolean(disabled)}>
      {title}
    </button>
  ),
}));

vi.mock('@/components/UI/icons/HomeIcon', () => ({ default: () => <span /> }));
vi.mock('@/components/UI/icons/AcademicCapIcon', () => ({ default: () => <span /> }));
vi.mock('@/components/UI/icons/UserIcon', () => ({ default: () => <span /> }));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    tooltipHome: 'Domu',
    tooltipPractice: 'Procvicovat',
    tooltipProfile: 'Profil',
  },
}));

import Header from '@/components/Layout/Header_temp';

describe('Header', () => {
  beforeEach(() => {
    mocks.userId = 'u1';
  });

  it('renders theme switch and all nav buttons', () => {
    render(<Header />);

    expect(screen.getByTestId('theme-switch')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Domu' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Procvicovat' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Profil' })).toBeTruthy();
  });

  it('disables protected actions for anonymous user', () => {
    mocks.userId = null;
    render(<Header />);

    expect(screen.getByRole('button', { name: 'Procvicovat' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Profil' }).hasAttribute('disabled')).toBe(true);
  });
});
