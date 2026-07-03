import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import HeaderButton from '@/components/UI/buttons/HeaderButton';

describe('HeaderButton', () => {
  it('renders header hover and focus affordances for active navigation buttons', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <HeaderButton to="/home" title="Home">
          <span>home</span>
        </HeaderButton>
      </MemoryRouter>,
    );

    const button = screen.getByRole('link');

    expect(button.className).toContain('hover:bg-button-hover');
    expect(button.className).toContain('focus-visible:bg-button-hover');
    expect(button.className).toContain('rounded-full');
  });
});
