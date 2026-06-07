import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/privacy-policy/PrivacyPolicyLink', () => ({
  default: () => <a href="/privacy">Privacy</a>,
}));

import Footer from '@/components/Layout/Footer';

describe('Footer', () => {
  it('renders current year and privacy link', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String.raw`©\s*${currentYear}`))).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeTruthy();
  });
});
