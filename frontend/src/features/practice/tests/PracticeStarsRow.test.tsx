import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PracticeStarsRow from '@/features/practice/components/PracticeStarsRow';

describe('PracticeStarsRow', () => {
  it('shows numbered progress without a filling star', () => {
    const { container } = render(
      <PracticeStarsRow
        starCount={1}
        displayedChunkCount={5}
        starChunk={50}
        starsPerRow={10}
      />,
    );

    expect(screen.getByText(/5\s*\/\s*50/)).toBeTruthy();
    expect(container.querySelector('.z-star-current')).toBeNull();
    expect(container.querySelector('.star-fill-bronze')).toBeTruthy();
  });
});
