import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('hides toast on click and stops propagation', () => {
    render(<Toast type="error">Close me</Toast>);

    fireEvent.click(screen.getByText('Close me'));

    expect(mocks.hideToast).toHaveBeenCalledTimes(1);
  });
});
