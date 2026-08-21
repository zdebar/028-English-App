import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useRouteClose } from '@/routing/use-route-close';

function LocationView() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function CloseRoute() {
  const closeRoute = useRouteClose('/fallback');

  return <button onClick={closeRoute}>Close</button>;
}

function TestRoutes() {
  return (
    <>
      <Routes>
        <Route path="/origin" element={<Link to="/current">Open</Link>} />
        <Route path="/current" element={<CloseRoute />} />
        <Route path="/fallback" element={<p>Fallback</p>} />
      </Routes>
      <LocationView />
    </>
  );
}

describe('useRouteClose', () => {
  it('returns to the previous in-app location', () => {
    render(
      <MemoryRouter initialEntries={['/origin']}>
        <TestRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByTestId('location').textContent).toBe('/origin');
  });

  it('uses the fallback for a direct entry', () => {
    render(
      <MemoryRouter initialEntries={['/current']}>
        <TestRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByTestId('location').textContent).toBe('/fallback');
  });
});
