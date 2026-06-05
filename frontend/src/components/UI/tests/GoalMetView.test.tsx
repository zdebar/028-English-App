import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GoalMetView from '@/components/UI/GoalMetView';

describe('GoalMetView', () => {
  it('renders success styling when goal is met', () => {
    const { container } = render(<GoalMetView current={10} goal={10} title="progress" />);

    expect(screen.getByText('10 / 10')).toBeTruthy();
    const element = container.querySelector('p');
    expect(element?.className).toContain('text-success-light');
    expect(element?.className).toContain('font-bold');
  });

  it('renders error styling when goal is not met', () => {
    const { container } = render(<GoalMetView current={2} goal={10} />);

    expect(screen.getByText('2 / 10')).toBeTruthy();
    const element = container.querySelector('p');
    expect(element?.className).toContain('text-error-light');
  });
});
