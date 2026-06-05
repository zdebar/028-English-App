import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Card from '@/components/UI/Card';

describe('Card', () => {
  it('renders children and merges custom className', () => {
    const { container } = render(<Card className="custom-class">Body</Card>);

    expect(screen.getByText('Body')).toBeTruthy();
    const element = container.firstElementChild;
    expect(element?.className).toContain('card-width');
    expect(element?.className).toContain('custom-class');
  });
});
