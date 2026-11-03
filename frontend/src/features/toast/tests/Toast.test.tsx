import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARIA_TEXTS } from '@/locales/cs';

const mocks = vi.hoisted(() => ({
  hideToast: vi.fn(),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { hideToast: typeof mocks.hideToast }) => unknown) =>
    selector({ hideToast: mocks.hideToast }),
}));

import Toast from '@/features/toast/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides toast using the labelled dismiss button', () => {
    render(<Toast type="error" message="Close me" />);

    fireEvent.click(screen.getByRole('button', { name: ARIA_TEXTS.dismissNotification }));

    expect(mocks.hideToast).toHaveBeenCalledTimes(1);
  });
});
