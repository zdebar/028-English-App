import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadTheme: vi.fn(),
}));

vi.mock('@/features/theme/use-theme-store', () => ({
  useThemeStore: (selector: (state: { loadTheme: typeof mocks.loadTheme }) => unknown) =>
    selector({ loadTheme: mocks.loadTheme }),
}));

import { useThemeLoader } from '@/features/theme/use-theme-loader';

describe('useThemeLoader', () => {
  beforeEach(() => {
    mocks.loadTheme.mockReset();
  });

  it('waits for authentication before loading a theme', () => {
    const { rerender } = renderHook(
      ({ userId, loading }: { userId: string | null; loading: boolean }) =>
        useThemeLoader(userId, loading),
      { initialProps: { userId: null as string | null, loading: true } },
    );

    expect(mocks.loadTheme).not.toHaveBeenCalled();

    rerender({ userId: 'u1', loading: false });

    expect(mocks.loadTheme).toHaveBeenCalledOnce();
    expect(mocks.loadTheme).toHaveBeenCalledWith('u1');
  });

  it('loads the guest theme after unauthenticated auth resolution', () => {
    renderHook(() => useThemeLoader(null, false));

    expect(mocks.loadTheme).toHaveBeenCalledOnce();
    expect(mocks.loadTheme).toHaveBeenCalledWith(null);
  });
});
