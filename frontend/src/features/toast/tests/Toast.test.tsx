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

  it('renders message text with success style', () => {
    const { container } = render(<Toast type="success">Saved</Toast>);

    expect(screen.getByText('Saved')).toBeTruthy();
    const toastDiv = container.firstElementChild as HTMLElement;
    expect(toastDiv.className.includes('bg-success-light')).toBe(true);
  });

  it('uses info style by default', () => {
    const { container } = render(<Toast>Info message</Toast>);

    const toastDiv = container.firstElementChild as HTMLElement;
    expect(toastDiv.className.includes('bg-info-light')).toBe(true);
  });

  it('hides toast on click and stops propagation', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <Toast type="error">Close me</Toast>
      </div>,
    );

    fireEvent.click(screen.getByText('Close me'));

    expect(mocks.hideToast).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
