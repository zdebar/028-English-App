import { NavigationButton, NavigationLink } from '@/routing/data-navigation';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

function LocationView() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('navigation controls', () => {
  it('navigates immediately without loading route data', () => {
    render(
      <MemoryRouter initialEntries={['/current']}>
        <NavigationButton to="/next">Next</NavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByTestId('location').textContent).toBe('/next');
  });

  it('does not navigate when the button handler prevents the default action', () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault());
    render(
      <MemoryRouter initialEntries={['/current']}>
        <NavigationButton to="/next" onClick={onClick}>
          Next
        </NavigationButton>
        <LocationView />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByTestId('location').textContent).toBe('/current');
  });

  it('preserves normal link navigation behavior', () => {
    render(
      <MemoryRouter initialEntries={['/current']}>
        <NavigationLink to="/next">Next link</NavigationLink>
        <LocationView />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Next link' }));

    expect(screen.getByTestId('location').textContent).toBe('/next');
  });
});
