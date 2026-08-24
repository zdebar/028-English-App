import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prompt: vi.fn(),
  setPromptEvent: vi.fn(),
  clearPromptEvent: vi.fn(),
}));

const promptEvent = { prompt: mocks.prompt, userChoice: Promise.resolve() };

vi.mock('@/features/pwa/use-pwa-store', () => ({
  usePwaStore: (selector: (state: object) => unknown) =>
    selector({
      promptEvent,
      setPromptEvent: mocks.setPromptEvent,
      clearPromptEvent: mocks.clearPromptEvent,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a semantic button and forwards the shared action style', () => {
    render(<InstallPWAButton className="home-action" />);

    const action = screen.getByRole('button', { name: 'Nainstalovat aplikaci' });
    expect(action.getAttribute('type')).toBe('button');
    expect(action.className).toContain('home-action');
  });

  it('opens the install prompt and clears it after the choice resolves', async () => {
    render(<InstallPWAButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Nainstalovat aplikaci' }));

    expect(mocks.prompt).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mocks.clearPromptEvent).toHaveBeenCalledTimes(1));
  });
});
