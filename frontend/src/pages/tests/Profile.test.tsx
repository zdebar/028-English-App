import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userEmail: string }) => unknown) =>
    selector({ userEmail: 'user@example.com' }),
}));

vi.mock('@/components/UI/PropertyView', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/auth/SignoutButton', () => ({
  default: () => <button type="button">Odhlásit</button>,
}));

vi.mock('@/features/auth/DeleteUserButton', () => ({
  default: () => <button type="button">Smazat účet</button>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    profileEmailLabel: 'E-mail',
    notAvailable: 'Nedostupné',
  },
}));

import Profile from '@/pages/Profile';

describe('Profile', () => {
  it('contains account information and actions without overview navigation', () => {
    render(<Profile />);

    expect(screen.getByText('user@example.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Odhlásit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Smazat účet' })).toBeTruthy();
    expect(screen.queryByText(/Přehled/)).toBeNull();
    expect(screen.queryByText(/Skupiny výslovnosti/)).toBeNull();
  });
});
