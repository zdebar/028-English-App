import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  closeOverlay: vi.fn(),
  openOverlay: vi.fn(),
}));

vi.mock('@/features/overlay/use-overlay-store', () => ({
  useOverlayStore: (selector: (state: any) => unknown) =>
    selector({
      closeOverlay: mocks.closeOverlay,
      openOverlay: mocks.openOverlay,
    }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
}));

vi.mock('../../components/UI/buttons/ButtonRectangular', () => ({
  default: ({ onClick, children }: any) => <button onClick={onClick}>{children}</button>,
}));

import { Modal } from '@/features/modal/Modal';

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!document.getElementById('root')) {
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
  });

  it('renders children and action buttons', () => {
    render(
      <Modal onConfirm={vi.fn()} onClose={vi.fn()}>
        <p>Body text</p>
      </Modal>,
    );

    expect(screen.getByText('Body text')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('opens overlay on mount with onClose callback', () => {
    const onClose = vi.fn();

    render(
      <Modal onConfirm={vi.fn()} onClose={onClose}>
        content
      </Modal>,
    );

    expect(mocks.openOverlay).toHaveBeenCalledWith(onClose);
  });

  it('calls closeOverlay on cancel', () => {
    render(
      <Modal onConfirm={vi.fn()} onClose={vi.fn()}>
        content
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and then closeOverlay on confirm', () => {
    const onConfirm = vi.fn();

    render(
      <Modal onConfirm={onConfirm} onClose={vi.fn()}>
        content
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(mocks.closeOverlay).toHaveBeenCalledTimes(1);
  });

  it('returns null when root element is not present', () => {
    const root = document.getElementById('root');
    root?.remove();

    const { container } = render(
      <Modal onConfirm={vi.fn()} onClose={vi.fn()}>
        content
      </Modal>,
    );

    expect(container.firstChild).toBeNull();
  });
});
