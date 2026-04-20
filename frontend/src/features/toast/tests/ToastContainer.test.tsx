import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  message: '',
  type: 'info' as 'success' | 'error' | 'info',
  visible: false,
  toastProps: [] as Array<{ children: string; type?: string }>,
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (
    selector: (state: {
      message: string;
      type: 'success' | 'error' | 'info';
      visible: boolean;
    }) => unknown,
  ) =>
    selector({
      message: mocks.message,
      type: mocks.type,
      visible: mocks.visible,
    }),
}));

vi.mock('@/features/toast/Toast', () => ({
  default: ({ children, type }: { children: string; type?: string }) => {
    mocks.toastProps.push({ children, type });
    return <div data-testid="toast">{children}</div>;
  },
}));

import ToastContainer from '@/features/toast/ToastContainer';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.message = '';
    mocks.type = 'info';
    mocks.visible = false;
    mocks.toastProps = [];
  });

  it('renders null when toast is not visible', () => {
    const { container } = render(<ToastContainer />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('renders Toast with message and type when visible', () => {
    mocks.visible = true;
    mocks.message = 'Done';
    mocks.type = 'success';

    render(<ToastContainer />);

    expect(screen.getByTestId('toast')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(mocks.toastProps).toEqual([{ children: 'Done', type: 'success' }]);
  });
});
