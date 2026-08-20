import { DataNavigationButton, DataNavigationLink } from '@/routing/data-navigation';
import { resetPreparedRouteData } from '@/routing/route-data-handoff';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, useLocation } from 'react-router-dom';
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

describe('data navigation controls', () => {
  afterEach(() => {
    resetPreparedRouteData();
    vi.clearAllMocks();
  });

  it('loads only after click by default and waits before navigating', async () => {
    const request = deferred<string>();
    const load = vi.fn(() => request.promise);
    render(
      <MemoryRouter initialEntries={['/current']}>
        <DataNavigationButton to="/next" descriptor={{ key: 'next:user', load }}>
          Next
        </DataNavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Next' });
    fireEvent.pointerEnter(button);
    fireEvent.pointerDown(button);
    fireEvent.focus(button);
    expect(load).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(load).toHaveBeenCalledOnce());
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByTestId('location').textContent).toBe('/current');

    request.resolve('ready');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/next'));
  });

  it('loads the current pronunciation deck after an ignored hover', async () => {
    let deck: string[] = [];
    const load = vi.fn(async () => [...deck]);
    render(
      <MemoryRouter initialEntries={['/current']}>
        <DataNavigationButton
          to="/practice/pronunciation"
          descriptor={{ key: 'pronunciation-practice:user', load }}
        >
          Pronunciation
        </DataNavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Pronunciation' });
    fireEvent.pointerEnter(button);
    expect(load).not.toHaveBeenCalled();

    deck = ['new item'];
    fireEvent.click(button);
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/practice/pronunciation'),
    );
    await expect(load.mock.results[0].value).resolves.toEqual(['new item']);
  });

  it.each(['pointerEnter', 'pointerDown', 'focus'] as const)(
    'starts intent loading on %s and reuses it on click',
    async (trigger) => {
      const request = deferred<string>();
      const load = vi.fn(() => request.promise);
      render(
        <MemoryRouter initialEntries={['/current']}>
          <DataNavigationButton
            to="/next"
            descriptor={{ key: 'next:user', load }}
            strategy="intent"
          >
            Next
          </DataNavigationButton>
          <LocationView />
        </MemoryRouter>,
      );

      const button = screen.getByRole('button', { name: 'Next' });
      fireEvent[trigger](button);
      fireEvent.click(button);
      await waitFor(() => expect(load).toHaveBeenCalledOnce());
      expect(screen.getByTestId('location').textContent).toBe('/current');

      request.resolve('ready');
      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/next'));
    },
  );

  it('uses click as the fallback for intent loading', async () => {
    const load = vi.fn().mockResolvedValue('ready');
    render(
      <MemoryRouter initialEntries={['/current']}>
        <DataNavigationButton
          to="/next"
          descriptor={{ key: 'next:user', load }}
          strategy="intent"
        >
          Next
        </DataNavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/next'));
    expect(load).toHaveBeenCalledOnce();
  });

  it('ignores repeated clicks while loading', async () => {
    const request = deferred<string>();
    const load = vi.fn(() => request.promise);
    render(
      <MemoryRouter initialEntries={['/current']}>
        <DataNavigationButton to="/next" descriptor={{ key: 'next:user', load }}>
          Next
        </DataNavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(load).toHaveBeenCalledOnce());
    request.resolve('ready');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/next'));
  });

  it('stays on the current route and reports a click loading failure', async () => {
    const load = vi.fn().mockRejectedValue(new Error('click failed'));
    render(
      <MemoryRouter initialEntries={['/current']}>
        <DataNavigationButton to="/next" descriptor={{ key: 'next:user', load }}>
          Next
        </DataNavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(button);
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location').textContent).toBe('/current');
    expect(button.getAttribute('aria-busy')).toBe('false');
  });

  it('preserves modified-link navigation without starting click-time loading', () => {
    const load = vi.fn().mockResolvedValue('ready');
    render(
      <MemoryRouter initialEntries={['/current']}>
        <DataNavigationLink to="/next" descriptor={{ key: 'next:user', load }}>
          Next link
        </DataNavigationLink>
        <Link to="/current">Current</Link>
        <LocationView />
      </MemoryRouter>,
    );

    const preventDocumentNavigation = (event: MouseEvent) => event.preventDefault();
    globalThis.addEventListener('click', preventDocumentNavigation);
    try {
      fireEvent.click(screen.getByRole('link', { name: 'Next link' }), { ctrlKey: true });
      expect(load).not.toHaveBeenCalled();
      expect(screen.getByTestId('location').textContent).toBe('/current');
    } finally {
      globalThis.removeEventListener('click', preventDocumentNavigation);
    }
  });
});
