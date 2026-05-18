import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  state: {
    data: [] as Array<{ id: number; name: string }>,
    error: null as string | null,
    loading: false,
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/database/models/blocks', () => ({
  default: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/hooks/use-array', () => ({
  useArray: () => ({
    data: mocks.state.data,
    error: mocks.state.error,
    loading: mocks.state.loading,
    hasData: mocks.state.data.length > 0,
  }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingMessage: 'Loading',
    blocksOverview: 'Blocks overview',
    noBlocks: 'No blocks',
  },
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/Notification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/buttons/ListButton', () => ({
  ListButton: ({ children, onClick }: any) => (
    <button data-testid="block-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

import BlocksOverview from '@/features/blocks/BlocksOverview';

describe('BlocksOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.data = [];
    mocks.state.error = null;
    mocks.state.loading = false;
  });

  it('renders loading state', () => {
    mocks.state.loading = true;

    render(<BlocksOverview />);

    expect(screen.queryByText('No blocks')).toBeNull();
  });

  it('renders empty state when there are no blocks', () => {
    render(<BlocksOverview />);

    expect(screen.getByText('No blocks')).toBeTruthy();
  });

  it('renders block list and navigates to block detail on click', () => {
    mocks.state.data = [
      { id: 1, name: 'Dny v tydnu' },
      { id: 2, name: 'Mesice' },
    ];

    render(<BlocksOverview />);

    const buttons = screen.getAllByTestId('block-button');
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);
    expect(mocks.navigate).toHaveBeenCalledWith('/blocks/2');
  });

  it('navigates to profile on close', () => {
    render(<BlocksOverview />);

    fireEvent.click(screen.getByTestId('close-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/profile');
  });

  it('renders empty state when data loading fails', () => {
    mocks.state.error = 'Load error';

    render(<BlocksOverview />);

    expect(screen.getByText('No blocks')).toBeTruthy();
  });
});
