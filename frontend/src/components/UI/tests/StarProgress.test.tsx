import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StarRow } from '@/components/UI/StarProgress';

describe('StarProgress', () => {
  it('renders compacted badges in gold, silver, bronze order', () => {
    const { container } = render(<StarRow starCount={25} starsPerRow={10} size={22} />);

    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getAllByText(/^(10|5)$/).every((badge) => badge.classList.contains('z-star-badge'))).toBe(
      true,
    );
    expect(
      Array.from(
        container.querySelectorAll(
          'svg.star-fill-gold, svg.star-fill-silver, svg.star-fill-bronze',
        ),
      ).map((star) => star.getAttribute('class')),
    ).toEqual(['star-fill-gold', 'star-fill-silver', 'star-fill-bronze']);
  });

  it('accumulates completed stars beyond silver in the gold badge', () => {
    render(<StarRow starCount={35} starsPerRow={10} size={22} />);

    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.queryByText('5')).toBeNull();
  });

  it('renders one empty star before the first earned star', () => {
    const { container } = render(<StarRow starCount={0} size={22} />);

    expect(container.querySelectorAll('svg.star-empty-border')).toHaveLength(1);
    expect(container.querySelectorAll('svg.star-fill-bronze')).toHaveLength(0);
  });
});
