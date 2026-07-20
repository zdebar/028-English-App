import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CompactSummary, StarRow } from '@/components/UI/StarProgress';

describe('StarProgress', () => {
  it('renders compacted badges for full and partial star groups', () => {
    render(<StarRow starCount={25} starsPerRow={10} size={22} />);

    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('accumulates completed stars beyond silver in the gold badge', () => {
    render(<StarRow starCount={35} starsPerRow={10} size={22} />);

    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.queryByText('5')).toBeNull();
  });

  it('renders CompactSummary using fullTierCount and partialTierCount', () => {
    render(<CompactSummary fullTierCount={1} partialTierCount={2} starsPerRow={10} size={22} />);

    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });
});
