import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/features/privacy-policy/PrivacyPolicyLink', () => ({
  default: () => <a href="/privacy">Privacy</a>,
}));

import Footer from '@/components/Layout/Footer';

function renderFooter(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it.each(['/', '/profile'])('renders its content on %s', (pathname) => {
    renderFooter(pathname);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String.raw`©\s*${currentYear}`))).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeTruthy();
  });

  it.each([
    '/practice',
    '/practice-overview',
    '/overviews',
    '/privacy-policy',
    '/profile/settings',
  ])('does not render on %s', (pathname) => {
    const { container } = renderFooter(pathname);

    expect(container.querySelector('footer')).toBeNull();
  });
});
