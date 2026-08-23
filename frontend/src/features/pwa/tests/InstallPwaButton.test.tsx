import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const promptEvent = {
  prompt: vi.fn(),
  userChoice: Promise.resolve(),
};

vi.mock('@/features/pwa/use-pwa-store', () => ({
  usePwaStore: (selector: (state: object) => unknown) =>
    selector({
      promptEvent,
      setPromptEvent: vi.fn(),
      clearPromptEvent: vi.fn(),
    }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    installButton: 'Nainstalovat aplikaci',
    installButtonTooltip: 'Instalovat',
  },
}));

import { InstallPWAButton } from '@/features/pwa/InstallPwaButton';

describe('InstallPWAButton', () => {
  it('uses the clickable info-heading style', () => {
    render(<InstallPWAButton />);

    const action = screen.getByText('Nainstalovat aplikaci');
    expect(action.className).toContain('font-headings');
    expect(action.className).toContain('text-lg');
    expect(action.className).toContain('color-info');
  });
});
