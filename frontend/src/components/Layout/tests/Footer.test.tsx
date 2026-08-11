import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/privacy-policy/PrivacyPolicyLink', () => ({
  default: () => <a href="/privacy">Privacy</a>,
}));

import Footer, { resolveFooterVisibility } from '@/components/Layout/Footer';

describe('Footer', () => {
  it('renders current year and privacy link', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String.raw`©\s*${currentYear}`))).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeTruthy();
  });

  it('does not hide globally based on landscape orientation', () => {
    const { container } = render(<Footer />);

    expect(container.querySelector('footer')?.className).not.toContain('landscape:hidden');
  });
});

describe('resolveFooterVisibility', () => {
  const baseMeasurements = {
    constrainToPracticeSession: true,
    viewportHeight: 588,
    maxCardHeight: 400,
    headerHeight: 84,
    secondaryControlsHeight: 52,
    footerHeight: 52,
    headerLayout: 'top' as const,
    secondaryLayout: 'bottom' as const,
  };

  it('always shows the footer outside an active practice session', () => {
    expect(
      resolveFooterVisibility({
        ...baseMeasurements,
        constrainToPracticeSession: false,
        viewportHeight: 1,
      }),
    ).toBe(true);
  });

  it('shows at the exact top-header and bottom-controls threshold', () => {
    expect(resolveFooterVisibility(baseMeasurements)).toBe(true);
    expect(
      resolveFooterVisibility({ ...baseMeasurements, viewportHeight: 587 }),
    ).toBe(false);
  });

  it('does not reserve header or secondary-control height when both are beside the card', () => {
    const sideLayout = {
      ...baseMeasurements,
      viewportHeight: 452,
      headerLayout: 'side' as const,
      secondaryLayout: 'side' as const,
    };

    expect(resolveFooterVisibility(sideLayout)).toBe(true);
    expect(resolveFooterVisibility({ ...sideLayout, viewportHeight: 451 })).toBe(false);
  });
});
