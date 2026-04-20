import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    privacyPolicy: 'Zasady ochrany osobnich udaju',
  },
}));

vi.mock('@/config/routes.config', () => ({
  ROUTES: {
    privacyPolicy: '/privacy-policy',
  },
}));

import PrivacyPolicyLink from '@/features/privacy-policy/PrivacyPolicyLink';

describe('PrivacyPolicyLink', () => {
  it('renders policy link with configured route', () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyLink className="font-bold" />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Zasady ochrany osobnich udaju' });
    expect(link.getAttribute('href')).toBe('/privacy-policy');
    expect(link.className).toContain('font-bold');
  });
});
