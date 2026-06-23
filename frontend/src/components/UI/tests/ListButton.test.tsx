import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ListButton } from '@/components/UI/buttons/ListButton';

describe('ListButton', () => {
  it('uses the disabled text color override', () => {
    render(
      <ListButton disabled>
        Level A1
      </ListButton>,
    );

    const button = screen.getByRole('button', { name: 'Level A1' });

    expect(button.className).toContain('preserve-disabled-text-color');
  });
});
