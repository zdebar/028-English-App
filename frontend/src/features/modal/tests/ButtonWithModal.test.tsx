import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isLoading: false,
  setIsLoading: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    buttons: {
      minLoadingTime: 300,
    },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    modalTitle: 'Default title',
    modalText: 'Default text',
  },
}));

vi.mock('@/features/modal/use-min-loading', () => ({
  useMinLoading: () => ({
    isLoading: mocks.isLoading,
    setIsLoading: mocks.setIsLoading,
  }),
}));

vi.mock('@/features/modal/Modal', () => ({
  Modal: ({ onConfirm, onClose, children }: any) => (
    <div data-testid="modal">
      <div>{children}</div>
      <button data-testid="modal-confirm" onClick={() => void onConfirm?.()}>
        confirm
      </button>
      <button data-testid="modal-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

import ModalButton from '@/features/modal/ModalButton';

describe('ButtonWithModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLoading = false;
  });

  it('renders trigger button and opens modal on click with default text', () => {
    render(<ModalButton>Open</ModalButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByText('Default title')).toBeTruthy();
    expect(screen.getByText('Default text')).toBeTruthy();
  });

  it('uses custom modal title and text', () => {
    render(
      <ModalButton modalTitle="Custom title" modalText="Custom text">
        Open
      </ModalButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByText('Custom title')).toBeTruthy();
    expect(screen.getByText('Custom text')).toBeTruthy();
  });

  it('runs onConfirm and toggles loading states', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<ModalButton onConfirm={onConfirm}>Open</ModalButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(mocks.setIsLoading).toHaveBeenCalledWith(true);
      expect(mocks.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  it('disables trigger when disabled prop is true', () => {
    render(<ModalButton disabled>Open</ModalButton>);

    expect(screen.getByRole('button', { name: 'Open' }).hasAttribute('disabled')).toBe(true);
  });

  it('disables trigger when loading is active', () => {
    mocks.isLoading = true;
    render(<ModalButton>Open</ModalButton>);

    expect(screen.getByRole('button', { name: 'Open' }).hasAttribute('disabled')).toBe(true);
  });
});
