import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
}));

import { Modal } from '@/features/modal/Modal';

describe('Modal', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
      },
    });
  });

  it('opens a native modal dialog on mount', () => {
    const { container } = render(
      <Modal onConfirm={vi.fn()} onClose={vi.fn()} ariaLabel="Test dialog">
        content
      </Modal>,
    );

    expect(container.querySelector('dialog')?.open).toBe(true);
  });

  it('closes the dialog and calls onClose when canceled', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal onConfirm={vi.fn()} onClose={onClose} ariaLabel="Test dialog">
        content
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(container.querySelector('dialog')?.open).toBe(false);
  });

  it('awaits confirmation before closing the dialog', async () => {
    let resolveConfirmation: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirmation = resolve;
        }),
    );
    const onClose = vi.fn();

    render(
      <Modal onConfirm={onConfirm} onClose={onClose} ariaLabel="Test dialog">
        content
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Confirm' }).getAttribute('aria-disabled')).toBe('true');

    await act(async () => {
      resolveConfirmation?.();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('prevents repeated confirmation before the component rerenders', () => {
    const onConfirm = vi.fn(() => new Promise<void>(() => undefined));

    render(
      <Modal onConfirm={onConfirm} onClose={vi.fn()} ariaLabel="Test dialog">
        content
      </Modal>,
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
