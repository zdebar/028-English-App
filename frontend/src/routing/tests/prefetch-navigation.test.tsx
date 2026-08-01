import { PrefetchButton, PrefetchLink } from '@/routing/prefetch-navigation';
import { resetRouteDataCache } from '@/routing/route-data-cache';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, useLocation, MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { showToast, reportError } = vi.hoisted(() => ({
  showToast: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof showToast }) => unknown) =>
    selector({ showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({ reportError }));

function LocationView() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('prefetch navigation controls', () => {
  afterEach(() => {
    resetRouteDataCache();
    vi.clearAllMocks();
  });

  it('prefetches on hover and waits for the same request before navigating', async () => {
    const request = deferred<string>();
    const load = vi.fn(() => request.promise);
    render(
      <MemoryRouter initialEntries={['/current']}>
        <PrefetchButton to="/next" descriptor={{ key: 'next:user', load }}>
          Next
        </PrefetchButton>
        <Link to="/current">Back</Link>
        <LocationView />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Next' });
    fireEvent.pointerEnter(button);
    fireEvent.click(button);

    await waitFor(() => expect(load).toHaveBeenCalledOnce());
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByTestId('location').textContent).toBe('/current');

    request.resolve('ready');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/next'));
    expect(button.getAttribute('aria-busy')).toBe('false');

    fireEvent.click(screen.getByRole('link', { name: 'Back' }));
    expect(screen.getByTestId('location').textContent).toBe('/current');
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/next'));
    expect(load).toHaveBeenCalledOnce();
  });

  it('logs hover failure without a toast, then retries and toasts a click failure', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('hover failed'))
      .mockRejectedValueOnce(new Error('click failed'));
    render(
      <MemoryRouter initialEntries={['/current']}>
        <PrefetchButton to="/next" descriptor={{ key: 'next:user', load }}>
          Next
        </PrefetchButton>
        <LocationView />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Next' });
    fireEvent.pointerEnter(button);
    await waitFor(() => expect(reportError).toHaveBeenCalledTimes(1));
    expect(showToast).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('location').textContent).toBe('/current');
    expect(button.getAttribute('aria-busy')).toBe('false');
  });

  it('preserves modified-link navigation behavior without starting click-time loading', () => {
    const load = vi.fn().mockResolvedValue('ready');
    render(
      <MemoryRouter initialEntries={['/current']}>
        <PrefetchLink to="/next" descriptor={{ key: 'next:user', load }}>
          Next link
        </PrefetchLink>
        <LocationView />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Next link' }), { ctrlKey: true });
    expect(load).not.toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toBe('/current');
  });
});
