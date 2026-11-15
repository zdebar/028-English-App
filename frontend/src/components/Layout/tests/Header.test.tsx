import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authState: {
    userId: 'u1' as string | null,
    isAnonymousUser: false,
    userFullName: 'Ada Lovelace' as string | null,
    userEmail: 'ada@example.com' as string | null,
    userPicture: 'https://profiles.example/ada.jpg' as string | null,
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: typeof mocks.authState) => unknown) => selector(mocks.authState),
}));

vi.mock('@/components/UI/buttons/HeaderButton', () => ({
  default: ({ title, disabled, children }: any) => (
    <button type="button" aria-label={title} disabled={disabled}>{children}</button>
  ),
}));

vi.mock('@/components/UI/icons/UserIcon', () => ({
  default: () => <svg data-testid="default-user-icon" />,
}));

vi.mock('@/features/theme/ThemeSwitch', () => ({
  default: () => <button type="button" aria-label="Theme settings" />,
}));

import Header from '@/components/Layout/Header';

describe('Header profile avatar', () => {
  beforeEach(() => {
    mocks.authState = {
      userId: 'u1',
      isAnonymousUser: false,
      userFullName: 'Ada Lovelace',
      userEmail: 'ada@example.com',
      userPicture: 'https://profiles.example/ada.jpg',
    };
  });

  it('shows the Google profile picture when available', () => {
    const { container } = render(<Header />);
    const picture = container.querySelector('img');

    expect(picture?.getAttribute('src')).toBe('https://profiles.example/ada.jpg');
    expect(picture?.className).toContain('size-10');
  });

  it('shows initials with the secondary avatar styling when no picture is available', () => {
    mocks.authState.userPicture = null;

    const { container } = render(<Header />);
    const initials = screen.getByText('AL');

    expect(initials.className).toContain('font-headings');
    expect(initials.className).toContain('bg-info-light');
    expect(initials.className).toContain('size-10');
    expect(container.querySelector('img')).toBeNull();
  });

  it('falls back to initials if the profile picture cannot be loaded', () => {
    const { container } = render(<Header />);
    const picture = container.querySelector('img');

    expect(picture).not.toBeNull();
    fireEvent.error(picture as HTMLImageElement);

    expect(screen.getByText('AL')).toBeTruthy();
  });

  it.each([
    { label: 'anonymous user', userId: 'u1', isAnonymousUser: true },
    { label: 'signed-out user', userId: null, isAnonymousUser: false },
  ])('keeps the default icon and theme settings for a $label', ({ userId, isAnonymousUser }) => {
    mocks.authState.userId = userId;
    mocks.authState.isAnonymousUser = isAnonymousUser;

    render(<Header />);

    expect(screen.getByTestId('default-user-icon')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Theme settings' })).toBeTruthy();
  });
});
